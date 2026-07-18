import { TRPCClientError, createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCContext, createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

import type { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from 'backend/trpc'
import { env } from '@/shared/config'

const trpcUrl = `${env.VITE_SERVER_URL.replace(/\/$/, '')}/trpc`

function makeTrpcClient(cookie?: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: trpcUrl,
        headers: cookie ? { Cookie: cookie } : undefined,
        fetch(url, options) {
          return globalThis.fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
      }),
    ],
  })
}

export const createTrpcClient = createIsomorphicFn()
  .client(() => makeTrpcClient())
  .server(() => {
    const sessionToken = getCookie('better-auth.session_token')
    const cookie = sessionToken ? `better-auth.session_token=${sessionToken}` : undefined

    return makeTrpcClient(cookie)
  })

export const createTrpcOptions = (trpcClient: ReturnType<typeof makeTrpcClient>, queryClient: QueryClient) =>
  createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
  })

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED'
}

export type TrpcClient = ReturnType<typeof makeTrpcClient>
export type TrpcOptions = ReturnType<typeof createTrpcOptions>
