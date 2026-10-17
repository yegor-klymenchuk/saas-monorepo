import { db } from '../database/database'
import { DatabaseExampleRepository } from '../repositories/DatabaseExampleRepository'
import { createExampleRouter } from '../routes/example-router'
import { sessionRouter } from '../routes/session-router'
import { ExampleService } from '../services/ExampleService'
import { router } from './instance'

export const appRouter = router({
  example: createExampleRouter(new ExampleService(new DatabaseExampleRepository(db))),
  session: sessionRouter,
})

export type AppRouter = typeof appRouter
