import { eq } from 'drizzle-orm'

import type { db as applicationDatabase } from '../../database/database'
import { exampleMessage } from '../../database/schema/example-message'

export type ExampleMessageRecord = typeof exampleMessage.$inferSelect
export type CreateExampleMessageRecord = typeof exampleMessage.$inferInsert

export interface ExampleRepository {
  create(input: CreateExampleMessageRecord): Promise<ExampleMessageRecord>
  findById(id: string): Promise<ExampleMessageRecord | null>
}

export class DatabaseExampleRepository implements ExampleRepository {
  #database: typeof applicationDatabase

  constructor(database: typeof applicationDatabase) {
    this.#database = database
  }

  async create(input: CreateExampleMessageRecord): Promise<ExampleMessageRecord> {
    const [createdMessage] = await this.#database.insert(exampleMessage).values(input).returning()

    if (!createdMessage) {
      throw new Error('The database did not return the created example message')
    }

    return createdMessage
  }

  async findById(id: string): Promise<ExampleMessageRecord | null> {
    const message = await this.#database.query.exampleMessage.findFirst({
      where: eq(exampleMessage.id, id),
    })

    return message ?? null
  }
}
