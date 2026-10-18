import type * as Sentry from '@sentry/node'

import { beforeEach, type Mock, vi } from 'vitest'

interface SentryMocks {
  captureException: Mock<typeof Sentry.captureException>
}

const mocks = vi.hoisted(() => ({ captureException: vi.fn<typeof Sentry.captureException>() }))

vi.mock('@sentry/node', async (importOriginal) => ({
  ...(await importOriginal<typeof Sentry>()),
  captureException: mocks.captureException,
}))

export const sentryMocks: SentryMocks = mocks

beforeEach(() => {
  sentryMocks.captureException.mockReset()
  sentryMocks.captureException.mockReturnValue('00000000000000000000000000000001')
})
