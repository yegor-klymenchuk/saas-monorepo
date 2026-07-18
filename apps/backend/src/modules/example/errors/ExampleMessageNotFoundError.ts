import { NotFoundError } from '../../../errors/NotFoundError'

export class ExampleMessageNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Example message', {
      code: 'EXAMPLE_MESSAGE_NOT_FOUND',
      identifier: id,
    })
  }
}
