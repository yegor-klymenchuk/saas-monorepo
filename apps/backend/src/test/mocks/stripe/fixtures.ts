import type Stripe from 'stripe'

import { randomUUID } from 'node:crypto'

import { env } from '../../../env'
import { getStripe } from '../../../lib/stripe'

export const stripeFixtures = {
  response<T>(value: T): Stripe.Response<T> {
    return Object.assign(value as T & object, {
      lastResponse: { headers: {}, requestId: 'req_mock', statusCode: 200 },
    })
  },

  list<T>(items: T[]): Stripe.ApiListPromise<T> {
    const response = stripeFixtures.response({ object: 'list' as const, data: items, has_more: false, url: '/v1/mock' })

    return Object.assign(Promise.resolve(response), {
      autoPagingToArray: async () => items,
    }) as unknown as Stripe.ApiListPromise<T>
  },

  price(overrides: Partial<Stripe.Price> = {}): Stripe.Response<Stripe.Price> {
    return stripeFixtures.response({
      id: 'price_payment',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: 1792281600,
      currency: 'usd',
      custom_unit_amount: null,
      livemode: false,
      lookup_key: 'credits_small',
      metadata: {},
      nickname: null,
      product: 'prod_generic',
      recurring: null,
      tax_behavior: 'unspecified',
      tiers_mode: null,
      transform_quantity: null,
      type: 'one_time',
      unit_amount: 2000,
      unit_amount_decimal: '2000',
      ...overrides,
    } as Stripe.Price)
  },

  customer(overrides: Partial<Stripe.Customer> = {}): Stripe.Response<Stripe.Customer> {
    return stripeFixtures.response({
      id: 'cus_generic',
      object: 'customer',
      email: 'billing@example.test',
      name: 'Test Customer',
      metadata: {},
      livemode: false,
      created: 1792281600,
      ...overrides,
    } as Stripe.Customer)
  },

  customerSearch(customers: Stripe.Customer[] = []): Stripe.Response<Stripe.ApiSearchResult<Stripe.Customer>> {
    return stripeFixtures.response({
      object: 'search_result',
      data: customers,
      has_more: false,
      next_page: null,
      url: '/v1/customers/search',
    })
  },

  portal(overrides: Partial<Stripe.BillingPortal.Session> = {}): Stripe.Response<Stripe.BillingPortal.Session> {
    return stripeFixtures.response({
      id: 'bps_generic',
      object: 'billing_portal.session',
      url: 'https://billing.stripe.com/p/session/mock',
      ...overrides,
    } as Stripe.BillingPortal.Session)
  },

  signature(payload: string, timestamp?: number): string {
    return getStripe().webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET,
      timestamp,
    })
  },

  checkout(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Response<Stripe.Checkout.Session> {
    return stripeFixtures.response({
      id: 'cs_test_generic',
      object: 'checkout.session',
      mode: 'payment',
      customer: 'cus_generic',
      payment_intent: 'pi_generic',
      subscription: null,
      invoice: null,
      metadata: {},
      client_reference_id: null,
      currency: 'usd',
      amount_total: 2000,
      payment_status: 'paid',
      status: 'complete',
      url: 'https://checkout.stripe.com/c/pay/mock',
      created: 1792281600,
      livemode: false,
      ...overrides,
    } as Stripe.Checkout.Session)
  },

  lineItem(overrides: Partial<Stripe.LineItem> = {}): Stripe.LineItem {
    return {
      id: 'li_generic',
      object: 'item',
      amount_discount: 0,
      amount_subtotal: 2000,
      amount_tax: 0,
      amount_total: 2000,
      currency: 'usd',
      description: 'Generic product',
      price: stripeFixtures.price(),
      quantity: 1,
      ...overrides,
    } as Stripe.LineItem
  },

  subscriptionItem(overrides: Partial<Stripe.SubscriptionItem> = {}): Stripe.SubscriptionItem {
    return {
      id: 'si_generic',
      object: 'subscription_item',
      subscription: 'sub_generic',
      current_period_start: 1792281600,
      current_period_end: 1794960000,
      price: stripeFixtures.price({
        id: 'price_subscription',
        lookup_key: 'subscription_monthly',
        type: 'recurring',
        recurring: {
          interval: 'month',
          interval_count: 1,
          usage_type: 'licensed',
          meter: null,
          trial_period_days: null,
        },
      }),
      quantity: 1,
      ...overrides,
    } as Stripe.SubscriptionItem
  },

  subscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Response<Stripe.Subscription> {
    return stripeFixtures.response({
      id: 'sub_generic',
      object: 'subscription',
      customer: 'cus_generic',
      status: 'active',
      items: {
        object: 'list',
        data: [stripeFixtures.subscriptionItem()],
        has_more: false,
        url: '/v1/subscription_items',
      },
      cancel_at_period_end: false,
      cancel_at: null,
      canceled_at: null,
      ended_at: null,
      trial_start: null,
      trial_end: null,
      metadata: {},
      ...overrides,
    } as Stripe.Subscription)
  },

  invoice(overrides: Partial<Stripe.Invoice> = {}): Stripe.Response<Stripe.Invoice> {
    return stripeFixtures.response({
      id: 'in_generic',
      object: 'invoice',
      customer: 'cus_generic',
      parent: {
        type: 'subscription_details',
        subscription_details: { subscription: 'sub_generic', metadata: {}, subscription_proration_date: null },
        quote_details: null,
      },
      status: 'paid',
      amount_paid: 2000,
      currency: 'usd',
      status_transitions: {
        paid_at: 1792281600,
        finalized_at: 1792281600,
        marked_uncollectible_at: null,
        voided_at: null,
      },
      created: 1792281600,
      metadata: {},
      ...overrides,
    } as Stripe.Invoice)
  },

  invoiceLineItem(overrides: Partial<Stripe.InvoiceLineItem> = {}): Stripe.InvoiceLineItem {
    return {
      id: 'il_generic',
      object: 'line_item',
      amount: 2000,
      currency: 'usd',
      description: 'Generic subscription',
      pricing: {
        type: 'price_details',
        price_details: { price: 'price_subscription', product: 'prod_generic' },
        unit_amount_decimal: '2000',
      },
      quantity: 1,
      ...overrides,
    } as Stripe.InvoiceLineItem
  },

  event(
    type: Stripe.Event.Type,
    object: { id: string },
    overrides: { id?: string; created?: number } = {},
  ): Stripe.Event {
    return {
      id: `evt_${randomUUID()}`,
      object: 'event',
      type,
      api_version: '2026-08-26.dahlia',
      created: 1792281600,
      data: { object },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      ...overrides,
    } as Stripe.Event
  },
}
