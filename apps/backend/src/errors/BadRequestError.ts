import type { ApplicationErrorOptions } from './ApplicationError'
import { ApplicationError } from './ApplicationError'

export class BadRequestError extends ApplicationError {
  constructor(message = 'Bad request', options: ApplicationErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'BAD_REQUEST',
      cause: options.cause,
    })
  }
}
