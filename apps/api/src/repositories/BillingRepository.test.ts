import { describe, expect, it } from 'vitest'

import { db } from '../database/database'
import { purchase } from '../database/schema/purchase'
import { stripeWebhook } from '../database/schema/stripe-webhook'
import { fixtures } from '../test/fixtures'
import { BillingRepository } from './BillingRepository'

describe('BillingRepository - Persistence', () => {
  const repository = new BillingRepository()

  describe('Customer Lookup', () => {
    it('finds the Stripe customer linked to the requested user', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_owner' })

      await fixtures.user({ stripeCustomerId: 'cus_other' })

      await expect(repository.findCustomerByUserId(account.id)).resolves.toEqual({
        userId: account.id,
        stripeCustomerId: 'cus_owner',
      })
    })

    it('returns null for an unlinked or missing user', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })

      await expect(repository.findCustomerByUserId(account.id)).resolves.toBeNull()
      await expect(repository.findCustomerByUserId('missing-user')).resolves.toBeNull()
    })

    it('finds the user linked to the requested Stripe customer', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_owner' })

      await fixtures.user({ stripeCustomerId: 'cus_other' })

      await expect(repository.findCustomerByStripeId('cus_owner')).resolves.toEqual({
        userId: account.id,
        stripeCustomerId: 'cus_owner',
      })
    })

    it('returns null for an unknown Stripe customer', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_other' })

      await expect(repository.findCustomerByStripeId('cus_unknown')).resolves.toBeNull()
    })
  })

  describe('Customer Linking', () => {
    it('links an unlinked user and returns the persisted customer', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })

      await expect(repository.saveCustomer(account.id, 'cus_new')).resolves.toEqual({
        userId: account.id,
        stripeCustomerId: 'cus_new',
      })
      await expect(repository.findCustomerByStripeId('cus_new')).resolves.toEqual({
        userId: account.id,
        stripeCustomerId: 'cus_new',
      })
    })

    it('preserves an existing customer when another checkout supplies a different one', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_existing' })

      await expect(repository.saveCustomer(account.id, 'cus_replacement')).resolves.toEqual({
        userId: account.id,
        stripeCustomerId: 'cus_existing',
      })
      await expect(repository.findCustomerByStripeId('cus_replacement')).resolves.toBeNull()
    })

    it('keeps one customer when two checkouts link the same user concurrently', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })

      const customers = await Promise.all([
        repository.saveCustomer(account.id, 'cus_first'),
        repository.saveCustomer(account.id, 'cus_second'),
      ])
      const persistedCustomer = await repository.findCustomerByUserId(account.id)

      expect(persistedCustomer).toEqual({ userId: account.id, stripeCustomerId: expect.any(String) })
      expect(['cus_first', 'cus_second']).toContain(persistedCustomer?.stripeCustomerId)
      expect(customers).toEqual([persistedCustomer, persistedCustomer])
    })

    it('rejects a missing user without creating a customer link', async () => {
      await expect(repository.saveCustomer('missing-user', 'cus_missing')).rejects.toThrow(
        'The database did not return the billing customer',
      )
      await expect(repository.findCustomerByStripeId('cus_missing')).resolves.toBeNull()
    })
  })

  describe('Purchase Persistence', () => {
    it('rejects negative amounts through the database constraint and allows a corrected insert', async () => {
      const input = {
        stripeCustomerId: 'cus_owner',
        stripeCheckoutSessionId: 'cs_invalid_amount',
        amount: -1,
        currency: 'usd',
        items: [],
        paidAt: new Date('2026-10-18T10:00:00.000Z'),
      }

      await expect(repository.savePurchase(input)).rejects.toMatchObject({
        cause: { code: '23514', constraint: 'purchase_amount_nonnegative' },
      })
      expect(await db.select().from(purchase)).toHaveLength(0)

      await repository.savePurchase({ ...input, amount: 0 })

      expect(await db.select().from(purchase)).toMatchObject([
        { stripeCheckoutSessionId: 'cs_invalid_amount', amount: 0 },
      ])
    })

    it('requires a checkout session or invoice as the purchase source', async () => {
      await expect(
        repository.savePurchase({
          stripeCustomerId: 'cus_owner',
          stripeCheckoutSessionId: null,
          stripeInvoiceId: null,
          amount: 2000,
          currency: 'usd',
          items: [],
          paidAt: new Date('2026-10-18T10:00:00.000Z'),
        }),
      ).rejects.toMatchObject({ cause: { code: '23514', constraint: 'purchase_stripe_source_required' } })
      expect(await db.select().from(purchase)).toHaveLength(0)
    })

    it('persists a one-time purchase and preserves it when its checkout is delivered again', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_owner' })
      const input = {
        userId: account.id,
        stripeCustomerId: 'cus_owner',
        stripeSubscriptionId: null,
        stripeCheckoutSessionId: 'cs_payment',
        stripePaymentIntentId: 'pi_payment',
        amount: 2000,
        currency: 'usd',
        items: [
          {
            priceId: 'price_credits',
            productId: 'prod_credits',
            description: 'Credits',
            quantity: 1,
            amount: 2000,
            currency: 'usd',
          },
        ],
        paidAt: new Date('2026-10-18T10:00:00.000Z'),
      }

      await repository.savePurchase(input)
      await repository.savePurchase({ ...input, stripePaymentIntentId: 'pi_other', amount: 3000 })

      expect(await db.select().from(purchase)).toEqual([
        { ...input, id: expect.any(String), stripeInvoiceId: null, createdAt: expect.any(Date) },
      ])
    })

    it('does not record the same PaymentIntent under a second checkout', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_owner' })
      const original = await fixtures.purchase({
        userId: account.id,
        stripeCustomerId: 'cus_owner',
        stripeCheckoutSessionId: 'cs_original',
        stripePaymentIntentId: 'pi_shared',
        amount: 2000,
      })

      await repository.savePurchase({
        ...original,
        id: undefined,
        stripeCheckoutSessionId: 'cs_duplicate',
        amount: 3000,
      })

      expect(await db.select().from(purchase)).toEqual([original])
    })

    it('records an invoice once and retains its subscription reference', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_owner' })
      const input = {
        userId: account.id,
        stripeCustomerId: 'cus_owner',
        stripeSubscriptionId: 'sub_recurring',
        stripeInvoiceId: 'in_recurring',
        amount: 4000,
        currency: 'eur',
        items: [],
        paidAt: new Date('2026-10-18T10:00:00.000Z'),
      }

      await repository.savePurchase(input)
      await repository.savePurchase({ ...input, amount: 5000 })

      expect(await db.select().from(purchase)).toEqual([
        {
          ...input,
          id: expect.any(String),
          stripeCheckoutSessionId: null,
          stripePaymentIntentId: null,
          createdAt: expect.any(Date),
        },
      ])
    })
  })

  describe('Webhook Processing - Transactions and Retries', () => {
    it('runs the handler once for concurrent deliveries and skips later retries', async () => {
      const account = await fixtures.user({ stripeCustomerId: 'cus_owner' })
      const event = { id: 'evt_payment', type: 'checkout.session.completed', customerId: 'cus_owner' }
      let handledCount = 0
      const handle = async (transactionRepository: BillingRepository): Promise<void> => {
        handledCount += 1
        await transactionRepository.savePurchase({
          userId: account.id,
          stripeCustomerId: 'cus_owner',
          stripeCheckoutSessionId: 'cs_payment',
          amount: 2000,
          currency: 'usd',
          items: [],
          paidAt: new Date('2026-10-18T10:00:00.000Z'),
        })
      }

      await Promise.all([repository.processEvent(event, handle), repository.processEvent(event, handle)])
      await repository.processEvent(event, handle)

      expect(handledCount).toBe(1)
      expect(await db.select().from(stripeWebhook)).toEqual([
        { id: event.id, type: event.type, processedAt: expect.any(Date) },
      ])
      expect(await db.select().from(purchase)).toMatchObject([
        { userId: account.id, stripeCheckoutSessionId: 'cs_payment', amount: 2000 },
      ])
    })

    it('rolls back customer, purchase, and event writes on failure and allows the same event to succeed on retry', async () => {
      const account = await fixtures.user({ stripeCustomerId: null })
      const event = { id: 'evt_retry', type: 'checkout.session.completed', customerId: 'cus_owner' }
      const input = {
        userId: account.id,
        stripeCustomerId: 'cus_owner',
        stripeCheckoutSessionId: 'cs_retry',
        amount: 2000,
        currency: 'usd',
        items: [],
        paidAt: new Date('2026-10-18T10:00:00.000Z'),
      }

      await expect(
        repository.processEvent(event, async (transactionRepository) => {
          await transactionRepository.saveCustomer(account.id, 'cus_owner')
          await transactionRepository.savePurchase(input)

          // Fail after both writes to verify that the callback uses the event transaction
          throw new Error('Processing interrupted')
        }),
      ).rejects.toThrow('Processing interrupted')

      await expect(repository.findCustomerByUserId(account.id)).resolves.toBeNull()
      expect(await db.select().from(purchase)).toHaveLength(0)
      expect(await db.select().from(stripeWebhook)).toHaveLength(0)

      await repository.processEvent(event, async (transactionRepository) => {
        await transactionRepository.saveCustomer(account.id, 'cus_owner')
        await transactionRepository.savePurchase(input)
      })

      await expect(repository.findCustomerByUserId(account.id)).resolves.toEqual({
        userId: account.id,
        stripeCustomerId: 'cus_owner',
      })
      expect(await db.select().from(purchase)).toMatchObject([input])
      expect(await db.select().from(stripeWebhook)).toEqual([
        { id: event.id, type: event.type, processedAt: expect.any(Date) },
      ])
    })
  })
})
