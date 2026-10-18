import baseConfig from '../../eslint.config.js'

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: false, project: './tsconfig.eslint.json', tsconfigRootDir: import.meta.dirname },
    },
  },
]
