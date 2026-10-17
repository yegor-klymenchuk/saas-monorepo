import { SignInForm } from '@/features/authentication'

export function SignInPage(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <SignInForm className="w-full max-w-sm" />
    </div>
  )
}
