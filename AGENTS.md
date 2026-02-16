# AGENTS.md — CLT Roster Management

## Project Overview

World of Warcraft guild roster manager for "Cartel Lucros Taxados" (CLT).
All user-facing UI text MUST be in **Brazilian Portuguese** (pt-BR).
Backend uses **Convex** for database/functions and **WorkOS** for authentication.
Production URL: `https://clt.felipeafonso.com`

## Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5 (runes only — no legacy syntax)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (Vite plugin, NOT PostCSS) + shadcn-svelte
- **UI Components**: shadcn-svelte (base color: `stone`, dark mode via `.dark` class)
- **Icons**: `@lucide/svelte`
- **Backend**: Convex (functions live in `src/convex/`, NOT root `convex/`)
- **Auth**: WorkOS via Convex `authKit` integration
- **Deploy**: Vercel (`@sveltejs/adapter-vercel`)
- **Package Manager**: Bun

## Commands

```bash
bun run dev          # Start dev server (assume already running)
bun run build        # Production build
bun run preview      # Preview production build
bun run check        # Type-check (svelte-kit sync + svelte-check)
bun run check:watch  # Type-check in watch mode
bun run lint         # Prettier --check + ESLint
bun run format       # Prettier --write
npx convex dev       # Convex dev server (assume already running)
```

### After Every Session With Code Changes

Always run before finishing:

```bash
bun run format && bun run lint && bun run check
```

### Testing

No test framework is set up yet. When one is added, update this section.

## Code Style

### Formatting (Prettier enforced)

- **Tabs** for indentation (not spaces)
- **Single quotes** for strings
- **No trailing commas**
- **100-char** print width
- Tailwind classes auto-sorted by `prettier-plugin-tailwindcss`
- Svelte files parsed by `prettier-plugin-svelte`

### Imports

- Use `$lib/` alias for anything under `src/lib/`
- Use `$env/static/private` and `$env/static/public` for env vars (public prefix: `PUBLIC_`)
- Convex generated imports: `src/convex/_generated/api` (functions are in `src/convex/`)
- Group imports: svelte/kit builtins -> external packages -> `$lib` -> relative paths
- No barrel re-exports unless explicitly needed

### TypeScript

- Strict mode ON (`strict: true`, `checkJs: true`, `verbatimModuleSyntax: true`)
- Always use `lang="ts"` in Svelte `<script>` blocks
- Prefer explicit types for function params and return types
- Use Convex-generated types from `src/convex/_generated/dataModel`

### Svelte 5 Conventions

- **Runes only**: `$state()`, `$derived()`, `$effect()`, `$props()`, `$bindable()`
- **NEVER** use legacy Svelte 4 syntax (`export let`, `$:`, `<slot />`, stores)
- Use `{@render children()}` instead of `<slot />`
- Use `{@render snippetName()}` for named slots
- Props: `let { prop1, prop2 } = $props()` with destructuring
- Prefer `$derived()` over `$effect()` when computing values
- Use `$effect()` only for true side effects (DOM, timers, subscriptions)
- Component filenames: PascalCase (e.g., `RosterTable.svelte`)
- Route files: SvelteKit conventions (`+page.svelte`, `+layout.svelte`, etc.)

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities/modules
- **Variables/functions**: camelCase
- **Types/interfaces**: PascalCase
- **Constants**: camelCase (not UPPER_SNAKE unless truly global config)
- **CSS classes**: Tailwind utilities; custom classes in kebab-case
- **Convex tables**: camelCase plural (e.g., `characters`, `guildMembers`)
- **Convex functions**: camelCase (e.g., `getCharacter`, `listMembers`)

### Error Handling

- Use SvelteKit's `error()` helper from `@sveltejs/kit` in load functions
- Use `fail()` for form action validation errors
- Convex functions should throw `ConvexError` for user-facing errors
- Always handle loading/error states in components

## Architecture Patterns

### Data Flow (Convex + SvelteKit)

- **Always initialize data server-side** in `+page.server.ts` or `+layout.server.ts`
- Hydrate the client with server-loaded data — never client-fetch-only for initial render
- Use Convex `preloadQuery` on server, pass preloaded data to client components
- Client components use `useQuery` (from `convex-svelte`) for real-time subscriptions
- Mutations via `useMutation` on the client side

### Authentication (WorkOS)

- Auth state checked in hooks (`hooks.server.ts`)
- Protected routes use `locals` to pass user/session info
- WorkOS session tokens validated server-side

### Routing

- Group related routes under `(group)` directories when sharing layouts
- Use `+page.server.ts` for server-only load functions (DB queries, auth checks)
- Use `+page.ts` only when data can be loaded on both client and server

### UI Components (shadcn-svelte)

- Components install to `$lib/components/ui/` via shadcn-svelte CLI
- Use `cn()` from `$lib/utils` for conditional class merging (clsx + tailwind-merge)
- Use `tailwind-variants` for component variant APIs
- Type helpers available in `$lib/utils`: `WithoutChild`, `WithoutChildren`, `WithElementRef`
- Theme uses `oklch()` color space with CSS custom properties (light/dark)
- Dark mode: `@custom-variant dark (&:is(.dark *))` in Tailwind v4

### Styling

- Tailwind CSS v4 syntax: `@import 'tailwindcss'` in CSS files
- Global styles and theme in `src/routes/layout.css`
- Prefer Tailwind utilities over custom CSS
- Custom design tokens via `@theme inline` block in layout.css
- Base border radius: `--radius: 0.625rem` with computed variants (sm, md, lg, xl)
- Animation utilities from `tw-animate-css`

### Environment Variables

- `PUBLIC_CONVEX_URL` / `PUBLIC_CONVEX_SITE_URL` — client-safe Convex URLs
- `CONVEX_DEPLOY_KEY` / `CONVEX_DEPLOYMENT` — server-only
- WorkOS vars injected via Convex authKit config at runtime

## MCP Tools

### Svelte MCP

If available, use the Svelte MCP server for docs:

1. **list-sections** — discover available docs. Call FIRST for Svelte/SvelteKit tasks.
2. **get-documentation** — fetch full docs for specific sections by title or path.
3. **svelte-autofixer** — analyze Svelte code for issues. MUST use before finalizing any Svelte code. Keep calling until zero issues remain.
4. **playground-link** — generate Svelte Playground link. NEVER use if code was written to project files.

### Convex MCP

If available, use the Convex MCP server for backend tasks. Pass `projectDir` as the repo root.

1. **convex_status** — list deployments (dev/prod). Returns deployment selectors for other tools. Default to the dev deployment unless debugging production.
2. **convex_tables** — list all tables with inferred and declared schema.
3. **convex_data** — read paginated data from a table (supports cursor, limit, order).
4. **convex_functionSpec** — get metadata for all functions (path, args, return type, visibility).
5. **convex_run** — execute a query, mutation, or action on a deployment.
6. **convex_runOneoffQuery** — run a sandboxed read-only query (useful for ad-hoc data inspection).
7. **convex_logs** — fetch recent UDF execution logs for debugging.
8. **convex_envList / convex_envGet / convex_envSet / convex_envRemove** — manage environment variables.

## Key Reminders

- All UI text in **Brazilian Portuguese** (pt-BR)
- Never run `bun run dev` or `npx convex dev` yourself — assume they're running
- Always run `bun run format && bun run lint && bun run check` after code changes
- Server-side data initialization is mandatory — hydrate the client, never client-fetch-only
- Svelte 5 runes only — zero legacy syntax
- Convex functions live in `src/convex/`, not root-level `convex/`
- ESM project (`"type": "module"` in package.json)
