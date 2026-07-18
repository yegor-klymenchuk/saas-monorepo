import { initTRPC, TRPCDefaultErrorShape, TRPCError } from '@trpc/server'

import type { APIContext } from './context'
import { ApplicationError } from '../errors/ApplicationError'

export function formatTRPCError(shape: TRPCDefaultErrorShape, error: TRPCError) {
  return {
    ...shape,
    data: {
      ...shape.data,
      applicationCode: error.cause instanceof ApplicationError ? error.cause.code : null,
    },
  }
}

const t = initTRPC.context<APIContext>().create({
  errorFormatter: ({ shape, error }) => formatTRPCError(shape, error),
})

export const middleware = t.middleware
export const procedure = t.procedure
export const router = t.router
