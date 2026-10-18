import { z } from 'zod'

export const checkoutInputSchema = z.object({
  productKey: z.string().min(1),
  requestId: z.uuid(),
})

export const checkoutResponseSchema = z.object({
  id: z.string(),
  url: z.url(),
})

export type CheckoutInput = z.infer<typeof checkoutInputSchema>
