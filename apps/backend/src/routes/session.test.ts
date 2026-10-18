import { describe, expect, it } from 'vitest'

import { signUp } from '../test/helpers/auth'
import { request } from '../test/request'

describe('Session Router - HTTP Contracts', () => {
  it('returns the authenticated session with serialized timestamps', async () => {
    const account = await signUp()

    const response = await request.get('/trpc/session.get').set('Cookie', account.cookie).expect(200)

    expect(response.body.result.data).toMatchObject({
      session: {
        userId: account.userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        expiresAt: expect.any(String),
      },
      user: { id: account.userId, name: 'Test User', createdAt: expect.any(String), updatedAt: expect.any(String) },
    })
    expect(new Date(response.body.result.data.session.expiresAt).toISOString()).toBe(
      response.body.result.data.session.expiresAt,
    )
  })

  it('returns 401 UNAUTHORIZED without an authenticated session', async () => {
    const response = await request.get('/trpc/session.get').expect(401)

    expect(response.body.error.data).toMatchObject({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
      applicationCode: 'UNAUTHORIZED',
    })
  })
})
