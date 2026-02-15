// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'

/** @type {import('eslint').Linter.Config[]} */
const config = [...tanstackConfig, ...pluginQuery.configs['flat/recommended']]

export default config
