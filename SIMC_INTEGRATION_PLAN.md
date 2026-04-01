# SimulationCraft Service — Standalone Repository Plan

## Context

This plan describes a **separate application** (`clt-simc-service`) deployed on Fly.io that runs SimulationCraft simulations. It communicates with the existing CLT roster management app (Convex + Vercel) via HTTP — receiving sim requests and posting results back via webhook. **No changes to the Vercel deployment are needed.**

The roster management repo will need minor Convex-side additions (schema tables, webhook endpoint, UI) — those are listed at the bottom as a reference but are not part of this repo.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  CLT Roster Management (Vercel + Convex)    │
│                                             │
│  Convex action ──POST /sim──►               │
│                               ┌─────────────┼──────────────────────┐
│                               │  clt-simc-service (Fly.io)        │
│                               │                                    │
│                               │  Express API → Job Queue → SimC   │
│                               │                       │            │
│  Convex HTTP ◄──POST /simc/callback──────────────────┘            │
│  endpoint                     │                                    │
│                               └────────────────────────────────────┘
│  Reactive UI auto-updates     │
└─────────────────────────────────────────────┘
```

---

## Repository Structure: `clt-simc-service/`

```
clt-simc-service/
├── Dockerfile
├── .dockerignore
├── fly.toml
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts          # Express/Hono HTTP server
│   ├── queue.ts           # In-memory job queue with concurrency control
│   ├── simc.ts            # SimC process spawning + output parsing
│   ├── callback.ts        # POST results back to Convex webhook
│   ├── auth.ts            # Bearer token validation middleware
│   └── types.ts           # Shared types (SimType, JobPayload, SimResult)
└── README.md
```

---

## Detailed File Specs

### `Dockerfile`

Multi-stage build:
1. **Stage 1 (build)**: Ubuntu 24.04, download SimC nightly Linux release from GitHub
2. **Stage 2 (runtime)**: `node:22-slim`, copy SimC binary from stage 1, install app deps, run server

```dockerfile
FROM ubuntu:24.04 AS simc-build
RUN apt-get update && apt-get install -y curl
ARG SIMC_VERSION=nightly
# Download and extract SimC release
RUN curl -L "https://github.com/simulationcraft/simc/releases/download/${SIMC_VERSION}/SimulationCraft-linux.tar.gz" \
    -o /tmp/simc.tar.gz && tar xzf /tmp/simc.tar.gz -C /opt

