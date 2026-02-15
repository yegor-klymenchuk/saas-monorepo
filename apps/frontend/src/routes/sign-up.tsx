import { createFileRoute } from '@tanstack/react-router'
import { SignUpForm } from '@/features/auth/components/sign-up-form'

export const Route = createFileRoute('/sign-up')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <SignUpForm className="w-full max-w-sm" />
    </div>
  )
}
