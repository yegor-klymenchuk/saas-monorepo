// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: ['.nitro/**', '.output/**', 'dist/**', 'eslint.config.js'],
  },
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['backend', 'backend/*'],
              allowTypeImports: true,
              message: 'Frontend code may only use type-only imports from the backend public API.',
            },
          ],
        },
      ],
    },
  },
]

export default config
