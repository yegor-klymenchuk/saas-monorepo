// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { afterEach, describe, expect, it } from 'vitest'

import { createI18n, defaultLocale } from './i18n'

function Welcome(): React.JSX.Element {
  const { t } = useTranslation('home')

  return <h1>{t('navigation.signIn.title')}</h1>
}

describe('I18n - English Resources and Server Rendering', () => {
  afterEach(() => {
    cleanup()
  })

  it('loads English namespaces before returning the instance', async () => {
    const i18n = await createI18n()

    expect(i18n.isInitialized).toBe(true)
    expect(i18n.resolvedLanguage).toBe(defaultLocale)
    expect(i18n.options.supportedLngs).toContain('en-US')
    expect(i18n.dir()).toBe('ltr')
    expect(i18n.t('app.title')).toBe('TanStack Start Starter')
    expect(i18n.t('validation.password.minimum', { ns: 'auth', count: 8 })).toBe(
      'Password must be at least 8 characters long',
    )
    expect(i18n.t('account.membership.duration', { ns: 'dashboard', count: 1 })).toBe("You've been with us for 1 day")
    expect(i18n.t('account.membership.duration', { ns: 'dashboard', count: 5 })).toBe("You've been with us for 5 days")
  })

  it('isolates resources between instances created for separate requests', async () => {
    const [first, second] = await Promise.all([createI18n(), createI18n()])

    first.addResource('en-US', 'common', 'app.title', 'Request-specific title')

    expect(first.t('app.title')).toBe('Request-specific title')
    expect(second.t('app.title')).toBe('TanStack Start Starter')
  })

  it('falls back to English when an unsupported language is requested', async () => {
    const i18n = await createI18n()

    await i18n.changeLanguage('fr-FR')

    expect(i18n.resolvedLanguage).toBe('en-US')
    expect(i18n.t('app.title')).toBe('TanStack Start Starter')
  })

  it('renders English during SSR without exposing translation keys', async () => {
    const i18n = await createI18n()

    const markup = renderToString(
      <I18nextProvider i18n={i18n}>
        <Welcome />
      </I18nextProvider>,
    )

    expect(markup).toBe('<h1>Sign In</h1>')
  })

  it('hydrates server-rendered English with a separate client instance without mismatches', async () => {
    const serverI18n = await createI18n()
    const container = document.createElement('div')

    container.innerHTML = renderToString(
      <I18nextProvider i18n={serverI18n}>
        <Welcome />
      </I18nextProvider>,
    )
    document.body.append(container)

    const clientI18n = await createI18n()
    const errors: unknown[] = []
    const view = render(
      <I18nextProvider i18n={clientI18n}>
        <Welcome />
      </I18nextProvider>,
      { container, hydrate: true, onRecoverableError: (error) => errors.push(error) },
    )

    expect(view.getByRole('heading', { name: 'Sign In' }).textContent).toBe('Sign In')
    expect(errors).toEqual([])
  })
})
