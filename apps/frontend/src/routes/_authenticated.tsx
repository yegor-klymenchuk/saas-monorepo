import { createFileRoute, redirect } from '@tanstack/react-router'
import { getApiClient } from '@/integrations/ts-rest'
import { authenticated } from '@/middlewares/authenticated'

export const Route = createFileRoute('/_authenticated')({
  server: {
    middleware: [authenticated],
  },
  beforeLoad: async () => {
    const response = await getApiClient().session.get.query()

    if (response.status !== 200) {
      throw redirect({ to: '/sign-in' })
    }

    return { session: response.body }
  },
})
