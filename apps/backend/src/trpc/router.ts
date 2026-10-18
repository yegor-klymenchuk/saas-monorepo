import { createExampleRouter } from '../routes/example-router'
import { sessionRouter } from '../routes/session-router'
import { router } from './instance'

export const appRouter = router({
  example: createExampleRouter(),
  session: sessionRouter,
})

export type AppRouter = typeof appRouter
