import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const exampleMessage = pgTable('example_message', {
  id: text('id').primaryKey(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
