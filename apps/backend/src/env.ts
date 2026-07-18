import { z } from 'zod'
import dotenv from 'dotenv'

const nodeEnvironment = process.env.NODE_ENV ?? 'development'
dotenv.config({ path: `.env.${nodeEnvironment}` })
process.env.NODE_ENV ??= nodeEnvironment

const envSchema = z.object({
  NODE_ENV: z.enum(['test', 'development']),

  // Server
  SERVER_HOST: z.url(),
  SERVER_PORT: z.string().transform((val) => parseInt(val, 10)),

  // Cors
  CORS_ORIGIN: z.url(),

  // Better Auth
  BETTER_AUTH_URL: z.string(),
  BETTER_AUTH_SECRET: z.string(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),

  // Database
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.coerce.number(),
  DATABASE_USERNAME: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),
})

export const env = envSchema.parse(process.env)
