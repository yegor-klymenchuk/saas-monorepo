import express, { Application } from 'express'
import cors from 'cors'
import { logger } from './utils/logger'
import { NodeErrorCode } from './utils/error-codes'
import { toNodeHandler } from 'better-auth/node'
import { env } from './env'
import { auth } from './utils/auth'
import { sessionModule } from './modules/session/session.router'
import { createExpressEndpoints } from '@ts-rest/express'

export class Server {
  app: Application
  port: number

  constructor(port: number = env.SERVER_PORT) {
    this.port = port
    this.app = express()
    this.#setupMiddleware()
    this.#setupRoutes()
  }

  #setupMiddleware(): void {
    this.app.use(
      cors({
        origin: env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      }),
    )

    this.app.all('/api/auth/*', toNodeHandler(auth))

    this.app.use(express.text({ type: 'text/plain' }))
    this.app.use(express.json())
  }

  #setupRoutes(): void {
    ;[sessionModule].forEach(({ contract, router }) => {
      createExpressEndpoints(contract, router, this.app)
    })
  }

  start(): void {
    this.app
      .listen(this.port, () => {
        logger.info(`Server running on ${env.SERVER_HOST}`)
      })
      .on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === NodeErrorCode.EADDRINUSE) {
          logger.error(`Port ${this.port} is already in use for server`)
        } else {
          logger.error('Server error:', error)
        }
      })
  }
}
