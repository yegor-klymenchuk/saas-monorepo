import type { ExampleService } from './example.service'
import { router } from '../../trpc/instance'
import { publicProcedure } from '../../trpc/procedures'
import { createExampleMessageInputSchema, exampleMessageSchema, getExampleMessageInputSchema } from './example.schema'

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
