import type { ApplicationErrorOptions } from './ApplicationError'
import { ApplicationError } from './ApplicationError'

export class ConflictError extends ApplicationError {
  constructor(message = 'Conflict', options: ApplicationErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'CONFLICT',
      cause: options.cause,
    })
  }
}
