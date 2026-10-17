import { z } from 'zod'

export const sessionResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    userId: z.string(),
    expiresAt: z.iso.datetime(),
    token: z.string(),
    ipAddress: z.string().nullish(),
    userAgent: z.string().nullish(),
  }),
  user: z.object({
    id: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    email: z.email(),
    emailVerified: z.boolean(),
    name: z.string().nullable(),
    image: z.string().nullish(),
  }),
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>
