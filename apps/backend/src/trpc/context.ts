import { fromNodeHeaders } from 'better-auth/node'

import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import type { SessionResponse } from '../modules/session/session.schema'
import { auth } from '../lib/auth'

export type APIContext = {
  session: SessionResponse | null
}

export async function createContext({ req }: CreateExpressContextOptions): Promise<APIContext> {
  const response = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })

  if (!response) {
    return { session: null }
  }

  return {
    session: {
      session: {
        id: response.session.id,
        createdAt: response.session.createdAt.toISOString(),
        updatedAt: response.session.updatedAt.toISOString(),
        userId: response.session.userId,
        expiresAt: response.session.expiresAt.toISOString(),
        token: response.session.token,
        ipAddress: response.session.ipAddress,
        userAgent: response.session.userAgent,
      },
      user: {
        id: response.user.id,
        createdAt: response.user.createdAt.toISOString(),
        updatedAt: response.user.updatedAt.toISOString(),
        email: response.user.email,
        emailVerified: response.user.emailVerified,
        name: response.user.name,
        image: response.user.image,
      },
    },
  }
}
