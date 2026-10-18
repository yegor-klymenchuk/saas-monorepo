import { createFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '@/pages/dashboard'

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: () => ({ now: Date.now() }),
  component: DashboardRoute,
})

function DashboardRoute(): React.JSX.Element {
  const { session } = Route.useRouteContext()
  const { now } = Route.useLoaderData()

  return <DashboardPage currentSession={session} now={now} />
}
