import type { ApplicationErrorOptions } from './ApplicationError'
import { ApplicationError } from './ApplicationError'

export class ForbiddenError extends ApplicationError {
  constructor(message = 'Forbidden', options: ApplicationErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'FORBIDDEN',
      cause: options.cause,
    })
  }
}
