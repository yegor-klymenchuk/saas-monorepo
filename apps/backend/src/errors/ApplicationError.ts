export type ApplicationErrorOptions = ErrorOptions & {
  code?: string
}

export class ApplicationError extends Error {
  readonly code: string

  constructor(message: string, options: ApplicationErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.name = new.target.name
    this.code = options.code ?? 'APPLICATION_ERROR'
  }
}
