# API

The API runs Express with tRPC at `/trpc` and Better Auth at `/api/auth/*`. PostgreSQL persistence uses Drizzle. Keep the architecture flat and group files by responsibility, without a `modules/` layer.

## Source layout and dependencies

- `main.ts` starts the process. `server.ts` configures Express and mounts the API
- `trpc/` owns context, authentication and error middleware, procedures, and root router composition.
- `routes/` owns domain tRPC routers. Validate inputs and outputs with schemas, enforce access through procedures, and call services for business behavior
- `services/` owns business logic in classes. Services depend on repositories and domain errors, never on routes or Express
- `repositories/` owns persistence. Add a repository when a domain needs database access. Repositories depend on `database/`, never on services or routes
- `schemas/` owns Zod request and response contracts. `database/schema/` owns Drizzle tables
- `errors/` owns application errors and stable codes. `trpc/` translates these into transport errors
- `lib/` owns infrastructure such as authentication and logging. `env.ts` validates environment configuration. `test/` owns shared test setup

Dependencies flow from routes to services to repositories to the database.

Use PascalCase filenames matching the class in services and repositories, such as `BillingService.ts` and `BillingRepository.ts`. Use domain names for route filenames, such as `billing.ts` and `session.ts`, without a `-router` suffix. Use the same name for their tests, such as `billing.test.ts`. Classes use PascalCase and router values use camelCase. Keep tests beside the code they cover.

## Dependency construction

- Give services an optional constructor dependency with a concrete default, such as `constructor(repository: BillingRepository = new BillingRepository())`. Use the repository class directly without a separate interface unless multiple implementations need one
- Create service instances at module scope in the router, webhook handler, or worker that uses them, or when its router factory is constructed. Avoid creating them on every request. Do not add a central `lib/services.ts` registry or import instances from routers into other consumers
- Repositories reuse the shared database client or pool. A repository may accept an optional database override that defaults to that shared client. Creating a repository must not create another connection pool
- Keep request state and transaction clients explicit and scoped to the operation. Integration tests use real repositories and the dedicated test database, with only external providers mocked

## Test boundaries

- **Routes:** Test the HTTP contract through the shared `request` client. Cover input and output validation, HTTP methods, authentication, authorization, session-derived identity, response serialization, status codes, and error mapping. Use real services and repositories. Keep a small number of successful integration cases to verify wiring, without repeating the business-rule scenarios owned by service tests
- **Services:** Call public service methods to test business rules, provider request construction, ownership decisions, lifecycle transitions, and recovery from provider failures. Use real repositories and the test database. Assert domain errors and business outcomes rather than HTTP responses. Deliver events directly to the public handler when testing event-processing logic
- **Repositories:** Call public repository methods to test queries, persisted fields, database constraints, uniqueness, concurrency, transaction atomicity, and event deduplication. Use the real test database. Keep HTTP requests, provider calls, and service-level business decisions out of these tests
- **Webhook routes:** Test raw-body and signature verification, acknowledgements, failure responses, and a representative signed event reaching the application handler. Put payment-state and ownership scenarios in service tests, and transaction and deduplication scenarios in repository tests
- Keep each behavior's detailed scenarios at the layer that owns it. A route test may trigger a business error to verify its HTTP mapping, but must not repeat the service's full validation matrix
- Use `.env.test` and the shared setup for database safety, isolation, provider mock resets, and connection cleanup. Keep feature configuration defaults and restoration in the suites that use them. Configure only the fields those tests need, and keep scenario-specific configuration changes inside the test. Mock external providers only through `test/mocks/<provider>/`. Create prerequisite records through `test/fixtures.ts` inside each test. Authentication helpers must exercise the real authentication endpoints rather than fabricate router contexts
- Use one outer `describe('Subject - Scope', ...)` per file and nested `describe` groups with descriptive titles in Title Case when grouping helps. Keep scenario-specific data inside `it` blocks. Stateless service and repository instances can be shared in the outer suite

## Commands

Run from the repository root:

- `pnpm --filter api dev`: start the API with reload
- `pnpm --filter api build` / `pnpm --filter api typecheck`
- `pnpm --filter api lint`
- `pnpm --filter api test`: run all tests against the dedicated database configured in `.env.test`, with database cleanup between tests
- `pnpm db:generate` / `pnpm db:migrate`: manage migrations

The API loads `.env.<NODE_ENV>`, defaulting to `.env.development`. Integration test cleanup truncates public tables, so never point it at a development or production database. Preserve the type inference of router factories so `AppRouter` retains precise procedure contracts.
