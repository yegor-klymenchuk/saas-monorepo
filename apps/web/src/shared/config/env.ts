import z from 'zod'

export const envSchema = z.object({
  VITE_APP_URL: z.url(),
  VITE_SERVER_URL: z.url(),
  VITE_SENTRY_DSN: z.union([z.url(), z.literal('')]).optional(),
})

export const env: z.infer<typeof envSchema> = envSchema.parse(import.meta.env)
