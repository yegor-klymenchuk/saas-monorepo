import { eq, sql } from 'drizzle-orm'

import { db } from '../database/database'
import { purchase } from '../database/schema/purchase'
import { stripeWebhook } from '../database/schema/stripe-webhook'
import { user } from '../database/schema/user'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type BillingDatabase = typeof db | Transaction

export interface BillingCustomer {
  userId: string
  stripeCustomerId: string
}

export class BillingRepository {
  #database: BillingDatabase

  constructor(database: BillingDatabase = db) {
    this.#database = database
  }

  async findCustomerByUserId(userId: string): Promise<BillingCustomer | null> {
    const [account] = await this.#database
      .select({ userId: user.id, stripeCustomerId: user.stripeCustomerId })
      .from(user)
      .where(eq(user.id, userId))

    return account?.stripeCustomerId ? { userId: account.userId, stripeCustomerId: account.stripeCustomerId } : null
  }

  async findCustomerByStripeId(stripeCustomerId: string): Promise<BillingCustomer | null> {
    const [account] = await this.#database
      .select({ userId: user.id })
      .from(user)
      .where(eq(user.stripeCustomerId, stripeCustomerId))

    return account ? { userId: account.userId, stripeCustomerId } : null
  }

  async saveCustomer(userId: string, stripeCustomerId: string): Promise<BillingCustomer> {
    // Preserve a customer already linked by a concurrent subscription checkout
    await this.#database
      .update(user)
      .set({ stripeCustomerId: sql`COALESCE(${user.stripeCustomerId}, ${stripeCustomerId})` })
      .where(eq(user.id, userId))

    const customer = await this.findCustomerByUserId(userId)

    if (!customer) {
      throw new Error('The database did not return the billing customer')
    }

    return customer
  }

  async savePurchase(input: typeof purchase.$inferInsert): Promise<void> {
    await this.#database.insert(purchase).values(input).onConflictDoNothing()
  }

  async processEvent(
    event: { id: string; type: string; customerId: string },
    handle: (repository: BillingRepository) => Promise<void>,
  ): Promise<void> {
    await this.#database.transaction(async (transaction) => {
      await transaction.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`stripe:${event.customerId}`}, 0))`)

      const [insertedEvent] = await transaction
        .insert(stripeWebhook)
        .values({ id: event.id, type: event.type })
        .onConflictDoNothing()
        .returning({ id: stripeWebhook.id })

      if (!insertedEvent) {
        return
      }

      // Roll back the marker with the purchase when processing fails, allowing Stripe to retry
      await handle(new BillingRepository(transaction))
    })
  }
}
