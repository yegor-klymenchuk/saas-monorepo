import type { i18n } from 'i18next'

import { createInstance } from 'i18next'
import defaultResources from 'locales'

export const defaultLocale = 'en-US'

export async function createI18n(): Promise<i18n> {
  const instance = createInstance()

  await instance.init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: [defaultLocale],
    defaultNS: 'common',
    ns: Object.keys(defaultResources),
    keySeparator: false,
    resources: { [defaultLocale]: structuredClone(defaultResources) },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

  return instance
}
