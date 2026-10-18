import * as Sentry from '@sentry/tanstackstart-react'
import dotenv from 'dotenv'
import { z } from 'zod'

const nodeEnvironment = process.env.NODE_ENV ?? 'development'

dotenv.config({
  path: [`.env.${nodeEnvironment}.local`, '.env.local', `.env.${nodeEnvironment}`, '.env'],
  quiet: true,
})

const config = z
  .object({
    SENTRY_DSN: z.union([z.url(), z.literal('')]).optional(),
    VITE_SENTRY_DSN: z.union([z.url(), z.literal('')]).optional(),
  })
  .parse(process.env)
const dsn = config.SENTRY_DSN || config.VITE_SENTRY_DSN

if (dsn && process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn,
    environment: nodeEnvironment,
    tracesSampleRate: 0.1,
    // Capture SSR failures logged by React's streaming renderer
    integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    },
  })
}
