import z from 'zod'

export const envSchema = z.object({
  VITE_APP_URL: z.url(),
  VITE_SERVER_URL: z.url(),
})

export const env = envSchema.parse(import.meta.env)
