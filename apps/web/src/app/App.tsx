import type { QueryClient } from '@tanstack/react-query'
import type { i18n } from 'i18next'
import type { ReactNode } from 'react'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { I18nextProvider } from 'react-i18next'

import type { TrpcClient } from '@/shared/api'

import { TRPCProvider } from '@/shared/api'
import { Toaster } from '@/shared/ui'

interface AppProps {
  i18n: i18n
  children: ReactNode
  queryClient: QueryClient
  trpcClient: TrpcClient
}

export function App({ children, i18n, queryClient, trpcClient }: AppProps): React.JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
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
    </I18nextProvider>
  )
}
