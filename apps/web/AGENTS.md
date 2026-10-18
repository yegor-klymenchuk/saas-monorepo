# Web

React and TanStack Start provide routing and SSR, TanStack Query and tRPC provide API access, and Better Auth handles authentication. UI components use Tailwind CSS and Base UI. The API owns database access and business persistence.

## Architecture

Follow the repository's `feature-sliced-design` skill in `.agents/skills/feature-sliced-design/SKILL.md`. Start page-specific work in its page slice and extract only when reuse has a clear purpose.

Layers, from highest to lowest:

- `app/`: application providers, initialization, and global styles
- `pages/`: route-level slices with their own UI and logic
- `widgets/`: large UI blocks reused across pages, only when needed
- `features/`: reusable user interactions, currently authentication
- `entities/`: reusable business domain models, only when needed
- `shared/`: generic UI, API client, auth client, configuration, and libraries

Import only from lower layers. Do not import between slices on the same layer. Expose slices through `index.ts` and Shared through segment entry points such as `shared/ui`. Do not create empty layers for future work.

`routes/` contains thin TanStack route adapters and guards. `router.tsx` constructs the router and query context. These are framework entry points above the FSD layers. `middlewares/` contains Start request middleware. Keep business and page UI logic in the layers. Never edit generated `routeTree.gen.ts` manually.

Use PascalCase filenames for components in `shared/ui`, matching their component names, such as `Badge.tsx`, `Button.tsx`, and `Select.tsx`. Keep the public entry point named `index.ts`.

Name local JSX callbacks `handleSomething` and callback props `onSomething`. Forward existing callback props without renaming them. Keep React and Query lint rules in this app, and FSD checks in its ESLint configuration through `eslint-plugin-import-fsd`. Keep inferred return types in `*.queries.ts` and `*.mutations.ts` factories.

## Commands

Run from the repository root:

- `pnpm --filter web dev`: start on port 3000
- `pnpm --filter web build`: build client and Nitro server
- `pnpm --filter web start`: run the built server
- `pnpm --filter web typecheck`
- `pnpm --filter web lint`: ESLint and FSD checks
- `pnpm --filter web test`: run web tests, currently no application test suite

Use `.env` based on `.env.example`. Only public configuration belongs in `VITE_*` variables. Import API contracts only as types through `api/trpc`. Keep inferred router and tRPC factory types intact.
