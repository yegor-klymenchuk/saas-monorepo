import { procedure } from './instance'
import { authenticationMiddleware } from './middlewares/authentication.middleware'
import { errorMiddleware } from './middlewares/error.middleware'

export const publicProcedure = procedure.use(errorMiddleware)
export const protectedProcedure = publicProcedure.use(authenticationMiddleware)
