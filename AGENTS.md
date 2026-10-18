# Repository overview

This pnpm workspace contains a SaaS pricing intelligence platform. `apps/web` is the React and TanStack Start application. `apps/api` is the Express and tRPC API, using Better Auth and PostgreSQL through Drizzle. `packages/` is reserved for shared workspace packages and currently has no active package manifest. This repository does not use Turborepo.

Use Node.js 22.13+ and pnpm 9.15.4. Install dependencies with `pnpm install`. Each app has its own environment files, based on its `.env.example`. Never commit secrets.

## Commands

- `pnpm dev:web` / `pnpm dev:api`: start either app
- `pnpm build`: build both apps
- `pnpm typecheck`: check both apps without emitting files
- `pnpm lint`: shared ESLint rules, web rules, and web FSD checks
- `pnpm test`: run application tests
- `pnpm test:lint`: test custom ESLint behavior and configuration scope
- `pnpm db:generate` / `pnpm db:migrate`: generate or apply API database migrations

## Project rules

1. **Use the test environment.** Load the app's `.env.test` through the test runner and shared setup files. Never stub the environment module, recreate its values in test cases, or fall back to development configuration. Keep common initialization and teardown in shared setup. Override individual values only when the scenario tests configuration-dependent behavior, such as a feature flag, and restore them after the test
2. **Centralize provider mocks.** Keep integration-test provider mocks in the app's `test/mocks/<provider>/` folder, such as `src/test/mocks/stripe/`. Put mocked services, functions, HTTP responses, and provider payload factories there. Reuse or extend these mocks instead of creating provider stubs inside test files. Let shared setup and the mocks own their reset and cleanup lifecycle. Tests should only configure the scenario's responses, failures, or expectations
3. **Test persistence against the real test database.** Endpoint and workflow integration tests must exercise real application code and persistence. Mock external providers, not the services or repositories being tested. Use the dedicated database configured by `.env.test`, with isolation and cleanup managed by shared setup
4. **Use fixtures for prerequisite context.** Keep all reusable database fixtures together in one `test/fixtures.ts` file per app, such as `src/test/fixtures.ts`. Give each fixture sensible defaults and typed `Partial` overrides, generate fresh data on each call, and return the inserted record. For a focused endpoint test, fixtures may insert the users, resources, or other starting data it needs. Call fixtures inside the test and explicitly override fields relevant to the behavior. Avoid ad hoc database inserts scattered through test files

   Example for `src/test/fixtures.ts`:

   ```typescript
   import { randomUUID } from 'node:crypto'

   import { db } from '../database/database'
   import { user } from '../database/schema/user'

   export async function createUser(
     overrides: Partial<typeof user.$inferInsert> = {},
   ): Promise<typeof user.$inferSelect> {
     const id = randomUUID()
     const [createdUser] = await db
       .insert(user)
       .values({
         id,
         name: 'Test User',
         email: `${id}@example.test`,
         emailVerified: false,
         ...overrides,
       })
       .returning()

     if (!createdUser) {
       throw new Error('User fixture was not created')
     }

     return createdUser
   }
   ```

   A test can call `await createUser({ emailVerified: true })` to make its prerequisite explicit

5. **Exercise real workflows through endpoints and handlers.** When a scenario spans several user actions, call the real endpoints in sequence and pass their results into later steps. Exercise provider events through the real webhook handlers with realistic payloads from the centralized mocks. Fixtures may create prerequisites, but must not insert the intermediate or final state that the workflow is meant to produce
6. **Extract helpers only when they simplify the test.** Keep straightforward endpoint calls and assertions inline. Put reusable workflow helpers in the app's `test/helpers/` folder when authentication, payload construction, webhook delivery, or multiple steps introduce meaningful boilerplate. Name helpers after the action, such as `createPurchase` or `createDispute`. Helpers must call the real endpoint or handler rather than reproduce business logic or seed its result directly
7. **Keep scenarios easy to review.** Make the starting context, action, and expected result clear. Assert relevant response statuses, stable error names, and persisted effects. Keep assertions specific to the behavior under test, and add short comments only where setup or sequencing needs explanation

## Test setup and readability

- Prioritize readable, self-contained scenarios over eliminating repeated setup
- Keep the values and state that explain the expected behavior visible in the test
- Create business fixtures inside each test. For complex prerequisites, use a small, cohesive setup function located beside the tests
- Avoid chains of scenario helpers that require reading several files to understand one test
- Share focused fixture factories when they represent a clear domain operation and have meaningful reuse
- Let fixture factories accept typed overrides so each test can show relevant differences explicitly
- Keep request construction, actions and assertions visible in endpoint tests
- Add helpers as concrete reuse emerges. Avoid speculative options for future scenarios
- Add short comments explaining non-obvious setup, ordering or state transitions
- Allow modest duplication when extraction would make the scenario harder to follow

Reference: [Google's guidance on DAMP (Descriptive And Meaningful Phrases) and test code sharing](https://abseil.io/resources/swe-book/html/ch12.html#tests_and_code_sharing_dampcomma_not_dr)

## Code style

- **Keep logic inline by default.** When logic is used in only one place, keep its implementation close to that usage so the behavior can be understood without jumping between functions or files. Extract a helper or abstraction when it provides meaningful reuse across existing call sites, preserves an established architectural boundary, or makes complex logic substantially easier to understand. Do not add wrappers, utility files, or extra layers merely to shorten a function or anticipate future reuse. Prefer code that is easy to locate, follow, and review over unnecessary indirection

## Boundaries and conventions

- Read the app's `AGENTS.md` before changing it
- Keep reusable TypeScript, naming, import sorting, and formatting rules in `eslint.config.js`. React, JSX handlers, TanStack Query, and FSD checks belong to the web app
- The web app consumes the API's `AppRouter` through type-only imports from `api/trpc`. Never import API runtime code into the web app
- Keep external API contracts stable during refactoring. Add focused tests for changed behavior
- Create documentation only when explicitly requested. Keep explanations in chat otherwise
- Preserve existing user changes. Use plain hyphens in prose and avoid semicolons when practical
