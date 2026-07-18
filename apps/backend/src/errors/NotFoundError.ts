import type { ApplicationErrorOptions } from './ApplicationError'
import { ApplicationError } from './ApplicationError'

export type NotFoundErrorOptions = ApplicationErrorOptions & {
  identifier?: string
}

export class NotFoundError extends ApplicationError {
  readonly entity: string
  readonly identifier?: string

  constructor(entity: string, options: NotFoundErrorOptions = {}) {
    const subject = options.identifier ? `${entity} ${options.identifier}` : entity

    super(`${subject} was not found`, {
      code: options.code ?? 'NOT_FOUND',
      cause: options.cause,
    })

    this.entity = entity
    this.identifier = options.identifier
  }
}
