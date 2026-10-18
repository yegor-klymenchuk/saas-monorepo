import { afterAll, beforeEach, type Mock, vi } from 'vitest'

interface MailMocks {
  fetch: Mock<typeof fetch>
}

export const mailMocks: MailMocks = {
  fetch: vi.spyOn(globalThis, 'fetch'),
}

beforeEach(() => {
  mailMocks.fetch.mockReset()
  mailMocks.fetch.mockImplementation(() => {
    throw new Error('Unexpected mail HTTP request')
  })
})

afterAll(() => {
  mailMocks.fetch.mockRestore()
})
