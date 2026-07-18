import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getApiClient } from '@/shared/api'

export const authenticated = createMiddleware().server(async ({ next }) => {
  const response = await getApiClient().session.get.query()

  if (response.status !== 200) {
    throw redirect({ to: '/sign-in' })
  }

  return await next({
    context: { session: response.body },
  })
})
