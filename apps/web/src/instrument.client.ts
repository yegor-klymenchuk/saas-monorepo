import * as Sentry from '@sentry/tanstackstart-react'

import { env } from '@/shared/config'

if (env.VITE_SENTRY_DSN && import.meta.env.MODE !== 'test') {
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: import.meta.env.PROD ? 'production' : 'development',
    tracesSampleRate: 0.1,
    tracePropagationTargets: [env.VITE_APP_URL, env.VITE_SERVER_URL],
    dataCollection: { userInfo: false, cookies: false, httpBodies: [], urlQueryParams: false },
  })
}
