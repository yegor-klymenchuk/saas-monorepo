import { createFileRoute } from '@tanstack/react-router'
import { SignInForm } from '@/features/auth/components/sign-in-form'

export const Route = createFileRoute('/sign-in')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <SignInForm className="w-full max-w-sm" />
    </div>
  )
}
