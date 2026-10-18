import './instrument'

import * as Sentry from '@sentry/node'

import { logger } from './lib/logger'
import { Server } from './server'

async function main(): Promise<void> {
  try {
    const server = new Server()

    server.start()
  } catch (error) {
    Sentry.captureException(error)
    logger.error('Failed to start application:', error)
    await Sentry.flush(2000)
    process.exit(1)
  }
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('SIGINT', async () => {
  logger.info('\nShutting down gracefully...')
  await Sentry.close(2000)
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('\nShutting down gracefully...')
  await Sentry.close(2000)
  process.exit(0)
})

void main()
