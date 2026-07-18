import { z } from 'zod'

export const getExampleMessageInputSchema = z.object({
  id: z.uuid(),
})

export const createExampleMessageInputSchema = z.object({
  message: z.string().trim().min(1).max(200),
})

export const exampleMessageSchema = z.object({
  id: z.uuid(),
  message: z.string(),
  createdAt: z.iso.datetime(),
})