FROM node:22-slim
RUN apt-get update && apt-get install -y libcurl4 && rm -rf /var/lib/apt/lists/*
COPY --from=simc-build /opt/SimulationCraft /opt/simc
ENV PATH="/opt/simc:$PATH"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY dist/ ./dist/
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

### `fly.toml`

```toml
app = "clt-simc-service"
primary_region = "gru"

[build]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-2x"
  memory = "1gb"
```

### `src/server.ts` — HTTP API

Two endpoints:

**`POST /sim`**
- Validates `Authorization: Bearer <SIMC_API_TOKEN>`
- Accepts body: `{ jobId, region, realm, name, simType, callbackUrl, callbackToken }`
- `simType`: `"quick_dps" | "stat_weights" | "multi_target"`
- Enqueues the job, returns `202 Accepted` with `{ jobId, position }`

**`GET /health`**
- Returns `200` with `{ status: "ok", queueLength, running }`

### `src/queue.ts` — Job Queue

- Simple array-based queue
- `MAX_CONCURRENT = 2` (Fly.io shared CPU has 2 cores)
- On enqueue: if under concurrency limit, process immediately; otherwise queue
- On job completion: drain next from queue
- Track active jobs for health endpoint

### `src/simc.ts` — SimC Runner + Parser

**Spawning SimC:**
```typescript
// Build args based on simType
function buildSimcArgs(job: JobPayload): string[] {
  const base = [
    `armory=${job.region},${job.realm},${job.name}`,
    'iterations=10000',
    'target_error=0.5',
    'threads=2',
    'json2=/dev/stdout',  // JSON output to stdout
  ];

  if (job.simType === 'stat_weights') {
    base.push('calculate_scale_factors=1', 'normalize_scale_factors=1');
  }
  if (job.simType === 'multi_target') {
    base.push('desired_targets=5', 'fight_style=DungeonSlice');
  }
  return base;
}
```

Use `child_process.spawn('simc', args)` with a timeout of 120 seconds.

**Parsing output:**
Use SimC's `json2` output mode which produces structured JSON. Parse the JSON to extract:
- `sim.players[0].collected_data.dps` → mean, min, max
- `sim.players[0].scale_factors` → stat weights (when applicable)
- `sim.statistics.elapsed_time_seconds`
- `build_info.version`

### `src/callback.ts` — Result Delivery

After SimC completes (or errors), POST to the Convex webhook:

```typescript
await fetch(job.callbackUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${job.callbackToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jobId: job.jobId,
    status: 'completed', // or 'error'
    result: { dps, dpsMin, dpsMax, dpsError, statWeights, targetCount, simcVersion, iterations, fightLength },
    rawOutput: truncatedOutput, // first 50KB of raw text
    error: errorMessage, // only on failure
  }),
});
```

Retry once on network failure, then give up (Convex stale-job cleanup handles it).

### `src/auth.ts` — Middleware

Simple bearer token check against `SIMC_API_TOKEN` env var. Returns 401 on mismatch.

### `src/types.ts`

```typescript
export type SimType = 'quick_dps' | 'stat_weights' | 'multi_target';

export interface JobPayload {
  jobId: string;
  region: string;
  realm: string;
  name: string;
  simType: SimType;
  callbackUrl: string;
  callbackToken: string;
}

export interface SimResult {
  dps: number;
  dpsMin?: number;
  dpsMax?: number;
  dpsError?: number;
  statWeights?: Record<string, number>;
  targetCount?: number;
  simcVersion?: string;
  iterations?: number;
  fightLength?: number;
}
```

---

## Environment Variables (Fly.io secrets)

| Variable | Description |
|----------|-------------|
| `SIMC_API_TOKEN` | Shared secret — validates inbound requests from Convex |
| `BATTLE_NET_CLIENT_ID` | For SimC armory import (can reuse existing app registration) |
| `BATTLE_NET_CLIENT_SECRET` | For SimC armory import |

Note: `callbackToken` is sent per-request from Convex, not stored as an env var here.

---

## Deployment Steps

```bash
# 1. Create the repo and scaffold
mkdir clt-simc-service && cd clt-simc-service
git init
npm init -y
npm install express
npm install -D typescript @types/node @types/express

# 2. Build and test locally (requires SimC installed)
npm run build
SIMC_API_TOKEN=test node dist/server.js

# 3. Deploy to Fly.io
fly launch --name clt-simc-service --region gru
fly secrets set SIMC_API_TOKEN=<generate-a-secret>
fly secrets set BATTLE_NET_CLIENT_ID=<your-id>
fly secrets set BATTLE_NET_CLIENT_SECRET=<your-secret>
fly deploy

# 4. Test
curl -X POST https://clt-simc-service.fly.dev/sim \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"test-1","region":"us","realm":"azralon","name":"charactername","simType":"quick_dps","callbackUrl":"https://httpbin.org/post","callbackToken":"test"}'
```

---

## SimC Binary Updates

When a new WoW patch drops:
1. Check SimC GitHub releases for a new nightly/release
2. Update `SIMC_VERSION` build arg in Dockerfile (or use `nightly` to always pull latest)
3. `fly deploy` — rebuilds image with new binary
4. No API changes needed

---

## Changes Needed in the Roster Repo (reference only)

These are minimal additions to `clt-roster-management` — not part of this service repo:

1. **`src/convex/schema.ts`** — Add `simJobs` and `simResults` tables
2. **`src/convex/simulationsInternal.ts`** — Internal mutations/queries for job lifecycle
3. **`src/convex/simulations.ts`** — `submitSim` action (POSTs to Fly.io service)
4. **`src/convex/http.ts`** — Add `/simc/callback` webhook route
5. **`src/routes/app/roster/+page.svelte`** — DPS column + sim trigger button
6. **Convex env vars** — `SIMC_SERVICE_URL`, `SIMC_API_TOKEN`, `SIMC_CALLBACK_TOKEN`
