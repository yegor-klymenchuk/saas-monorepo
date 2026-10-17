import type { ExampleService } from '../services/ExampleService'

import { createExampleMessageInputSchema, exampleMessageSchema, getExampleMessageInputSchema } from '../schemas/example'
import { router } from '../trpc/instance'
import { publicProcedure } from '../trpc/procedures'

type ExampleServiceApi = Pick<ExampleService, 'createMessage' | 'getMessage'>

export function createExampleRouter(service: ExampleServiceApi) {
  return router({
    getMessage: publicProcedure
      .input(getExampleMessageInputSchema)
      .output(exampleMessageSchema)
      .query(({ input }) => service.getMessage(input.id)),

    createMessage: publicProcedure
      .input(createExampleMessageInputSchema)
      .output(exampleMessageSchema)
      .mutation(({ input }) => service.createMessage(input.message)),
  })
}
