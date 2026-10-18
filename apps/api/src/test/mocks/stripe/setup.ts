import type Stripe from 'stripe'

import { beforeEach, type Mock, vi } from 'vitest'

import { getStripe } from '../../../lib/stripe'

interface StripeMocks {
  createCustomer: Mock<Stripe['customers']['create']>
  searchCustomers: Mock<Stripe['customers']['search']>
  listCustomers: Mock<Stripe['customers']['list']>
  retrievePrice: Mock<Stripe['prices']['retrieve']>
  listPrices: Mock<Stripe['prices']['list']>
  createCheckout: Mock<Stripe['checkout']['sessions']['create']>
  retrieveCheckout: Mock<Stripe['checkout']['sessions']['retrieve']>
  listCheckoutItems: Mock<Stripe['checkout']['sessions']['listLineItems']>
  createPortal: Mock<Stripe['billingPortal']['sessions']['create']>
  retrieveSubscription: Mock<Stripe['subscriptions']['retrieve']>
  listSubscriptions: Mock<Stripe['subscriptions']['list']>
  listSubscriptionItems: Mock<Stripe['subscriptionItems']['list']>
  retrieveInvoice: Mock<Stripe['invoices']['retrieve']>
  listInvoiceItems: Mock<Stripe['invoices']['listLineItems']>
}

const stripe = getStripe()

export const stripeMocks: StripeMocks = {
  createCustomer: vi.spyOn(stripe.customers, 'create'),
  searchCustomers: vi.spyOn(stripe.customers, 'search'),
  listCustomers: vi.spyOn(stripe.customers, 'list'),
  retrievePrice: vi.spyOn(stripe.prices, 'retrieve'),
  listPrices: vi.spyOn(stripe.prices, 'list'),
  createCheckout: vi.spyOn(stripe.checkout.sessions, 'create'),
  retrieveCheckout: vi.spyOn(stripe.checkout.sessions, 'retrieve'),
  listCheckoutItems: vi.spyOn(stripe.checkout.sessions, 'listLineItems'),
  createPortal: vi.spyOn(stripe.billingPortal.sessions, 'create'),
  retrieveSubscription: vi.spyOn(stripe.subscriptions, 'retrieve'),
  listSubscriptions: vi.spyOn(stripe.subscriptions, 'list'),
  listSubscriptionItems: vi.spyOn(stripe.subscriptionItems, 'list'),
  retrieveInvoice: vi.spyOn(stripe.invoices, 'retrieve'),
  listInvoiceItems: vi.spyOn(stripe.invoices, 'listLineItems'),
}

beforeEach(() => {
  for (const mock of Object.values(stripeMocks)) {
    mock.mockReset()
    mock.mockImplementation(() => {
      throw new Error('Unexpected Stripe API call')
    })
  }
})
