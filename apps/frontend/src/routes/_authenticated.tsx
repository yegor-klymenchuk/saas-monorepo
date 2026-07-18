import { createFileRoute, redirect } from '@tanstack/react-router'
import { authenticated } from '../middlewares/authenticated'
import { isUnauthorizedError } from '@/shared/api'

export const Route = createFileRoute('/_authenticated')({
  server: {
    middleware: [authenticated],
  },
  beforeLoad: async ({ context }) => {
    try {
      const session = await context.queryClient.ensureQueryData(context.trpc.session.get.queryOptions())

      return { session }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw redirect({ to: '/sign-in' })
      }

      throw error
    }
  },
})
