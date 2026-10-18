import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import prettier from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import pluginPrettier from 'eslint-plugin-prettier'
import globals from 'globals'
import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'

const alphabetical = { type: 'alphabetical', order: 'asc' }
const functionDeclaration = {
  selector: [
    'FunctionDeclaration',
    'VariableDeclaration[declarations.0.init.type=/^(ArrowFunctionExpression|FunctionExpression)$/]',
    'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]',
    'ExportDefaultDeclaration[declaration.type=/^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/]',
    'ExportNamedDeclaration[declaration.declarations.0.init.type=/^(ArrowFunctionExpression|FunctionExpression)$/]',
  ].join(', '),
}

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.output/**',
      '**/.nitro/**',
      '**/.tanstack/**',
      '**/coverage/**',
      '**/routeTree.gen.ts',
      '.agents/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: globals.node,
      parserOptions: { tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url)) },
    },
    plugins: { '@stylistic': stylistic, perfectionist, prettier: pluginPrettier },
    rules: {
      'prettier/prettier': 'warn',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      curly: ['error', 'all'],
      'prefer-const': 'error',
      'perfectionist/sort-imports': ['error', alphabetical],
      'perfectionist/sort-exports': ['error', alphabetical],
      'perfectionist/sort-named-imports': ['error', alphabetical],
      'perfectionist/sort-named-exports': ['error', alphabetical],
      'id-length': ['error', { min: 2, exceptions: ['_', 'z'], properties: 'never' }],
      '@stylistic/multiline-comment-style': ['error', 'starred-block'],
      '@stylistic/padded-blocks': ['error', 'never'],
      '@stylistic/lines-between-class-members': [
        'error',
        {
          enforce: [
            { blankLine: 'always', prev: 'method', next: '*' },
            { blankLine: 'always', prev: '*', next: 'method' },
          ],
        },
      ],
      '@stylistic/spaced-comment': ['error', 'always'],
      '@stylistic/lines-around-comment': [
        'error',
        {
          beforeBlockComment: true,
          allowBlockStart: true,
          allowClassStart: true,
          allowObjectStart: true,
          allowInterfaceStart: true,
        },
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: 'expression', next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: ['case', 'default'], next: '*' },
        { blankLine: 'any', prev: 'case', next: 'case' },
        { blankLine: 'always', prev: 'if', next: '*' },
        { blankLine: 'always', prev: functionDeclaration, next: functionDeclaration },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
        { selector: 'property', format: null },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    files: ['**/src/**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { projectService: true } },
    rules: { '@typescript-eslint/no-floating-promises': 'error' },
  },
  {
    files: ['packages/locales/src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './packages/locales/tsconfig.json',
      },
    },
  },
]
