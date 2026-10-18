import { relations, sql } from 'drizzle-orm'
import { bigint, check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { subscription } from './subscription'
import { user } from './user'

export interface PurchaseItem {
  priceId: string | null
  productId: string | null
  description: string | null
  quantity: number
  amount: number
  currency: string
}

export const purchase = pgTable(
  'purchase',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
    stripeInvoiceId: text('stripe_invoice_id').unique(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: text('currency').notNull(),
    items: jsonb('items').$type<PurchaseItem[]>().notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('purchase_user_id_idx').on(table.userId),
    index('purchase_stripe_subscription_id_idx').on(table.stripeSubscriptionId),
    check('purchase_amount_nonnegative', sql`${table.amount} >= 0`),
    check(
      'purchase_stripe_source_required',
      sql`${table.stripeCheckoutSessionId} IS NOT NULL OR ${table.stripeInvoiceId} IS NOT NULL`,
    ),
  ],
)

export const purchaseRelations = relations(purchase, ({ one }) => ({
  user: one(user, { fields: [purchase.userId], references: [user.id] }),
  subscription: one(subscription, {
    fields: [purchase.stripeSubscriptionId],
    references: [subscription.stripeSubscriptionId],
  }),
}))

export type Purchase = typeof purchase.$inferSelect
