import { checkoutInputSchema, checkoutResponseSchema } from '../schemas/billing'
import { BillingService } from '../services/BillingService'
import { router } from '../trpc/instance'
import { protectedProcedure } from '../trpc/procedures'

const service = new BillingService()

export const billingRouter = router({
  createPaymentCheckout: protectedProcedure
    .input(checkoutInputSchema)
    .output(checkoutResponseSchema)
    .mutation(({ ctx, input }) => service.createPaymentCheckout(ctx.session.user, input)),
})
