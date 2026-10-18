import { ESLint } from 'eslint'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const eslint = new ESLint({ cwd: root, flags: ['v10_config_lookup_from_file'] })

test('shared rules apply to api and web while React rules stay in web', async () => {
  const [api, web, shared] = await Promise.all([
    eslint.calculateConfigForFile(`${root}/apps/api/src/routes/session.ts`),
    eslint.calculateConfigForFile(`${root}/apps/web/src/pages/home/ui/HomePage.tsx`),
    eslint.calculateConfigForFile(`${root}/packages/example/src/index.ts`),
  ])

  for (const config of [api, web, shared]) {
    assert.equal(config.rules['perfectionist/sort-imports'][0], 2)
    assert.equal(config.rules['@typescript-eslint/no-floating-promises'][0], 2)
  }

  assert.equal(web.rules['local/jsx-handler-names'][0], 2)
  assert.equal(web.rules['react-hooks/rules-of-hooks'][0], 2)
  assert.equal(api.rules['local/jsx-handler-names'], undefined)
  assert.equal(shared.rules['react-hooks/rules-of-hooks'], undefined)
})

test('web rejects api package runtime imports but allows public type imports and local API modules', async () => {
  const results = await eslint.lintText("import { appRouter } from 'api/trpc'\nexport { appRouter }\n", {
    filePath: `${root}/apps/web/src/shared/api/index.ts`,
  })

  assert.ok(results[0].messages.some((message) => message.ruleId === 'no-restricted-imports'))

  const typeResults = await eslint.lintText("import type { AppRouter } from 'api/trpc'\nexport type { AppRouter }\n", {
    filePath: `${root}/apps/web/src/shared/api/index.ts`,
  })

  assert.ok(!typeResults[0].messages.some((message) => message.ruleId === 'no-restricted-imports'))

  const [sharedResults, relativeResults] = await Promise.all([
    eslint.lintText("import { useTRPC } from '@/shared/api'\nexport { useTRPC }\n", {
      filePath: `${root}/apps/web/src/app/App.tsx`,
    }),
    eslint.lintText("import { signIn } from '../api/sign-in'\nexport { signIn }\n", {
      filePath: `${root}/apps/web/src/features/authentication/ui/SignInForm.tsx`,
    }),
  ])

  for (const results of [sharedResults, relativeResults]) {
    assert.ok(!results[0].messages.some((message) => message.fatal || message.ruleId === 'no-restricted-imports'))
  }
})

test('generated router code is ignored', async () => {
  assert.equal(await eslint.isPathIgnored(`${root}/apps/web/src/routeTree.gen.ts`), true)
})

test('locales use their own TypeScript project from either working directory', async () => {
  const localesEslint = new ESLint({ cwd: `${root}/packages/locales` })
  const filePath = `${root}/packages/locales/src/default/auth.ts`

  for (const instance of [eslint, localesEslint]) {
    const config = await instance.calculateConfigForFile(filePath)

    assert.equal(config.languageOptions.parserOptions.projectService, false)
    assert.equal(config.languageOptions.parserOptions.project, './packages/locales/tsconfig.json')
    assert.equal(config.rules['@typescript-eslint/no-floating-promises'][0], 2)

    const results = await instance.lintFiles([`${root}/packages/locales/src/**/*.ts`])

    assert.ok(results.length > 1)
    assert.ok(!results.some((result) => result.errorCount > 0), JSON.stringify(results))
  }
})

