import eslintReact from '@eslint-react/eslint-plugin'
import pluginQuery from '@tanstack/eslint-plugin-query'
import importFsdPlugin from 'eslint-plugin-import-fsd'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import { fileURLToPath } from 'node:url'

import baseConfig from '../../eslint.config.js'
import { jsxHandlerNames } from './eslint-rules/jsx-handler-names.js'

function createWebConfig() {
  const files = ['src/**/*.{ts,tsx}']

  return [
    {
      ...importFsdPlugin.configs.recommended,
      files,
      settings: {
        fsd: {
          // Resolve from this config so linting also works from the monorepo root
          rootDir: fileURLToPath(new URL('./src', import.meta.url)),
          aliases: { '@/*': fileURLToPath(new URL('./src/*', import.meta.url)) },
        },
      },
      rules: {
        ...importFsdPlugin.configs.recommended.rules,

        /**
         * Treat TanStack routes, router construction, middleware, and bootstrap/generated
         * entry points as framework infrastructure outside the FSD layers
         */
        'import-fsd/no-unknown-layers': [
          'error',
          {
            ignores: [
              'routes',
              'router',
              'middlewares',
              'main',
              'index',
              'client',
              'server',
              'start',
              'instrument',
              'instrument.client',
              'instrument.server.test',
              'test',
              'vite-env.d',
              'routeTree',
              'routeTree.gen',
            ],
          },
        ],
      },
    },
    {
      ...eslintReact.configs['recommended-typescript'],
      files,
    },
    ...pluginQuery.configs['flat/recommended'].map((config) => ({ ...config, files })),
    {
      files,
      languageOptions: { globals: globals.browser },
      plugins: { 'react-hooks': reactHooks, local: { rules: { 'jsx-handler-names': jsxHandlerNames } } },
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'local/jsx-handler-names': 'error',
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                regex: '^api(?:/|$)',
                allowTypeImports: true,
                message: 'Web code may only use type-only imports from the API package.',
              },
            ],
          },
        ],
      },
    },
    {
      // Preserve concrete router, tRPC, and generic Better Auth response types
      files: ['src/router.tsx', 'src/shared/api/trpc.ts', 'src/features/authentication/api/*.ts'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': [
          'error',
          { allowedNames: ['getRouter', 'createTrpcOptions', 'signIn', 'signUp', 'signOut'] },
        ],
      },
    },
    {
      files: ['src/**/*.queries.ts', 'src/**/*.mutations.ts'],
      rules: {
        /**
         * Preserve the return types inferred by TanStack Query's queryOptions and
         * mutationOptions factories instead of duplicating their generic signatures
         */
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
  ]
}

export default [...baseConfig, ...createWebConfig()]
