import { z } from 'zod'
import { authClient } from '@/utils/auth-client'
import { env } from '@/env'

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type SignInData = z.infer<typeof signInSchema>

export const signIn = async (data: SignInData) => {
  return authClient.signIn.email({
    email: data.email,
    password: data.password,
    callbackURL: `${env.VITE_APP_URL}/dashboard`,
  })
}
