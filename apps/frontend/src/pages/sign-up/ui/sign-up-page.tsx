import { SignUpForm } from '@/features/authentication'

export function SignUpPage() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <SignUpForm className="w-full max-w-sm" />
    </div>
  )
}
