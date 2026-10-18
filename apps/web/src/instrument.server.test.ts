import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

import { sentryMock } from './test/mocks/sentry/setup'

const runNode = promisify(execFile)
const webRoot = fileURLToPath(new URL('..', import.meta.url))
const instrumentation = fileURLToPath(new URL('../instrument.server.mjs', import.meta.url))

describe('Sentry - Server Instrumentation', () => {
  it('initializes before the application runs and captures failures logged by the streaming renderer', async () => {
    const { stdout } = await runNode(
      process.execPath,
      [
        '--import',
        instrumentation,
        '--input-type=module',
        '-e',
        `import * as Sentry from '@sentry/tanstackstart-react'
        const options = Sentry.getClient().getOptions()
        console.error('Error in renderToReadableStream:', new Error('SSR renderer failed'))
        await Sentry.flush(2000)
        console.log(JSON.stringify({ environment: options.environment, dataCollection: options.dataCollection }))`,
      ],
      {
        cwd: webRoot,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          SENTRY_DSN: sentryMock.dsn,
        },
        timeout: 10000,
      },
    )

    expect(JSON.parse(stdout)).toMatchObject({
      environment: 'production',
      dataCollection: { userInfo: false, cookies: false, httpBodies: [], urlQueryParams: false },
    })
    expect(sentryMock.events).toHaveLength(1)
    expect(sentryMock.events[0]).toMatchObject({
      exception: { values: [{ type: 'Error', value: 'SSR renderer failed' }] },
    })
  })

  it('leaves reporting disabled when neither server nor public DSN is configured', async () => {
    const { stdout } = await runNode(
      process.execPath,
      [
        '--import',
        instrumentation,
        '--input-type=module',
        '-e',
        `import * as Sentry from '@sentry/tanstackstart-react'
        console.log(JSON.stringify({ initialized: Boolean(Sentry.getClient()) }))`,
      ],
      {
        cwd: webRoot,
        env: { ...process.env, NODE_ENV: 'production', SENTRY_DSN: '', VITE_SENTRY_DSN: '' },
        timeout: 10000,
      },
    )

    expect(JSON.parse(stdout)).toEqual({ initialized: false })
    expect(sentryMock.events).toHaveLength(0)
  })
})
