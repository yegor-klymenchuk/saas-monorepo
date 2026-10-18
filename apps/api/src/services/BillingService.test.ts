import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { billingConfig } from '../config/billing'
import { db } from '../database/database'
import { purchase } from '../database/schema/purchase'
import { stripeWebhook } from '../database/schema/stripe-webhook'
import { user } from '../database/schema/user'
import { env } from '../env'
import { fixtures } from '../test/fixtures'
import { stripeFixtures } from '../test/mocks/stripe/fixtures'
import { stripeMocks } from '../test/mocks/stripe/setup'
import { BillingService } from './BillingService'

describe('BillingService - Checkout and Webhook Processing', () => {
  const service = new BillingService()

  describe('Payment Checkout - Validation and Customer Reuse', () => {
    const originalProducts = billingConfig.products
    const originalCheckout = billingConfig.checkout

    beforeEach(() => {
      billingConfig.products = [{ key: 'credits-small', lookupKey: 'credits_small' }]
      billingConfig.checkout = { ...originalCheckout }
    })

    afterEach(() => {
      billingConfig.products = originalProducts
      billingConfig.checkout = originalCheckout
    })

    it('rejects a product outside the configured catalog before calling Stripe', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })

      await expect(
        service.createPaymentCheckout(account, { productKey: 'unknown-product', requestId: randomUUID() }),
      ).rejects.toMatchObject({ name: 'BadRequestError', code: 'BILLING_PRODUCT_NOT_ALLOWED' })
      expect(stripeMocks.listPrices).not.toHaveBeenCalled()
      expect(stripeMocks.createCustomer).not.toHaveBeenCalled()
      expect(stripeMocks.createCheckout).not.toHaveBeenCalled()
    })

    it('rejects an active one-time price whose lookup key does not match the product', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })

      stripeMocks.listPrices.mockReturnValue(
        stripeFixtures.list([stripeFixtures.price({ active: true, type: 'one_time', lookup_key: 'another_product' })]),
      )

      await expect(
        service.createPaymentCheckout(account, { productKey: 'credits-small', requestId: randomUUID() }),
      ).rejects.toMatchObject({ name: 'BadRequestError', code: 'BILLING_PRICE_INVALID' })
      expect(stripeMocks.createCustomer).not.toHaveBeenCalled()
      expect(stripeMocks.createCheckout).not.toHaveBeenCalled()
      expect(await db.select({ stripeCustomerId: user.stripeCustomerId }).from(user)).toEqual([
        { stripeCustomerId: null },
      ])
    })

    it('uses an existing customer and returns the provider checkout without recording a purchase', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_existing' })
      const input = { productKey: 'credits-small', requestId: randomUUID() }

      stripeMocks.listPrices.mockReturnValue(
        stripeFixtures.list([stripeFixtures.price({ id: 'price_credits', lookup_key: 'credits_small' })]),
      )
      stripeMocks.createCheckout.mockResolvedValue(
        stripeFixtures.checkout({
          id: 'cs_existing',
          customer: 'cus_existing',
          url: 'https://checkout.stripe.com/existing',
        }),
      )

      await expect(service.createPaymentCheckout(account, input)).resolves.toEqual({
        id: 'cs_existing',
        url: 'https://checkout.stripe.com/existing',
      })
      expect(stripeMocks.createCustomer).not.toHaveBeenCalled()
      expect(stripeMocks.createCheckout).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          mode: 'payment',
          customer: 'cus_existing',
          client_reference_id: account.id,
          line_items: [{ price: 'price_credits', quantity: 1 }],
          metadata: { userId: account.id, priceId: 'price_credits' },
          payment_intent_data: { metadata: { userId: account.id, priceId: 'price_credits' } },
        }),
        { idempotencyKey: `checkout:${account.id}:payment:${input.requestId}` },
      )
      expect(await db.select().from(purchase)).toHaveLength(0)
    })

    it('leaves the user unlinked when customer creation fails', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })
      const failure = new Error('Customer creation unavailable')

      stripeMocks.listPrices.mockReturnValue(stripeFixtures.list([stripeFixtures.price()]))
      stripeMocks.createCustomer.mockRejectedValue(failure)

      await expect(
        service.createPaymentCheckout(account, { productKey: 'credits-small', requestId: randomUUID() }),
      ).rejects.toBe(failure)
      expect(stripeMocks.createCheckout).not.toHaveBeenCalled()
      expect(await db.select({ stripeCustomerId: user.stripeCustomerId }).from(user)).toEqual([
        { stripeCustomerId: null },
      ])
      expect(await db.select().from(purchase)).toHaveLength(0)
    })

    it('reuses the saved customer and request key after checkout creation fails', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })
      const input = { productKey: 'credits-small', requestId: randomUUID() }
      const failure = new Error('Checkout temporarily unavailable')

      stripeMocks.listPrices.mockReturnValue(stripeFixtures.list([stripeFixtures.price()]))
      stripeMocks.createCustomer.mockResolvedValue(stripeFixtures.customer({ id: 'cus_retry' }))
      stripeMocks.createCheckout
        .mockRejectedValueOnce(failure)
        .mockResolvedValue(stripeFixtures.checkout({ customer: 'cus_retry' }))

      await expect(service.createPaymentCheckout(account, input)).rejects.toBe(failure)
      expect(await db.select({ stripeCustomerId: user.stripeCustomerId }).from(user)).toEqual([
        { stripeCustomerId: 'cus_retry' },
      ])
      expect(await db.select().from(purchase)).toHaveLength(0)

      await expect(service.createPaymentCheckout(account, input)).resolves.toEqual({
        id: 'cs_test_generic',
        url: 'https://checkout.stripe.com/c/pay/mock',
      })
      expect(stripeMocks.createCustomer).toHaveBeenCalledTimes(1)
      expect(stripeMocks.createCheckout).toHaveBeenCalledTimes(2)
      expect(stripeMocks.createCheckout.mock.calls[1]).toEqual(stripeMocks.createCheckout.mock.calls[0])
    })

    it('rejects a provider session without a checkout URL', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_existing' })

      stripeMocks.listPrices.mockReturnValue(stripeFixtures.list([stripeFixtures.price()]))
      stripeMocks.createCheckout.mockResolvedValue(stripeFixtures.checkout({ customer: 'cus_existing', url: null }))

      await expect(
        service.createPaymentCheckout(account, { productKey: 'credits-small', requestId: randomUUID() }),
      ).rejects.toThrow('Stripe did not return a checkout URL')
      expect(await db.select().from(purchase)).toHaveLength(0)
    })

    it('creates a payment checkout with user metadata and reuses its customer and retry key', async () => {
      const account = await fixtures.user({ email: 'owner@example.test' })
      const input = { productKey: 'credits-small', requestId: randomUUID() }

      stripeMocks.listPrices.mockReturnValue(
        stripeFixtures.list([stripeFixtures.price({ id: 'price_payment', active: true, type: 'one_time' })]),
      )
      stripeMocks.createCustomer.mockResolvedValue(stripeFixtures.customer({ id: 'cus_owner' }))
      stripeMocks.createCheckout.mockResolvedValue(stripeFixtures.checkout({ customer: 'cus_owner' }))

      const result = await service.createPaymentCheckout(account, input)
      const retried = await service.createPaymentCheckout(account, input)

      expect(result).toEqual({ id: 'cs_test_generic', url: 'https://checkout.stripe.com/c/pay/mock' })
      expect(retried).toEqual(result)
      expect(stripeMocks.createCustomer).toHaveBeenCalledExactlyOnceWith(
        { email: 'owner@example.test', name: account.name, metadata: { userId: account.id } },
        { idempotencyKey: `billing-customer:${account.id}` },
      )
      expect(stripeMocks.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer: 'cus_owner',
          client_reference_id: account.id,
          line_items: [{ price: 'price_payment', quantity: 1 }],
          metadata: { userId: account.id, priceId: 'price_payment' },
          payment_intent_data: { metadata: { userId: account.id, priceId: 'price_payment' } },
          success_url: `${env.CORS_ORIGIN}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${env.CORS_ORIGIN}/?checkout=canceled`,
        }),
        { idempotencyKey: `checkout:${account.id}:payment:${input.requestId}` },
      )
      expect(stripeMocks.createCheckout.mock.calls[1]).toEqual(stripeMocks.createCheckout.mock.calls[0])
      expect(stripeMocks.createCheckout.mock.calls[0]?.[0]).not.toHaveProperty('payment_method_types')
      expect(stripeMocks.listPrices).toHaveBeenCalledWith({ lookup_keys: ['credits_small'], active: true, limit: 1 })
      expect(await db.select({ userId: user.id, stripeCustomerId: user.stripeCustomerId }).from(user)).toMatchObject([
        { userId: account.id, stripeCustomerId: 'cus_owner' },
      ])
    })

    it('rejects a recurring price on payment checkout', async () => {
      const account = await fixtures.user()

      stripeMocks.listPrices.mockReturnValue(
        stripeFixtures.list([stripeFixtures.price({ id: 'price_payment', type: 'recurring', active: true })]),
      )

      await expect(
        service.createPaymentCheckout(account, { productKey: 'credits-small', requestId: randomUUID() }),
      ).rejects.toMatchObject({ name: 'BadRequestError', code: 'BILLING_PRICE_INVALID' })
      expect(stripeMocks.createCheckout).not.toHaveBeenCalled()
    })

    it('rejects inactive prices before creating a customer', async () => {
      const account = await fixtures.user()

      stripeMocks.listPrices.mockReturnValue(
        stripeFixtures.list([stripeFixtures.price({ active: false, type: 'one_time' })]),
      )

      await expect(
        service.createPaymentCheckout(account, { productKey: 'credits-small', requestId: randomUUID() }),
      ).rejects.toMatchObject({ name: 'BadRequestError', code: 'BILLING_PRICE_INVALID' })
      expect(stripeMocks.createCustomer).not.toHaveBeenCalled()
    })

    it('rejects a configured product when its lookup key has no active price', async () => {
      const account = await fixtures.user()

      stripeMocks.listPrices.mockReturnValue(stripeFixtures.list([]))

      await expect(
        service.createPaymentCheckout(account, { productKey: 'credits-small', requestId: randomUUID() }),
      ).rejects.toMatchObject({ name: 'BadRequestError', code: 'BILLING_PRICE_INVALID' })
      expect(stripeMocks.createCustomer).not.toHaveBeenCalled()
      expect(stripeMocks.createCheckout).not.toHaveBeenCalled()
    })

    it('uses the resolved environment price and configured return paths', async () => {
      const account = await fixtures.user()

      billingConfig.checkout.successPath = '/account?checkout=success&session_id={CHECKOUT_SESSION_ID}'
      billingConfig.checkout.cancelPath = '/account?checkout=canceled'
      stripeMocks.listPrices.mockReturnValue(
        stripeFixtures.list([
          stripeFixtures.price({ id: 'price_sandbox_credits', lookup_key: 'credits_small', type: 'one_time' }),
        ]),
      )
      stripeMocks.createCustomer.mockResolvedValue(stripeFixtures.customer())
      stripeMocks.createCheckout.mockResolvedValue(stripeFixtures.checkout())

      await service.createPaymentCheckout(account, { productKey: 'credits-small', requestId: randomUUID() })

      expect(stripeMocks.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_sandbox_credits', quantity: 1 }],
          metadata: { userId: account.id, priceId: 'price_sandbox_credits' },
          payment_intent_data: { metadata: { userId: account.id, priceId: 'price_sandbox_credits' } },
          success_url: `${env.CORS_ORIGIN}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${env.CORS_ORIGIN}/account?checkout=canceled`,
        }),
        expect.any(Object),
      )
    })
  })

  describe('Webhook Dispatch - Event Filtering', () => {
    it('ignores unsupported events even when their customer belongs to this application', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_generic' })

      await service.handleWebhook(stripeFixtures.event('customer.created', stripeFixtures.customer()))

      expect(stripeMocks.retrieveCheckout).not.toHaveBeenCalled()
      expect(stripeMocks.retrieveInvoice).not.toHaveBeenCalled()
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)
    })

    it('ignores setup checkouts without fetching payment details or recording a purchase', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_setup' })

      const checkout = stripeFixtures.checkout({ customer: 'cus_setup', mode: 'setup', payment_intent: null })

      await service.handleWebhook(stripeFixtures.event('checkout.session.completed', checkout))

      expect(stripeMocks.retrieveCheckout).not.toHaveBeenCalled()
      expect(stripeMocks.retrieveInvoice).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)
    })

    it('ignores an unlinked Stripe customer even when metadata claims an existing user', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })
      const checkout = stripeFixtures.checkout({ customer: 'cus_unmapped', metadata: { userId: account.id } })

      await service.handleWebhook(stripeFixtures.event('checkout.session.completed', checkout))

      expect(stripeMocks.retrieveCheckout).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)
    })

    it('leaves subscription checkout processing to the auth plugin', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_subscription' })

      const checkout = stripeFixtures.checkout({ customer: 'cus_subscription', mode: 'subscription' })

      await service.handleWebhook(stripeFixtures.event('checkout.session.completed', checkout))

      expect(stripeMocks.retrieveCheckout).not.toHaveBeenCalled()
      expect(stripeMocks.retrieveInvoice).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)
    })

    it('ignores a payment event without a customer', async () => {
      const checkout = stripeFixtures.checkout({ mode: 'payment', customer: null })

      await service.handleWebhook(stripeFixtures.event('checkout.session.completed', checkout))

      expect(stripeMocks.retrieveCheckout).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)
    })
  })

  describe('Checkout Events - Payment State and Ownership', () => {
    it('waits for asynchronous payment success and uses customer ownership instead of metadata', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_generic' })
      const other = await fixtures.user()
      const unpaid = stripeFixtures.checkout({
        customer: 'cus_generic',
        status: 'complete',
        payment_status: 'unpaid',
        metadata: { userId: other.id, priceId: 'price_payment' },
      })

      stripeMocks.retrieveCheckout.mockResolvedValue(unpaid)

      await service.handleWebhook(stripeFixtures.event('checkout.session.completed', unpaid))

      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(stripeMocks.listCheckoutItems).not.toHaveBeenCalled()

      const paid = stripeFixtures.checkout({
        customer: 'cus_generic',
        payment_status: 'paid',
        metadata: unpaid.metadata,
      })

      stripeMocks.retrieveCheckout.mockResolvedValue(paid)
      stripeMocks.listCheckoutItems.mockReturnValue(stripeFixtures.list([stripeFixtures.lineItem()]))

      await service.handleWebhook(stripeFixtures.event('checkout.session.async_payment_succeeded', paid))

      expect(await db.select().from(purchase)).toMatchObject([{ userId: account.id, amount: 2000 }])
    })

    it('records a zero-cost checkout without a PaymentIntent', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_generic' })
      const checkout = stripeFixtures.checkout({
        amount_total: 0,
        payment_status: 'no_payment_required',
        payment_intent: null,
      })

      stripeMocks.retrieveCheckout.mockResolvedValue(checkout)
      stripeMocks.listCheckoutItems.mockReturnValue(stripeFixtures.list([stripeFixtures.lineItem({ amount_total: 0 })]))

      await service.handleWebhook(stripeFixtures.event('checkout.session.completed', checkout))

      expect(await db.select().from(purchase)).toMatchObject([
        { userId: account.id, amount: 0, stripePaymentIntentId: null },
      ])
    })

    it('allows checkout processing to be retried after a provider failure', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_generic' })
      const checkout = stripeFixtures.checkout()
      const event = stripeFixtures.event('checkout.session.completed', checkout)
      const failure = new Error('Provider temporarily unavailable')

      stripeMocks.retrieveCheckout.mockRejectedValueOnce(failure).mockResolvedValue(checkout)
      stripeMocks.listCheckoutItems.mockReturnValue(stripeFixtures.list([stripeFixtures.lineItem()]))

      await expect(service.handleWebhook(event)).rejects.toBe(failure)
      expect(await db.select().from(purchase)).toHaveLength(0)

      await service.handleWebhook(event)

      expect(await db.select().from(purchase)).toMatchObject([
        { userId: account.id, stripeCheckoutSessionId: checkout.id },
      ])
    })

    it('uses the latest session state and skips a checkout that is still open', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_generic' })

      const completed = stripeFixtures.checkout({ status: 'complete', payment_status: 'paid' })
      const event = stripeFixtures.event('checkout.session.completed', completed)

      stripeMocks.retrieveCheckout.mockResolvedValue(
        stripeFixtures.checkout({ status: 'open', payment_status: 'unpaid' }),
      )

      await service.handleWebhook(event)

      expect(stripeMocks.listCheckoutItems).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toMatchObject([{ id: event.id }])
    })

    it('rolls back a checkout event when Stripe returns a different customer', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_owner' })

      const checkout = stripeFixtures.checkout({ customer: 'cus_owner' })

      stripeMocks.retrieveCheckout.mockResolvedValue(stripeFixtures.checkout({ customer: 'cus_other' }))

      await expect(service.handleWebhook(stripeFixtures.event('checkout.session.completed', checkout))).rejects.toThrow(
        'Stripe resource belongs to a different customer',
      )
      expect(stripeMocks.listCheckoutItems).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)
    })

    it('rolls back a paid checkout event when its amount is missing', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_generic' })

      const checkout = stripeFixtures.checkout({ status: 'complete', payment_status: 'paid', amount_total: null })

      stripeMocks.retrieveCheckout.mockResolvedValue(checkout)

      await expect(service.handleWebhook(stripeFixtures.event('checkout.session.completed', checkout))).rejects.toThrow(
        'Paid checkout is missing its amount or currency',
      )
      expect(stripeMocks.listCheckoutItems).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)
    })

    it('accepts an expanded customer and records items without a price or quantity', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_generic' })
      const checkout = stripeFixtures.checkout({
        customer: stripeFixtures.customer({ id: 'cus_generic' }),
        amount_total: 3500,
        currency: 'eur',
      })
      const event = stripeFixtures.event('checkout.session.async_payment_succeeded', checkout, { created: 1792324800 })

      stripeMocks.retrieveCheckout.mockResolvedValue(checkout)
      stripeMocks.listCheckoutItems.mockReturnValue(
        stripeFixtures.list([
          stripeFixtures.lineItem({
            price: null,
            quantity: null,
            amount_total: 3500,
            currency: 'eur',
            description: 'Custom item',
          }),
        ]),
      )

      await service.handleWebhook(event)

      expect(await db.select().from(purchase)).toMatchObject([
        {
          userId: account.id,
          stripeCustomerId: 'cus_generic',
          stripeSubscriptionId: null,
          stripeCheckoutSessionId: checkout.id,
          stripePaymentIntentId: 'pi_generic',
          amount: 3500,
          currency: 'eur',
          paidAt: new Date(1792324800000),
          items: [
            { priceId: null, productId: null, description: 'Custom item', quantity: 1, amount: 3500, currency: 'eur' },
          ],
        },
      ])
    })

    it('uses invoice details to record an invoice-backed checkout', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_generic' })
      const checkout = stripeFixtures.checkout({ invoice: 'in_checkout' })
      const invoice = stripeFixtures.invoice({ id: 'in_checkout', parent: null, amount_paid: 2500 })

      stripeMocks.retrieveCheckout.mockResolvedValue(checkout)
      stripeMocks.retrieveInvoice.mockResolvedValue(invoice)
      stripeMocks.listInvoiceItems.mockReturnValue(
        stripeFixtures.list([stripeFixtures.invoiceLineItem({ amount: 2500 })]),
      )

      await service.handleWebhook(stripeFixtures.event('checkout.session.completed', checkout))

      expect(stripeMocks.listCheckoutItems).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toMatchObject([
        {
          userId: account.id,
          stripeSubscriptionId: null,
          stripeInvoiceId: 'in_checkout',
          stripeCheckoutSessionId: null,
          amount: 2500,
        },
      ])
    })
  })

  describe('Invoice Events - Payment Status and Recovery', () => {
    it('records no purchase for a failed invoice and saves it when a later event confirms payment', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_generic' })
      const unpaid = stripeFixtures.invoice({ status: 'open', amount_paid: 0 })

      stripeMocks.retrieveInvoice.mockResolvedValue(unpaid)

      await service.handleWebhook(stripeFixtures.event('invoice.payment_failed', unpaid))

      expect(stripeMocks.listInvoiceItems).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)

      const paid = stripeFixtures.invoice({ status: 'paid', amount_paid: 2000 })

      stripeMocks.retrieveInvoice.mockResolvedValue(paid)
      stripeMocks.listInvoiceItems.mockReturnValue(stripeFixtures.list([stripeFixtures.invoiceLineItem()]))

      await service.handleWebhook(stripeFixtures.event('invoice.paid', paid))

      expect(await db.select().from(purchase)).toMatchObject([
        { userId: account.id, stripeInvoiceId: paid.id, stripeSubscriptionId: 'sub_generic', amount: 2000 },
      ])
      expect(await db.select().from(stripeWebhook)).toHaveLength(2)
    })

    it('rolls back an invoice event when the retrieved customer does not match its owner', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_owner' })

      const invoice = stripeFixtures.invoice({ customer: 'cus_owner' })

      stripeMocks.retrieveInvoice.mockResolvedValue(
        stripeFixtures.invoice({ customer: stripeFixtures.customer({ id: 'cus_other' }) }),
      )

      await expect(service.handleWebhook(stripeFixtures.event('invoice.paid', invoice))).rejects.toThrow(
        'Stripe resource belongs to a different customer',
      )
      expect(stripeMocks.listInvoiceItems).not.toHaveBeenCalled()
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)
    })

    it('retries the same invoice event after a provider failure without retaining an event marker', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_generic' })

      const invoice = stripeFixtures.invoice()
      const event = stripeFixtures.event('invoice.paid', invoice)
      const failure = new Error('Invoice temporarily unavailable')

      stripeMocks.retrieveInvoice.mockRejectedValueOnce(failure).mockResolvedValue(invoice)
      stripeMocks.listInvoiceItems.mockReturnValue(stripeFixtures.list([stripeFixtures.invoiceLineItem()]))

      await expect(service.handleWebhook(event)).rejects.toBe(failure)
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)

      await service.handleWebhook(event)

      expect(await db.select().from(purchase)).toMatchObject([{ stripeInvoiceId: invoice.id, amount: 2000 }])
      expect(await db.select().from(stripeWebhook)).toMatchObject([{ id: event.id }])
    })
  })
})
