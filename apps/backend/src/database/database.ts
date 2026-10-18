import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { env } from '../env'
import { account } from './schema/account'
import { purchase } from './schema/purchase'
import { session } from './schema/session'
import { stripeWebhook } from './schema/stripe-webhook'
import { subscription } from './schema/subscription'
import { user } from './schema/user'
import { verification } from './schema/verification'

const pool = new Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
})

export const db = drizzle({
  client: pool,
  schema: {
    account,
    purchase,
    session,
    stripeWebhook,
    subscription,
    user,
    verification,
  },
})
