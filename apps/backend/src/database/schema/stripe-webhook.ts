import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const stripeWebhook = pgTable('stripe_webhook', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
})
