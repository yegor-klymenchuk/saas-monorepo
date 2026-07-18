import { router } from '../../trpc/instance'
import { protectedProcedure } from '../../trpc/procedures'
import { sessionResponseSchema } from './session.schema'

export const sessionRouter = router({
  get: protectedProcedure.output(sessionResponseSchema).query(({ ctx }) => ctx.session),
})
