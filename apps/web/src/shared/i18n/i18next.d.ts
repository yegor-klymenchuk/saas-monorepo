import type defaultResources from 'locales'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    keySeparator: false
    resources: typeof defaultResources
    strictKeyChecks: true
  }
}
