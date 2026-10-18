import type { StripeOptions, StripePlugin, SubscriptionOptions } from '@better-auth/stripe'

import { stripe } from '@better-auth/stripe'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import { billingConfig } from '../config/billing'
import { db } from '../database/database'
import { env } from '../env'
import { BillingService } from '../services/BillingService'
import { getStripe } from './stripe'

const billingService = new BillingService()

interface BillingStripeOptions extends StripeOptions {
  subscription: SubscriptionOptions & { enabled: true }
}

const stripePlugin: StripePlugin<BillingStripeOptions> = stripe({
  stripeClient: getStripe(),
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
  createCustomerOnSignUp: false,
  subscription: {
    enabled: true,
    plans: () => billingConfig.subscriptions,
    authorizeReference: async ({ user, referenceId }) => referenceId === user.id,
    getCheckoutSessionParams: async ({ user, plan }, _request, context) => {
      const lookupKey = context.body.annual ? plan.annualDiscountLookupKey : plan.lookupKey
      const prices = lookupKey
        ? await getStripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })
        : null
      const price = prices?.data[0]

      if (!price || price.lookup_key !== lookupKey || !price.active || price.type !== 'recurring') {
        throw new Error('The subscription price is not configured')
      }

      const metadata = { userId: user.id, priceId: price.id }

      return {
        params: {
          metadata,
          subscription_data: { metadata },
        },
      }
    },
  },
  onEvent: (event) => billingService.handleWebhook(event),
})

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CORS_ORIGIN],
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [stripePlugin],
})