test('expressions are separated from declarations while consecutive calls and declarations can stay together', async () => {
  const filePath = `${root}/eslint/padding-example.js`
  const invalid = await eslint.lintText(
    'async function run(fixtures, Repository) {\n  await fixtures.user()\n  const repository = new Repository()\n\n  repository.save()\n  let result = repository.find()\n\n  return result\n}\n',
    { filePath },
  )

  assert.ok(!invalid[0].messages.some((message) => message.fatal))
  assert.equal(
    invalid[0].messages.filter((message) => message.ruleId === '@stylistic/padding-line-between-statements').length,
    2,
  )

  const valid = await eslint.lintText(
    'async function run(fixtures, Repository) {\n  await fixtures.user()\n  await fixtures.account()\n\n  const repository = new Repository()\n  const result = repository.find()\n\n  return result\n}\n',
    { filePath },
  )

  assert.ok(!valid[0].messages.some((message) => message.fatal))
  assert.ok(!valid[0].messages.some((message) => message.ruleId === '@stylistic/padding-line-between-statements'))

  const fixingEslint = new ESLint({ cwd: root, flags: ['v10_config_lookup_from_file'], fix: true })
  const fixed = await fixingEslint.lintText(
    'async function run(fixtures, Repository) {\n  await fixtures.user()\n  const repository = new Repository()\n\n  return repository\n}\n',
    { filePath },
  )

  assert.ok(fixed[0].output.includes('await fixtures.user()\n\n  const repository'))
  assert.ok(!fixed[0].messages.some((message) => message.ruleId === '@stylistic/padding-line-between-statements'))
})

test('FSD rules reject upward, cross-slice, and unknown-layer imports from either working directory', async () => {
  const webRoot = `${root}/apps/web`
  const webEslint = new ESLint({ cwd: webRoot })
  const code = "import { HomePage } from '@/pages/home'\nimport { unknown } from '@/unknown-layer/example'\n"
  const options = { filePath: `${webRoot}/src/shared/api/index.ts` }
  const [rootResults, webResults, crossSliceResults] = await Promise.all([
    eslint.lintText(code, options),
    webEslint.lintText(code, options),
    eslint.lintText("import { SignInPage } from '@/pages/sign-in'\n", {
      filePath: `${webRoot}/src/pages/home/index.ts`,
    }),
  ])

  for (const results of [rootResults, webResults]) {
    assert.ok(!results[0].messages.some((message) => message.fatal))
    assert.ok(results[0].messages.some((message) => message.ruleId === 'import-fsd/no-denied-layers'))
    assert.ok(results[0].messages.some((message) => message.ruleId === 'import-fsd/no-unknown-layers'))
  }

  assert.ok(crossSliceResults[0].messages.some((message) => message.messageId === 'deniedSlice'))
})

test('FSD rules allow framework entry points and imports from lower layers', async () => {
  const results = await eslint.lintFiles([
    `${root}/apps/web/src/router.tsx`,
    `${root}/apps/web/src/routes/**/*.tsx`,
    `${root}/apps/web/src/middlewares/*.ts`,
    `${root}/apps/web/src/pages/home/ui/HomePage.tsx`,
  ])

  assert.ok(results.length > 3)
  assert.ok(
    !results.some((result) =>
      result.messages.some((message) => message.fatal || message.ruleId?.startsWith('import-fsd/')),
    ),
  )

  const api = await eslint.calculateConfigForFile(`${root}/apps/api/src/routes/session.ts`)

  assert.equal(api.rules['import-fsd/no-denied-layers'], undefined)
})

test('query and mutation factories retain inference without weakening other module boundaries', async () => {
  const [queries, mutations, helper, api] = await Promise.all([
    eslint.calculateConfigForFile(`${root}/apps/web/src/shared/api/billing.queries.ts`),
    eslint.calculateConfigForFile(`${root}/apps/web/src/shared/api/billing.mutations.ts`),
    eslint.calculateConfigForFile(`${root}/apps/web/src/shared/lib/cn.ts`),
    eslint.calculateConfigForFile(`${root}/apps/api/src/services/billing.queries.ts`),
  ])

  assert.equal(queries.rules['@typescript-eslint/explicit-module-boundary-types'][0], 0)
  assert.equal(mutations.rules['@typescript-eslint/explicit-module-boundary-types'][0], 0)
  assert.equal(helper.rules['@typescript-eslint/explicit-module-boundary-types'][0], 2)
  assert.equal(api.rules['@typescript-eslint/explicit-module-boundary-types'][0], 2)
})
