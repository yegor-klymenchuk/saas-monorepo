import { authClient } from '@/utils/auth-client'

export const signOut = async () => {
  return authClient.signOut()
}
