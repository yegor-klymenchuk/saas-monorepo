import { describe, expect, it } from 'vitest'

import type { CreateExampleMessageRecord, ExampleMessageRecord, ExampleRepository } from './example.repository'
import { createExampleRouter } from './example.router'
import { ExampleService } from './example.service'

class InMemoryExampleRepository implements ExampleRepository {
  private readonly messages = new Map<string, ExampleMessageRecord>()

  async create(input: CreateExampleMessageRecord): Promise<ExampleMessageRecord> {
    const createdMessage: ExampleMessageRecord = {
      ...input,
      createdAt: input.createdAt ?? new Date(),
    }

    this.messages.set(createdMessage.id, createdMessage)
    return createdMessage
  }

  async findById(id: string): Promise<ExampleMessageRecord | null> {
    return this.messages.get(id) ?? null
  }
}

function createCaller() {
  const service = new ExampleService(new InMemoryExampleRepository())
  return createExampleRouter(service).createCaller({ session: null })
}

describe('example router', () => {
  it('persists a message through the POST-style mutation', async () => {
    const caller = createCaller()

    const createdMessage = await caller.createMessage({ message: 'Hello from React' })

    expect(createdMessage).toMatchObject({
      message: 'Hello from React',
    })
    expect(createdMessage.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(new Date(createdMessage.createdAt).toISOString()).toBe(createdMessage.createdAt)
  })

  it('reads the persisted message through the GET-style query', async () => {
    const caller = createCaller()
    const createdMessage = await caller.createMessage({ message: 'Stored in the repository' })

    await expect(caller.getMessage({ id: createdMessage.id })).resolves.toEqual(createdMessage)
  })

  it('maps an application not-found error to a tRPC NOT_FOUND error', async () => {
    const caller = createCaller()

    await expect(caller.getMessage({ id: '00000000-0000-4000-8000-000000000000' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      cause: {
        code: 'EXAMPLE_MESSAGE_NOT_FOUND',
      },
    })
  })
})
