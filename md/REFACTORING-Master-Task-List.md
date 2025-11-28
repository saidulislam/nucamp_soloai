Analyze the repository and produce a comprehensive refactor report.

## Goals
1) Identify every place the code needs refactoring, consolidation, or cleanup.  
2) Explain why, show proof from the codebase, and propose a concrete fix.  
3) Prioritize changes by impact and effort.

## What to inspect
Work through all source files, with special attention to SvelteKit and Svelte 5 patterns:

- **Routing and files**
  - Duplicate or near-duplicate routes, endpoints, or actions across `src/routes/**` such as multiple routes that implement the same logic.
  - Unnecessary parallel implementations split between `+page.server.ts`, `+page.ts`, `+server.ts` when one would suffice.
  - Misuse of layout data propagation vs route data, incorrect assumptions about layout resets, and duplicated loaders.
  - Inconsistent use of form actions and server endpoints for similar flows.

- **Providers and dependency boundaries**
  - Places where a provider or helper library exists but is not used, leading to duplicated logic or hard-coded data.
  - Hard-coded configuration or credentials that should come from providers, `$env/static/private` or `$env/dynamic/private`.
  - Missing or inconsistent dependency injection boundaries. Look for constructor parameters, context, or store-based injection that would decouple modules.

- **Data loading and performance**
  - Data fetched in the client that should be in server `load` for SSR and caching.  
  - Blocking `await` in `load` that can be parallelized with `Promise.all`.  
  - Re-fetching the same data in multiple routes that could share via `+layout.server.ts`.  
  - Missing `maxage` caching or ETag usage on endpoints where safe.  
  - Extraneous large imports on the client that could be lazy loaded.  
  - Bundle bloat risks, tree-shaking pitfalls, and obvious dead code.

- **Context and modularity**
  - Inconsistent use of Svelte context vs explicit prop drilling where a provider pattern would be clearer.
  - Module boundaries that could be improved for better separation of concerns.

- **Components**
  - Components with more than one responsibility or excessive props that should be split.  
  - Repeated UI patterns that should be abstracted into base components.  
  - Styling inconsistencies in Tailwind that could be consolidated with utilities, variants, or class helpers.

- **Validation, schemas, and types**
  - Missing or inconsistent input validation on actions and endpoints.  
  - Lack of shared Zod schemas across server and client.  
  - Duplicate type definitions that should live in a single `@types` or `lib/types` module.

- **Error handling and logging**
  - Inconsistent `error`, `fail`, and thrown exceptions usage in actions and loaders.  
  - Missing try-catch around network and provider calls.  
  - Logging that leaks sensitive data or is too noisy.

- **Security**
  - Secrets or tokens in code.  
  - Missing CSRF considerations for actions where applicable.  
  - Unvalidated user input passed to DB or external services.  
  - CORS or cookie flags that are unsafe in production.

- **Build and tooling**
  - `vite.config.ts` or `svelte.config.js` redundancies, plugin misuse, and adapter configuration issues.  
  - ESLint, Prettier, TypeScript config inconsistencies.  
  - Tailwind config bloat, dead safelist entries, or unused plugins.  
  - Unused npm dependencies and mismatched versions.

- **Server boundaries**
  - Server-only logic accidentally imported into client code.  
  - Missing `server` subpath or `private` env usage for server-only modules.  
  - API code that belongs in `+server.ts` but lives in random utilities.

- **Internationalization and accessibility**
  - Repeated ad hoc i18n handling.  
  - Common a11y issues in components that can be fixed with small refactors.

## Output format
Produce a single report with these sections.

1) **Summary**
   - 5 to 10 bullets that describe the most important refactor themes.
   - Risk overview and expected gains in performance, maintainability, and correctness.

2) **Refactor Backlog Table**
   Provide a table with one row per issue:
   - ID
   - Category (Routing, Providers, State, Components, Validation, Error Handling, Security, Build, Performance, Tooling, Other)
   - Severity (Critical, High, Medium, Low)
   - Evidence (file path and line hints, plus a brief quoted snippet)
   - Problem
   - Recommendation
   - Example patch or code snippet
   - Effort (S, M, L)
   - Impact (Perf, DX, Reliability, Security, UX)
   - Tags (duplicated-route, hard-coded-config, provider-bypass, dead-code, etc.)

3) **Consolidation Plan**
   - List duplicated routes or functions and propose a single canonical implementation with a migration plan.  
   - Identify provider modules that should become the only entry points for external systems.  
   - Propose directory moves or module boundaries.  
   - Suggest shared loaders or layout-level loaders for cross-route data.

4) **Provider Hardening**
   - For each hard-coded data source, propose how to fetch via provider.
   - Specify the provider interface and where it lives, for example `src/lib/providers/{name}.ts`.
   - Note env variables and how they flow using `$env/static/private` or `$env/dynamic/private`.

5) **Performance Hotspots**
   - Explain the cause, show evidence, and give a concrete fix.  
   - Recommend lazy loading, parallelization, caching, or moving work to server.  
   - Call out heavy client imports and suggest dynamic imports.

6) **Security Checklist Findings**
   - Enumerate any secret exposure, unsafe cookie flags, missing validation, or unsafe CORS.
   - Provide exact steps to fix.

7) **Quick Wins**
   - A top 10 punch list of changes that can be finished in under 1 hour each.

## Rules for evidence and examples
- Include file paths and line ranges for every issue when possible.
- When proposing a fix, include a minimal diff or code block that shows exactly what to change.
- Prefer canonical SvelteKit patterns: use `+layout.server.ts` for shared data, move server-only logic to server files, use `fail` with status codes for actions, and keep secrets in env.
- Prefer shared schemas with Zod for validation on both server and client.
- **DO NOT** propose changes to component state management patterns (runes, stores, etc.) - leave existing patterns as-is.

## Prioritization logic
- Critical: security bugs, data leaks, logic duplication that causes user-visible bugs, or server-only code imported into the client.  
- High: significant duplication, provider bypass, broken boundaries, large performance wins.  
- Medium: stylistic consistency, DX improvements, component extraction.  
- Low: cosmetic cleanup.

## Deliverables
- One markdown report that follows the format above and is named `REFACTORING-<DATE MM/DD/YY>-Report.md`.
- The Refactor Backlog Table must be exhaustive, with unique IDs that can be tracked in tickets.  
- Link related items to a single consolidation plan entry.

## Example finding patterns
- Duplicated route logic across `src/routes/x/+page.server.ts` and `src/routes/y/+page.server.ts`.
- Uses `fetch` in the client for data that is static or user-independent and belongs in `+layout.server.ts`.
- Hard-coded provider base URL in a component. Should come from a provider module plus env.
- Repeated form validation logic in two actions. Replace with a shared Zod schema.
- Module boundaries that could be clearer for better separation of concerns.

## Repository inputs
Use these inputs if available. If not, continue with best effort.
- Main entry: `src/`  
- Routes: `src/routes/**`  
- Shared libs: `src/lib/**`  
- Providers: `src/lib/providers/**`  
- Config: root configs plus `src/lib/config/**`  
- Styles: `src/app.css`, `tailwind.config.*`

## Final note
When in doubt, prefer fewer, composable modules, a single provider per external system, shared schemas, and server-first data loading that can hydrate efficiently.

**IMPORTANT**: Do NOT propose changes to component state management (runes, stores, reactivity patterns). These have caused issues and should be left as-is. Focus on routing, providers, validation, security, and performance improvements instead.
