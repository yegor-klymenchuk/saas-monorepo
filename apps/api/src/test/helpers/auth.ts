import { randomUUID } from 'node:crypto'

import { env } from '../../env'
import { request } from '../request'

export async function signUp(): Promise<{ userId: string; cookie: string }> {
  const response = await request
    .post('/api/auth/sign-up/email')
    .set('Origin', env.CORS_ORIGIN)
    .send({ name: 'Test User', email: `${randomUUID()}@example.test`, password: 'test-user-password' })
    .expect(200)
  const cookies = response.headers['set-cookie'] as unknown as string[]

  return { userId: response.body.user.id as string, cookie: cookies.map((cookie) => cookie.split(';')[0]).join('; ') }
}
