import { initTsrReactQuery } from '@ts-rest/react-query/v5'
import { contracts } from 'contracts'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { env } from '@/shared/config'

export const getApiClient = createIsomorphicFn()
  .client(() => {
    return initTsrReactQuery(contracts, {
      baseUrl: env.VITE_SERVER_URL,
      credentials: 'include',
    })
  })
  .server(() => {
    const sessionToken = getCookie('better-auth.session_token')

    return initTsrReactQuery(contracts, {
      baseUrl: env.VITE_SERVER_URL,
      baseHeaders: sessionToken
        ? {
            Cookie: `better-auth.session_token=${sessionToken}`,
          }
        : {},
    })
  })
