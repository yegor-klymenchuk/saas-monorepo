import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import * as React from 'react'

import type { RouterContext } from '@/router'

import { App } from '@/app/App'
import appCss from '@/app/styles.css?url'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: ({ match }) => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: match.context.i18n.t('app.title'),
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { i18n, queryClient, trpcClient } = Route.useRouteContext()

  return (
    <html lang={i18n.resolvedLanguage} dir={i18n.dir()}>
      <head>
        <HeadContent />
      </head>
      <body>
        <App i18n={i18n} queryClient={queryClient} trpcClient={trpcClient}>
          {children}
        </App>
        <Scripts />
      </body>
    </html>
  )
}
