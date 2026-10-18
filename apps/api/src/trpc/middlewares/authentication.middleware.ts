import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { middleware } from '../instance'

export const authenticationMiddleware = middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new UnauthorizedError()
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
