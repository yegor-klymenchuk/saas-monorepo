# Repository overview

This pnpm workspace contains a SaaS pricing intelligence platform. `apps/frontend` is the React and TanStack Start application. `apps/backend` is the Express and tRPC API, using Better Auth and PostgreSQL through Drizzle. `packages/` is reserved for shared workspace packages and currently has no active package manifest. This repository does not use Turborepo.

Use Node.js 22.13+ and pnpm 9.15.4. Install dependencies with `pnpm install`. Each app has its own environment files, based on its `.env.example`. Never commit secrets.

## Commands

- `pnpm dev:frontend` / `pnpm dev:backend`: start either app
- `pnpm build`: build both apps
- `pnpm typecheck`: check both apps without emitting files
- `pnpm lint`: shared ESLint rules, frontend rules, and frontend FSD checks
- `pnpm test`: run application tests
- `pnpm test:lint`: test custom ESLint behavior and configuration scope
- `pnpm db:generate` / `pnpm db:migrate`: generate or apply backend database migrations

## Boundaries and conventions

- Read the app's `AGENTS.md` before changing it
- Keep reusable TypeScript, naming, import sorting, and formatting rules in `eslint.config.js`. React, JSX handlers, TanStack Query, and FSD checks belong to the frontend
- The frontend consumes the backend's `AppRouter` through type-only imports from `backend/trpc`. Never import backend runtime code into the frontend
- Keep external API contracts stable during refactoring. Add focused tests for changed behavior
- Create documentation only when explicitly requested. Keep explanations in chat otherwise
- Preserve existing user changes. Use plain hyphens in prose and avoid semicolons when practical
