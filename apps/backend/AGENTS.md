# Backend

The backend runs Express with tRPC at `/trpc` and Better Auth at `/api/auth/*`. PostgreSQL persistence uses Drizzle. Keep the architecture flat and group files by responsibility, without a `modules/` layer.

## Source layout and dependencies

- `main.ts` starts the process. `server.ts` configures Express and mounts the API
- `trpc/` owns context, authentication and error middleware, procedures, and root router composition. Wire services and repositories in `trpc/router.ts`
- `routes/` owns domain tRPC routers. Validate inputs and outputs with schemas, enforce access through procedures, and call services for business behavior
- `services/` owns business logic in classes. Services depend on repository contracts and domain errors, never on routes or Express
- `repositories/` owns persistence. Add a repository when a domain needs database access. Repositories depend on `database/`, never on services or routes
- `schemas/` owns Zod request and response contracts. `database/schema/` owns Drizzle tables
- `errors/` owns application errors and stable codes. `trpc/` translates these into transport errors
- `lib/` owns infrastructure such as authentication and logging. `env.ts` validates environment configuration. `test/` owns shared test setup

Dependencies flow from routes to services to repositories to the database. Keep dependency wiring at the application boundary. Services can accept repository interfaces so tests can substitute persistence without loading the server.

Use PascalCase filenames matching the class in services and repositories, such as `ExampleService.ts` and `DatabaseExampleRepository.ts`. Keep route filenames in kebab-case, such as `example-router.ts`. Classes use PascalCase and router values use camelCase. Keep tests beside the code they cover.

## Commands

Run from the repository root:

- `pnpm --filter backend dev`: start the API with reload
- `pnpm --filter backend build` / `pnpm --filter backend typecheck`
- `pnpm --filter backend lint`
- `pnpm --filter backend test`: run the default tests without database cleanup
- `pnpm --filter backend test:integration`: enable database setup and cleanup against a dedicated test database only
- `pnpm db:generate` / `pnpm db:migrate`: manage migrations

The backend loads `.env.<NODE_ENV>`, defaulting to `.env.development`. Integration test cleanup truncates public tables, so never point it at a development or production database. Preserve the type inference of router factories so `AppRouter` retains precise procedure contracts.
