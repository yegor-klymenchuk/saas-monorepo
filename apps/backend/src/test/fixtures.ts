import { randomUUID } from 'node:crypto'

import { db } from '../database/database'
import { account } from '../database/schema/account'
import { purchase } from '../database/schema/purchase'
import { session } from '../database/schema/session'
import { stripeWebhook } from '../database/schema/stripe-webhook'
import { subscription } from '../database/schema/subscription'
import { user } from '../database/schema/user'
import { verification } from '../database/schema/verification'

export const fixtures = {
  async user(overrides: Partial<typeof user.$inferInsert> = {}): Promise<typeof user.$inferSelect> {
    const id = randomUUID()
    const [createdUser] = await db
      .insert(user)
      .values({
        id,
        email: `${id}@example.test`,
        name: 'Test User',
        emailVerified: true,
        ...overrides,
      })
      .returning()

    if (!createdUser) {
      throw new Error('User fixture was not created')
    }

    return createdUser
  },

  async account(overrides: Partial<typeof account.$inferInsert> = {}): Promise<typeof account.$inferSelect> {
    const userId = overrides.userId ?? (await fixtures.user()).id
    const [createdAccount] = await db
      .insert(account)
      .values({
        id: randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        updatedAt: new Date(),
        ...overrides,
      })
      .returning()

    if (!createdAccount) {
      throw new Error('Account fixture was not created')
    }

    return createdAccount
  },

  async session(overrides: Partial<typeof session.$inferInsert> = {}): Promise<typeof session.$inferSelect> {
    const userId = overrides.userId ?? (await fixtures.user()).id
    const [createdSession] = await db
      .insert(session)
      .values({
        id: randomUUID(),
        token: randomUUID(),
        userId,
        expiresAt: new Date(Date.now() + 86400000),
        updatedAt: new Date(),
        ...overrides,
      })
      .returning()

    if (!createdSession) {
      throw new Error('Session fixture was not created')
    }

    return createdSession
  },

  async verification(
    overrides: Partial<typeof verification.$inferInsert> = {},
  ): Promise<typeof verification.$inferSelect> {
    const id = randomUUID()
    const [createdVerification] = await db
      .insert(verification)
      .values({
        id,
        identifier: `${id}@example.test`,
        value: randomUUID(),
        expiresAt: new Date(Date.now() + 86400000),
        ...overrides,
      })
      .returning()

    if (!createdVerification) {
      throw new Error('Verification fixture was not created')
    }

    return createdVerification
  },

  async subscription(
    overrides: Partial<typeof subscription.$inferInsert> = {},
  ): Promise<typeof subscription.$inferSelect> {
    const referenceId = overrides.referenceId ?? (await fixtures.user()).id
    const [createdSubscription] = await db
      .insert(subscription)
      .values({
        id: randomUUID(),
        referenceId,
        plan: 'standard',
        status: 'incomplete',
        ...overrides,
      })
      .returning()

    if (!createdSubscription) {
      throw new Error('Subscription fixture was not created')
    }

    return createdSubscription
  },

  async purchase(overrides: Partial<typeof purchase.$inferInsert> = {}): Promise<typeof purchase.$inferSelect> {
    const id = randomUUID()
    const [createdPurchase] = await db
      .insert(purchase)
      .values({
        id,
        stripeCustomerId: `cus_${id}`,
        stripeCheckoutSessionId: `cs_test_${id}`,
        stripePaymentIntentId: `pi_${id}`,
        amount: 2000,
        currency: 'usd',
        items: [],
        paidAt: new Date(),
        ...overrides,
      })
      .returning()

    if (!createdPurchase) {
      throw new Error('Purchase fixture was not created')
    }

    return createdPurchase
  },

  async stripeWebhook(
    overrides: Partial<typeof stripeWebhook.$inferInsert> = {},
  ): Promise<typeof stripeWebhook.$inferSelect> {
    const [createdWebhook] = await db
      .insert(stripeWebhook)
      .values({
        id: `evt_${randomUUID()}`,
        type: 'checkout.session.completed',
        ...overrides,
      })
      .returning()

    if (!createdWebhook) {
      throw new Error('Stripe webhook fixture was not created')
    }

    return createdWebhook
  },
}
