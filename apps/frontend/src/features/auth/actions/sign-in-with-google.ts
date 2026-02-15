import { createIsomorphicFn } from '@tanstack/react-start'
import { env } from '@/env'
import { authClient } from '@/utils/auth-client'

export const signInWithGoogle = createIsomorphicFn().client(() => {
  return authClient.signIn.social({
    provider: 'google',
    callbackURL: `${env.VITE_APP_URL}/dashboard`,
  })
})
