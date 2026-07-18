import { TRPC_ERROR_CODE_KEY, TRPCError } from '@trpc/server'
import { ApplicationError } from '../../errors/ApplicationError'
import { middleware } from '../instance'
import { UnprocessableContentError } from '../../errors/UnprocessableContentError'
import { NotFoundError } from '../../errors/NotFoundError'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { ForbiddenError } from '../../errors/ForbiddenError'
import { ConflictError } from '../../errors/ConflictError'
import { BadRequestError } from '../../errors/BadRequestError'

export function getTRPCErrorCode(error: ApplicationError): TRPC_ERROR_CODE_KEY {
  if (error instanceof UnprocessableContentError) return 'UNPROCESSABLE_CONTENT'
  if (error instanceof NotFoundError) return 'NOT_FOUND'
  if (error instanceof UnauthorizedError) return 'UNAUTHORIZED'
  if (error instanceof ForbiddenError) return 'FORBIDDEN'
  if (error instanceof ConflictError) return 'CONFLICT'
  if (error instanceof BadRequestError) return 'BAD_REQUEST'

  return 'INTERNAL_SERVER_ERROR'
}

export const errorMiddleware = middleware(async ({ next }) => {
  const result = await next()
  const cause = result.ok ? null : result.error.cause

  if (cause instanceof ApplicationError) {
    throw new TRPCError({
      code: getTRPCErrorCode(cause),
      message: cause.message,
      cause,
    })
  }

  return result
})
