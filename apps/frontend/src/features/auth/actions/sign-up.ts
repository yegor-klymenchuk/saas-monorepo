import { z } from 'zod'
import { authClient } from '@/utils/auth-client'
import { env } from '@/env'

const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
})

export type SignUpData = z.infer<typeof signUpSchema>

export const signUp = async (data: SignUpData) => {
  return authClient.signUp.email({
    name: data.name,
    email: data.email,
    password: data.password,
    callbackURL: `${env.VITE_APP_URL}/dashboard`,
  })
}
