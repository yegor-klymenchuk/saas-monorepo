import baseConfig from '../../eslint.config.js'

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: false, project: './tsconfig.eslint.json', tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // Preserve concrete procedure types in the public AppRouter contract
    files: ['src/routes/*-router.ts'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': ['error', { allowedNames: ['createExampleRouter'] }],
    },
  },
]
