import { Server } from './server'
import { logger } from './lib/logger'

async function main() {
  try {
    const server = new Server()

    server.start()
  } catch (error) {
    logger.error('Failed to start application:', error)
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
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('\nShutting down gracefully...')
  process.exit(0)
})

main()
