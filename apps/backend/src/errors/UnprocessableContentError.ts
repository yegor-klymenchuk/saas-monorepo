import type { ApplicationErrorOptions } from './ApplicationError'
import { ApplicationError } from './ApplicationError'

export class UnprocessableContentError extends ApplicationError {
  constructor(message = 'Unprocessable content', options: ApplicationErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'UNPROCESSABLE_CONTENT',
      cause: options.cause,
    })
  }
}
