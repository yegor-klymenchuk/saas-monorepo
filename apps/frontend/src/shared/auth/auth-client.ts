import { stripeClient } from '@better-auth/stripe/client'
import { createAuthClient } from 'better-auth/react'

import { env } from '@/shared/config'

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [stripeClient({ subscription: true })],
})
