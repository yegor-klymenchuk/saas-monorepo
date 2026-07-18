import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import type { QueryClient } from '@tanstack/react-query'
import type { TrpcClient, TrpcOptions } from '@/shared/api'
import { createTrpcClient, createTrpcOptions } from '@/shared/api'
import { createQueryClient } from '@/shared/lib'

export type RouterContext = {
  queryClient: QueryClient
  trpcClient: TrpcClient
  trpc: TrpcOptions
}

export const getRouter = () => {
  const queryClient = createQueryClient()
  const trpcClient = createTrpcClient()
  const trpc = createTrpcOptions(trpcClient, queryClient)
  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      trpcClient,
      trpc,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    wrapQueryClient: false,
  })

  return router
}
