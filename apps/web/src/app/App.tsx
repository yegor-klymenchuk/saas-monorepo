import type { QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import type { TrpcClient } from '@/shared/api'

import { TRPCProvider } from '@/shared/api'
import { Toaster } from '@/shared/ui'

interface AppProps {
  children: ReactNode
  queryClient: QueryClient
  trpcClient: TrpcClient
}

export function App({ children, queryClient, trpcClient }: AppProps): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
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
      </TRPCProvider>
    </QueryClientProvider>
  )
}
