import type { QueryClient } from '@tanstack/react-query'
import type { i18n } from 'i18next'

import * as Sentry from '@sentry/tanstackstart-react'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import type { TrpcClient, TrpcOptions } from '@/shared/api'

import { createTrpcClient, createTrpcOptions } from '@/shared/api'
import { createI18n } from '@/shared/i18n'
import { createQueryClient } from '@/shared/lib'

import { routeTree } from './routeTree.gen'

export interface RouterContext {
  i18n: i18n
  queryClient: QueryClient
  trpcClient: TrpcClient
  trpc: TrpcOptions
}

export const getRouter = async () => {
  const i18n = await createI18n()
  const queryClient = createQueryClient()
  const trpcClient = createTrpcClient()
  const trpc = createTrpcOptions(trpcClient, queryClient)
  const router = createRouter({
    routeTree,
    context: {
      i18n,
      queryClient,
      trpcClient,
      trpc,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultOnCatch: (error) => {
      Sentry.captureException(error)
    },
  })

  if (!router.isServer) {
    Sentry.addIntegration(Sentry.tanstackRouterBrowserTracingIntegration(router))
  }

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    wrapQueryClient: false,
  })

  return router
}
