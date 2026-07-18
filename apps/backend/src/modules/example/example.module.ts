import type { db as applicationDatabase } from '../../database/database'
import { DatabaseExampleRepository } from './example.repository'
import { createExampleRouter } from './example.router'
import { ExampleService } from './example.service'

type ExampleModuleDependencies = {
  database: typeof applicationDatabase
}

export function createExampleModule({ database }: ExampleModuleDependencies) {
  const repository = new DatabaseExampleRepository(database)
  const service = new ExampleService(repository)

  return createExampleRouter(service)
}
