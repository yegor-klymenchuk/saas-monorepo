import type { AddressInfo } from 'node:net'

import { createServer } from 'node:http'
import { gunzipSync } from 'node:zlib'
import { afterAll, beforeAll, beforeEach } from 'vitest'

interface SentryMock {
  dsn: string
  events: Record<string, unknown>[]
}

export const sentryMock: SentryMock = { dsn: '', events: [] }

const server = createServer(async (request, response) => {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk))
  }

  const body = Buffer.concat(chunks)
  const content = request.headers['content-encoding'] === 'gzip' ? gunzipSync(body) : body
  const lines = content.toString().trim().split('\n')

  for (let index = 1; index + 1 < lines.length; index += 2) {
    const header = JSON.parse(lines[index]) as { type: string }

    if (header.type === 'event') {
      sentryMock.events.push(JSON.parse(lines[index + 1]))
    }
  }

  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end('{}')
})

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  const address = server.address() as AddressInfo

  sentryMock.dsn = `http://public@127.0.0.1:${address.port}/1`
})

beforeEach(() => {
  sentryMock.events.length = 0
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
})
