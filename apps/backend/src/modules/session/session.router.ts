import { initServer } from '@ts-rest/express'
import { contracts } from 'contracts'
import { auth } from '../../utils/auth'
import { fromNodeHeaders } from 'better-auth/node'

const s = initServer()

const router = s.router(contracts.session, {
  get: async ({ req }) => {
    const response = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!response) {
      return {
        status: 401,
        body: {
          message: 'Unauthorized',
        },
      }
    }

    return {
      status: 200,
      body: {
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
  },
})

export const sessionModule = {
  router,
  contract: contracts.session,
}
