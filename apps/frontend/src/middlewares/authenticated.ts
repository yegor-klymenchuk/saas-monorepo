import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { createTrpcClient, isUnauthorizedError } from '@/shared/api'

export const authenticated = createMiddleware().server(async ({ next }) => {
  try {
    const session = await createTrpcClient().session.get.query()

    return await next({
      context: { session },
    })
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw redirect({ to: '/sign-in' })
    }

    throw error
  }
})
