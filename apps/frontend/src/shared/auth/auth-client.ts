import { createAuthClient } from 'better-auth/react'
import { env } from '@/shared/config'

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
})
