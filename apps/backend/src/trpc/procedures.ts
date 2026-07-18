import { procedure } from './instance'
import { errorMiddleware } from './middlewares/error.middleware'
import { authenticationMiddleware } from './middlewares/authentication.middleware'

export const publicProcedure = procedure.use(errorMiddleware)
export const protectedProcedure = publicProcedure.use(authenticationMiddleware)
