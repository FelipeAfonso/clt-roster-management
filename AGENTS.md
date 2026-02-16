# AGENTS.md — CLT Roster Management

## Project Overview

World of Warcraft guild roster manager for "Cartel Lucros Taxados" (CLT).
All user-facing UI text MUST be in **Brazilian Portuguese** (pt-BR).
Backend uses **Convex** for database/functions and **WorkOS** for authentication.

## Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5 (runes only — no legacy syntax)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (Vite plugin, NOT PostCSS)
- **Backend**: Convex (functions, schema, DB)
- **Auth**: WorkOS via Convex integration
- **Deploy**: Vercel (`@sveltejs/adapter-vercel`)
- **Package Manager**: Bun

## Commands

```bash
bun run dev          # Start dev server (you should assume this is already running)
bun run build        # Production build
bun run preview      # Preview production build
bun run check        # Type-check (svelte-kit sync + svelte-check)
bun run check:watch  # Type-check in watch mode
bun run lint         # Prettier --check + ESLint
bun run format       # Prettier --write
npx convex dev       # Convex dev server (assume this is already running)
```

### After Every Session With Code Changes

Always run these before finishing:

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
- Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`
- Svelte files parsed by `prettier-plugin-svelte`

### Imports

- Use `$lib/` alias for anything under `src/lib/`
- Use `$env/static/private` and `$env/static/public` for env vars (public prefix: `PUBLIC_`)
- Convex imports: use `convex/_generated/api` for function references
- Group imports: svelte/kit builtins → external packages → `$lib` → relative paths
- No barrel re-exports unless explicitly needed

### TypeScript

- Strict mode is ON (`strict: true` in tsconfig)
- `checkJs: true` — JS files are also type-checked
- Always use `lang="ts"` in Svelte `<script>` blocks
- Prefer explicit types for function params and return types
- Use Convex-generated types for DB schemas (from `convex/_generated/dataModel`)

### Svelte 5 Conventions

- **Runes only**: use `$state()`, `$derived()`, `$effect()`, `$props()`, `$bindable()`
- **NEVER** use legacy Svelte 4 syntax (`export let`, `$:`, `<slot />`, stores)
- Use `{@render children()}` instead of `<slot />`
- Use `{@render snippetName()}` for named slots
- Props: `let { prop1, prop2 } = $props()` with destructuring
- Prefer `$derived()` over `$effect()` when computing values
- Use `$effect()` only for true side effects (DOM, timers, subscriptions)
- Component filenames: PascalCase (e.g., `RosterTable.svelte`)
- Route files: follow SvelteKit conventions (`+page.svelte`, `+layout.svelte`, etc.)

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities/modules
- **Variables/functions**: camelCase
- **Types/interfaces**: PascalCase
- **Constants**: camelCase (not UPPER_SNAKE unless truly global config)
- **CSS classes**: use Tailwind utilities; custom classes in kebab-case
- **Convex tables**: camelCase plural (e.g., `characters`, `guildMembers`)
- **Convex functions**: camelCase (e.g., `getCharacter`, `listMembers`)

### Error Handling

- Use SvelteKit's `error()` helper from `@sveltejs/kit` in load functions
- Use `fail()` for form action validation errors
- Convex functions should throw `ConvexError` for user-facing errors
- Always handle loading/error states in components

## Architecture Patterns

### Data Flow (Convex + SvelteKit)

- **Always initialize data server-side** in `+page.server.ts` or `+layout.server.ts` load functions
- Hydrate the client with server-loaded data — never rely on client-only fetching for initial render
- Use Convex `preloadQuery` on the server, pass preloaded data to client components
- Client components can then use Convex `useQuery` for real-time subscriptions
- Mutations use `useMutation` on the client side

### Authentication (WorkOS)

- Auth state should be checked in hooks (`hooks.server.ts`)
- Protected routes use `locals` to pass user/session info
- WorkOS session tokens validated server-side

### Routing

- Group related routes under `(group)` directories when sharing layouts
- Use `+page.server.ts` for server-only load functions (DB queries, auth checks)
- Use `+page.ts` only when data can be loaded on both client and server

### Styling

- Tailwind CSS v4 syntax: `@import 'tailwindcss'` in CSS files
- Plugins via `@plugin` directive (e.g., `@plugin '@tailwindcss/typography'`)
- Prefer Tailwind utilities over custom CSS
- Use `@theme` for custom design tokens when needed

## Svelte MCP Tools

You have access to the Svelte MCP server with comprehensive Svelte 5 and SvelteKit docs:

### 1. list-sections

Use FIRST to discover available documentation sections. Returns titles, use_cases, and paths.
Always call this at the start of a chat involving Svelte/SvelteKit topics.

### 2. get-documentation

Retrieves full docs for specific sections. Accepts single or array of section names.
After `list-sections`, analyze use_cases and fetch ALL relevant sections for the task.

### 3. svelte-autofixer

Analyzes Svelte code for issues. **MUST** be used before sending any Svelte code.
Keep calling until zero issues/suggestions remain.

### 4. playground-link

Generates a Svelte Playground link. Ask the user first.
NEVER use if the code was written to files in the project.

## Key Reminders

- All UI text in **Brazilian Portuguese** (pt-BR)
- Never run `bun run dev` or `npx convex dev` yourself — assume they're running
- Always run `bun run format && bun run lint && bun run check` after code changes
- Server-side data initialization is mandatory — hydrate the client, never client-fetch-only
- Svelte 5 runes only — zero legacy syntax
