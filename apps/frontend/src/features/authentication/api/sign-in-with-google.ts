import { createIsomorphicFn } from '@tanstack/react-start'
import { env } from '@/shared/config'
import { authClient } from '@/shared/auth'

export const signInWithGoogle = createIsomorphicFn().client(() => {
  return authClient.signIn.social({
    provider: 'google',
    callbackURL: `${env.VITE_APP_URL}/dashboard`,
  })
})
