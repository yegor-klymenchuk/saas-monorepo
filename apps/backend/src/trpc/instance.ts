import type { TRPCDefaultErrorShape, TRPCError } from '@trpc/server'

import { initTRPC } from '@trpc/server'

import type { APIContext } from './context'

import { ApplicationError } from '../errors/ApplicationError'

export function formatTRPCError(
  shape: TRPCDefaultErrorShape,
  error: TRPCError,
): TRPCDefaultErrorShape & { data: { applicationCode: string | null } } {
  return {
    ...shape,
    data: {
      ...shape.data,
      applicationCode: error.cause instanceof ApplicationError ? error.cause.code : null,
    },
  }
}

const trpc = initTRPC.context<APIContext>().create({
  errorFormatter: ({ shape, error }) => formatTRPCError(shape, error),
})

export const middleware = trpc.middleware
export const procedure = trpc.procedure
export const router = trpc.router
