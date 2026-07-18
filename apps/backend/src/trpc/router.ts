import { db } from '../database/database'
import { createExampleModule } from '../modules/example/example.module'
import { sessionRouter } from '../modules/session/session.router'
import { router } from './instance'

export const appRouter = router({
  example: createExampleModule({ database: db }),
  session: sessionRouter,
})

export type AppRouter = typeof appRouter
