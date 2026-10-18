import { wrapFetchWithSentry } from '@sentry/tanstackstart-react'
import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

export default createServerEntry(
  wrapFetchWithSentry({
    fetch(request, options) {
      return handler.fetch(request, options)
    },
  }),
)
