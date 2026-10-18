import { describe, expect, it } from 'vitest'

import { fixtures } from '../test/fixtures'
import { stripeFixtures } from '../test/mocks/stripe/fixtures'
import { stripeMocks } from '../test/mocks/stripe/setup'
import { request } from '../test/request'

describe('Stripe Webhook - HTTP Contracts', () => {
  describe('Signature Verification', () => {
    it('returns 400 STRIPE_SIGNATURE_NOT_FOUND for a missing signature', async () => {
      const response = await request.post('/api/auth/stripe/webhook').send({ id: 'evt_unsigned' }).expect(400)

      expect(response.body.code).toBe('STRIPE_SIGNATURE_NOT_FOUND')
    })

    it('returns 400 FAILED_TO_CONSTRUCT_STRIPE_EVENT for a forged signature', async () => {
      const response = await request
        .post('/api/auth/stripe/webhook')
        .set('Stripe-Signature', 'forged')
        .send({ id: 'evt_forged' })
        .expect(400)

      expect(response.body.code).toBe('FAILED_TO_CONSTRUCT_STRIPE_EVENT')
    })

    it('rejects a signed payload that was modified after signing', async () => {
      const payload = JSON.stringify(stripeFixtures.event('customer.created', stripeFixtures.customer()))
      const signature = stripeFixtures.signature(payload)

      const response = await request
        .post('/api/auth/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', signature)
        .send(`${payload} `)
        .expect(400)

      expect(response.body.code).toBe('FAILED_TO_CONSTRUCT_STRIPE_EVENT')
    })

    it('rejects an expired webhook signature', async () => {
      const payload = JSON.stringify(stripeFixtures.event('customer.created', stripeFixtures.customer()))

      const response = await request
        .post('/api/auth/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', stripeFixtures.signature(payload, Math.floor(Date.now() / 1000) - 600))
        .send(payload)
        .expect(400)

      expect(response.body.code).toBe('FAILED_TO_CONSTRUCT_STRIPE_EVENT')
    })
  })

  describe('Delivery - Acknowledgements and Failures', () => {
    it('acknowledges unsupported signed events with 200', async () => {
      const payload = JSON.stringify(stripeFixtures.event('customer.created', stripeFixtures.customer()))

      const response = await request
        .post('/api/auth/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', stripeFixtures.signature(payload))
        .send(payload)
        .expect(200)

      expect(response.body).toEqual({ success: true })
    })

    it('passes a valid signed payment event to billing processing and returns 200', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_generic' })

      const checkout = stripeFixtures.checkout({ mode: 'payment', customer: 'cus_generic' })
      const payload = JSON.stringify(stripeFixtures.event('checkout.session.completed', checkout))

      stripeMocks.retrieveCheckout.mockResolvedValue(checkout)
      stripeMocks.listCheckoutItems.mockReturnValue(stripeFixtures.list([stripeFixtures.lineItem()]))

      const response = await request
        .post('/api/auth/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', stripeFixtures.signature(payload))
        .send(payload)
        .expect(200)

      expect(response.body).toEqual({ success: true })
      expect(stripeMocks.retrieveCheckout).toHaveBeenCalledExactlyOnceWith(checkout.id)
    })

    it('returns 400 STRIPE_WEBHOOK_ERROR when billing processing fails', async () => {
      await fixtures.user({ stripeCustomerId: 'cus_generic' })

      const payload = JSON.stringify(stripeFixtures.event('checkout.session.completed', stripeFixtures.checkout()))

      stripeMocks.retrieveCheckout.mockRejectedValue(new Error('Provider temporarily unavailable'))

      const response = await request
        .post('/api/auth/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', stripeFixtures.signature(payload))
        .send(payload)
        .expect(400)

      expect(response.body.code).toBe('STRIPE_WEBHOOK_ERROR')
    })
  })
})
