import { randomUUID } from 'node:crypto'

import type { ExampleRepository } from './example.repository'
import { ExampleMessageNotFoundError } from './errors/ExampleMessageNotFoundError'

export type ExampleMessage = {
  id: string
  message: string
  createdAt: string
}

export class ExampleService {
  #repository: ExampleRepository

  constructor(repository: ExampleRepository) {
    this.#repository = repository
  }

  async createMessage(message: string): Promise<ExampleMessage> {
    const createdMessage = await this.#repository.create({
      id: randomUUID(),
      message,
    })

    return this.#toExampleMessage(createdMessage)
  }

  async getMessage(id: string): Promise<ExampleMessage> {
    const message = await this.#repository.findById(id)

    if (!message) {
      throw new ExampleMessageNotFoundError(id)
    }

    return this.#toExampleMessage(message)
  }

  #toExampleMessage(message: { id: string; message: string; createdAt: Date }): ExampleMessage {
    return {
      id: message.id,
      message: message.message,
      createdAt: message.createdAt.toISOString(),
    }
  }
}
