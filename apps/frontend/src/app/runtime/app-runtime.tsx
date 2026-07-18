import { QueryClientProvider } from '@tanstack/react-query'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { queryClient } from './query-client'
import type { ReactNode } from 'react'
import { getApiClient } from '@/shared/api'
import { Toaster } from '@/shared/ui'

export function AppRuntime({ children }: { children: ReactNode }) {
  const apiClient = getApiClient()

  return (
    <QueryClientProvider client={queryClient}>
      <apiClient.ReactQueryProvider>
        {children}
        <Toaster />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </apiClient.ReactQueryProvider>
    </QueryClientProvider>
  )
}
