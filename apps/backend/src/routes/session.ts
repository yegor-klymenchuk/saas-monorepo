import { sessionResponseSchema } from '../schemas/session'
import { router } from '../trpc/instance'
import { protectedProcedure } from '../trpc/procedures'

export const sessionRouter = router({
  get: protectedProcedure.output(sessionResponseSchema).query(({ ctx }) => ctx.session),
})
