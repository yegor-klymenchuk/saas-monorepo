import { authClient } from '@/shared/auth'

export const signOut = async () => {
  return authClient.signOut()
}
