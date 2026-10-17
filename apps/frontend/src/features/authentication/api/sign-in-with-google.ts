import { createIsomorphicFn } from '@tanstack/react-start'

import { authClient } from '@/shared/auth'
import { env } from '@/shared/config'

export const signInWithGoogle = createIsomorphicFn().client(() => {
  return authClient.signIn.social({
    provider: 'google',
    callbackURL: `${env.VITE_APP_URL}/dashboard`,
  })
})
