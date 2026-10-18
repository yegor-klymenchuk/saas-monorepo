import type { StripePlan } from '@better-auth/stripe'

export interface BillingSubscriptionPlan extends Omit<StripePlan, 'priceId' | 'annualDiscountPriceId'> {
  lookupKey: string
}

export interface BillingConfig {
  subscriptions: BillingSubscriptionPlan[]
  products: { key: string; lookupKey: string }[]
  checkout: {
    successPath: `/${string}`
    cancelPath: `/${string}`
  }
}

export const billingConfig: BillingConfig = {
  subscriptions: [],
  products: [],
  checkout: {
    successPath: '/?checkout=success&session_id={CHECKOUT_SESSION_ID}',
    cancelPath: '/?checkout=canceled',
  },
}
