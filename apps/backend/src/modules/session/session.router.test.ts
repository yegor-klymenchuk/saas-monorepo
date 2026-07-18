import { describe, expect, it } from 'vitest'

import type { SessionResponse } from './session.schema'
import { sessionRouter } from './session.router'

const session: SessionResponse = {
  session: {
    id: 'session-1',
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-18T10:00:00.000Z',
    userId: 'user-1',
    expiresAt: '2026-07-25T10:00:00.000Z',
    token: 'session-token',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
  },
  user: {
    id: 'user-1',
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-18T10:00:00.000Z',
    email: 'user@example.com',
    emailVerified: true,
    name: 'Test User',
    image: null,
  },
}

describe('session.get', () => {
  it('returns the current authenticated session', async () => {
    const caller = sessionRouter.createCaller({ session })

    await expect(caller.get()).resolves.toEqual(session)
  })

  it('rejects an unauthenticated caller with UNAUTHORIZED', async () => {
    const caller = sessionRouter.createCaller({ session: null })

    await expect(caller.get()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      cause: {
        code: 'UNAUTHORIZED',
      },
      message: 'Unauthorized',
    })
  })
})
