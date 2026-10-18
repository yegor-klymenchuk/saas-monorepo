import type { TRPC_ERROR_CODE_KEY } from '@trpc/server'

import { TRPCError } from '@trpc/server'

import { ApplicationError } from '../../errors/ApplicationError'
import { BadRequestError } from '../../errors/BadRequestError'
import { ConflictError } from '../../errors/ConflictError'
import { ForbiddenError } from '../../errors/ForbiddenError'
import { NotFoundError } from '../../errors/NotFoundError'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { UnprocessableContentError } from '../../errors/UnprocessableContentError'
import { middleware } from '../instance'

export function getTRPCErrorCode(error: ApplicationError): TRPC_ERROR_CODE_KEY {
  if (error instanceof UnprocessableContentError) {
    return 'UNPROCESSABLE_CONTENT'
  }

  if (error instanceof NotFoundError) {
    return 'NOT_FOUND'
  }

  if (error instanceof UnauthorizedError) {
    return 'UNAUTHORIZED'
  }

  if (error instanceof ForbiddenError) {
    return 'FORBIDDEN'
  }

  if (error instanceof ConflictError) {
    return 'CONFLICT'
  }

  if (error instanceof BadRequestError) {
    return 'BAD_REQUEST'
  }

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
