import { initContract } from '@ts-rest/core'
import { z } from 'zod'

const c = initContract()

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

export const sessionContract = c.router({
  get: {
    method: 'GET',
    path: '/api/session',
    responses: {
      200: sessionResponseSchema,
      401: z.object({
        message: z.string(),
      }),
    },
    summary: 'Get current user session',
  },
})

export type SessionContract = typeof sessionContract
