import { createFileRoute } from '@tanstack/react-router'

import { SignUpPage } from '@/pages/sign-up'

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
})
