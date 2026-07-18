import type { ApplicationErrorOptions } from './ApplicationError'
import { ApplicationError } from './ApplicationError'

export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized', options: ApplicationErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'UNAUTHORIZED',
      cause: options.cause,
    })
  }
}
