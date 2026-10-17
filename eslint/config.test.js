import { ESLint } from 'eslint'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const eslint = new ESLint({ cwd: root, flags: ['v10_config_lookup_from_file'] })

test('shared rules apply to backend and frontend while React rules stay in frontend', async () => {
  const [backend, frontend, shared] = await Promise.all([
    eslint.calculateConfigForFile(`${root}/apps/backend/src/routes/example-router.ts`),
    eslint.calculateConfigForFile(`${root}/apps/frontend/src/pages/home/ui/HomePage.tsx`),
    eslint.calculateConfigForFile(`${root}/packages/example/src/index.ts`),
  ])

  for (const config of [backend, frontend, shared]) {
    assert.equal(config.rules['perfectionist/sort-imports'][0], 2)
    assert.equal(config.rules['@typescript-eslint/no-floating-promises'][0], 2)
  }

  assert.equal(frontend.rules['local/jsx-handler-names'][0], 2)
  assert.equal(frontend.rules['react-hooks/rules-of-hooks'][0], 2)
  assert.equal(backend.rules['local/jsx-handler-names'], undefined)
  assert.equal(shared.rules['react-hooks/rules-of-hooks'], undefined)
})

test('frontend rejects backend runtime imports but allows public type imports', async () => {
  const results = await eslint.lintText("import { appRouter } from 'backend/trpc'\nexport { appRouter }\n", {
    filePath: `${root}/apps/frontend/src/shared/api/index.ts`,
  })

  assert.ok(results[0].messages.some((message) => message.ruleId === 'no-restricted-imports'))

  const typeResults = await eslint.lintText(
    "import type { AppRouter } from 'backend/trpc'\nexport type { AppRouter }\n",
    {
      filePath: `${root}/apps/frontend/src/shared/api/index.ts`,
    },
  )

  assert.ok(!typeResults[0].messages.some((message) => message.ruleId === 'no-restricted-imports'))
})

test('generated router code is ignored', async () => {
  assert.equal(await eslint.isPathIgnored(`${root}/apps/frontend/src/routeTree.gen.ts`), true)
})

test('FSD rules reject upward, cross-slice, and unknown-layer imports from either working directory', async () => {
  const frontendRoot = `${root}/apps/frontend`
  const frontendEslint = new ESLint({ cwd: frontendRoot })
  const code = "import { HomePage } from '@/pages/home'\nimport { unknown } from '@/unknown-layer/example'\n"
  const options = { filePath: `${frontendRoot}/src/shared/api/index.ts` }
  const [rootResults, frontendResults, crossSliceResults] = await Promise.all([
    eslint.lintText(code, options),
    frontendEslint.lintText(code, options),
    eslint.lintText("import { SignInPage } from '@/pages/sign-in'\n", {
      filePath: `${frontendRoot}/src/pages/home/index.ts`,
    }),
  ])

  for (const results of [rootResults, frontendResults]) {
    assert.ok(!results[0].messages.some((message) => message.fatal))
    assert.ok(results[0].messages.some((message) => message.ruleId === 'import-fsd/no-denied-layers'))
    assert.ok(results[0].messages.some((message) => message.ruleId === 'import-fsd/no-unknown-layers'))
  }

  assert.ok(crossSliceResults[0].messages.some((message) => message.messageId === 'deniedSlice'))
})

test('FSD rules allow framework entry points and imports from lower layers', async () => {
  const results = await eslint.lintFiles([
    `${root}/apps/frontend/src/router.tsx`,
    `${root}/apps/frontend/src/routes/**/*.tsx`,
    `${root}/apps/frontend/src/middlewares/*.ts`,
    `${root}/apps/frontend/src/pages/home/ui/HomePage.tsx`,
  ])

  assert.ok(results.length > 3)
  assert.ok(
    !results.some((result) =>
      result.messages.some((message) => message.fatal || message.ruleId?.startsWith('import-fsd/')),
    ),
  )

  const backend = await eslint.calculateConfigForFile(`${root}/apps/backend/src/routes/example-router.ts`)

  assert.equal(backend.rules['import-fsd/no-denied-layers'], undefined)
})

test('query and mutation factories retain inference without weakening other module boundaries', async () => {
  const [queries, mutations, helper, backend] = await Promise.all([
    eslint.calculateConfigForFile(`${root}/apps/frontend/src/shared/api/example.queries.ts`),
    eslint.calculateConfigForFile(`${root}/apps/frontend/src/shared/api/example.mutations.ts`),
    eslint.calculateConfigForFile(`${root}/apps/frontend/src/shared/lib/cn.ts`),
    eslint.calculateConfigForFile(`${root}/apps/backend/src/services/example.queries.ts`),
  ])

  assert.equal(queries.rules['@typescript-eslint/explicit-module-boundary-types'][0], 0)
  assert.equal(mutations.rules['@typescript-eslint/explicit-module-boundary-types'][0], 0)
  assert.equal(helper.rules['@typescript-eslint/explicit-module-boundary-types'][0], 2)
  assert.equal(backend.rules['@typescript-eslint/explicit-module-boundary-types'][0], 2)
})
