import { billingRouter } from '../routes/billing'
import { sessionRouter } from '../routes/session'
import { router } from './instance'

export const appRouter = router({
  billing: billingRouter,
  session: sessionRouter,
})

export type AppRouter = typeof appRouter
