import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { billingConfig } from '../config/billing'
import { env } from '../env'
import { signUp } from '../test/helpers/auth'
import { sentryMocks } from '../test/mocks/sentry/setup'
import { stripeFixtures } from '../test/mocks/stripe/fixtures'
import { stripeMocks } from '../test/mocks/stripe/setup'
import { request } from '../test/request'

describe('Billing Routes - HTTP Contracts', () => {
  describe('Authentication - Access Control', () => {
    it('returns 401 UNAUTHORIZED for payment checkout without a session', async () => {
      const response = await request
        .post('/trpc/billing.createPaymentCheckout')
        .send({ productKey: 'credits-small', requestId: randomUUID() })
        .expect(401)

      expect(response.body.error.data).toMatchObject({
        code: 'UNAUTHORIZED',
        httpStatus: 401,
        applicationCode: 'UNAUTHORIZED',
      })
      expect(stripeMocks.listPrices).not.toHaveBeenCalled()
      expect(stripeMocks.createCheckout).not.toHaveBeenCalled()
      expect(sentryMocks.captureException).not.toHaveBeenCalled()
    })

    it('returns 401 UNAUTHORIZED for subscription checkout without a session', async () => {
      const response = await request
        .post('/api/auth/subscription/upgrade')
        .send({ plan: 'standard', successUrl: env.CORS_ORIGIN, cancelUrl: env.CORS_ORIGIN })
        .expect(401)

      expect(response.body.code).toBe('UNAUTHORIZED')
      expect(stripeMocks.createCheckout).not.toHaveBeenCalled()
    })

    it('returns 401 UNAUTHORIZED for the customer portal without a session', async () => {
      const response = await request
        .post('/api/auth/subscription/billing-portal')
        .send({ returnUrl: env.CORS_ORIGIN })
        .expect(401)

      expect(response.body.code).toBe('UNAUTHORIZED')
      expect(stripeMocks.createPortal).not.toHaveBeenCalled()
    })

    it('rejects portal access to another user reference', async () => {
      const owner = await signUp()
      const other = await signUp()

      const response = await request
        .post('/api/auth/subscription/billing-portal')
        .set('Cookie', other.cookie)
        .set('Origin', env.CORS_ORIGIN)
        .send({ referenceId: owner.userId, returnUrl: env.CORS_ORIGIN })
        .expect(401)

      expect(response.body.code).toBe('UNAUTHORIZED')
      expect(stripeMocks.createPortal).not.toHaveBeenCalled()
    })
  })

  describe('Request Validation - Input and HTTP Method', () => {
    it('returns 400 BAD_REQUEST for an empty product key', async () => {
      const account = await signUp()

      const response = await request
        .post('/trpc/billing.createPaymentCheckout')
        .set('Cookie', account.cookie)
        .send({ productKey: '', requestId: randomUUID() })
        .expect(400)

      expect(response.body.error.data).toMatchObject({ code: 'BAD_REQUEST', httpStatus: 400, applicationCode: null })
      expect(stripeMocks.listPrices).not.toHaveBeenCalled()
    })

    it('returns 400 BAD_REQUEST when the request ID is missing', async () => {
      const account = await signUp()

      const response = await request
        .post('/trpc/billing.createPaymentCheckout')
        .set('Cookie', account.cookie)
        .send({ productKey: 'credits-small' })
        .expect(400)

      expect(response.body.error.data).toMatchObject({ code: 'BAD_REQUEST', httpStatus: 400, applicationCode: null })
      expect(stripeMocks.listPrices).not.toHaveBeenCalled()
    })

    it('returns 400 BAD_REQUEST when the request ID is not a UUID', async () => {
      const account = await signUp()

      const response = await request
        .post('/trpc/billing.createPaymentCheckout')
        .set('Cookie', account.cookie)
        .send({ productKey: 'credits-small', requestId: 'invalid-request-id' })
        .expect(400)

      expect(response.body.error.data).toMatchObject({ code: 'BAD_REQUEST', httpStatus: 400, applicationCode: null })
      expect(stripeMocks.listPrices).not.toHaveBeenCalled()
    })

    it('returns 405 METHOD_NOT_SUPPORTED for checkout through GET', async () => {
      const account = await signUp()

      const response = await request
        .get('/trpc/billing.createPaymentCheckout')
        .set('Cookie', account.cookie)
        .query({ input: JSON.stringify({ productKey: 'credits-small', requestId: randomUUID() }) })
        .expect(405)

      expect(response.body.error.data).toMatchObject({ code: 'METHOD_NOT_SUPPORTED', httpStatus: 405 })
      expect(stripeMocks.listPrices).not.toHaveBeenCalled()
    })
  })

  describe('Responses - Serialization and Error Mapping', () => {
    const originalProducts = billingConfig.products

    beforeEach(() => {
      billingConfig.products = [{ key: 'credits-small', lookupKey: 'credits_small' }]
    })

    afterEach(() => {
      billingConfig.products = originalProducts
    })

    it('returns the checkout response and derives the user identity from the session', async () => {
      const account = await signUp()

      stripeMocks.listPrices.mockReturnValue(stripeFixtures.list([stripeFixtures.price()]))
      stripeMocks.createCustomer.mockResolvedValue(stripeFixtures.customer())
      stripeMocks.createCheckout.mockResolvedValue(stripeFixtures.checkout())

      const response = await request
        .post('/trpc/billing.createPaymentCheckout')
        .set('Cookie', account.cookie)
        .send({ productKey: 'credits-small', requestId: randomUUID(), userId: 'untrusted-user' })
        .expect(200)

      expect(response.body).toEqual({
        result: { data: { id: 'cs_test_generic', url: 'https://checkout.stripe.com/c/pay/mock' } },
      })
      expect(stripeMocks.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ client_reference_id: account.userId }),
        expect.any(Object),
      )
    })

    it('maps a business validation error to 400 with its application code', async () => {
      const account = await signUp()

      const response = await request
        .post('/trpc/billing.createPaymentCheckout')
        .set('Cookie', account.cookie)
        .send({ productKey: 'unknown-product', requestId: randomUUID() })
        .expect(400)

      expect(response.body.error.data).toMatchObject({
        code: 'BAD_REQUEST',
        httpStatus: 400,
        applicationCode: 'BILLING_PRODUCT_NOT_ALLOWED',
      })
      expect(sentryMocks.captureException).not.toHaveBeenCalled()
    })

    it('maps a provider failure to 500 INTERNAL_SERVER_ERROR', async () => {
      const account = await signUp()

      const error = new Error('Provider temporarily unavailable')

      stripeMocks.listPrices.mockRejectedValue(error)

      const response = await request
        .post('/trpc/billing.createPaymentCheckout')
        .set('Cookie', account.cookie)
        .send({ productKey: 'credits-small', requestId: randomUUID() })
        .expect(500)

      expect(response.body.error.data).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        httpStatus: 500,
        applicationCode: null,
      })
      expect(sentryMocks.captureException).toHaveBeenCalledExactlyOnceWith(error)
    })

    it('returns 500 when the service result violates the response schema', async () => {
      const account = await signUp()

      stripeMocks.listPrices.mockReturnValue(stripeFixtures.list([stripeFixtures.price()]))
      stripeMocks.createCustomer.mockResolvedValue(stripeFixtures.customer())
      stripeMocks.createCheckout.mockResolvedValue(stripeFixtures.checkout({ url: 'invalid-url' }))

      const response = await request
        .post('/trpc/billing.createPaymentCheckout')
        .set('Cookie', account.cookie)
        .send({ productKey: 'credits-small', requestId: randomUUID() })
        .expect(500)

      expect(response.body.error.data).toMatchObject({ code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 })
    })
  })
})
