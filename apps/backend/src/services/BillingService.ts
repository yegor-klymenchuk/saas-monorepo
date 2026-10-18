import type Stripe from 'stripe'

import type { BillingCustomer } from '../repositories/BillingRepository'
import type { CheckoutInput } from '../schemas/billing'

import { billingConfig } from '../config/billing'
import { env } from '../env'
import { BadRequestError } from '../errors/BadRequestError'
import { getStripe } from '../lib/stripe'
import { BillingRepository } from '../repositories/BillingRepository'

interface BillingUser {
  id: string
  email: string
  name: string | null
}

export class BillingService {
  #repository: BillingRepository

  constructor(repository: BillingRepository = new BillingRepository()) {
    this.#repository = repository
  }

  async createPaymentCheckout(user: BillingUser, input: CheckoutInput): Promise<{ id: string; url: string }> {
    const stripe = getStripe()

    const product = billingConfig.products.find((product) => product.key === input.productKey)

    if (!product) {
      throw new BadRequestError('The product is not available for checkout', { code: 'BILLING_PRODUCT_NOT_ALLOWED' })
    }

    const prices = await stripe.prices.list({ lookup_keys: [product.lookupKey], active: true, limit: 1 })
    const price = prices.data[0]

    if (!price || price.lookup_key !== product.lookupKey || !price.active || price.type !== 'one_time') {
      throw new BadRequestError('The price is not available for this checkout type', { code: 'BILLING_PRICE_INVALID' })
    }

    let customer = await this.#repository.findCustomerByUserId(user.id)

    if (!customer) {
      const createdCustomer = await stripe.customers.create(
        {
          email: user.email,
          ...(user.name ? { name: user.name } : {}),
          metadata: { userId: user.id },
        },
        { idempotencyKey: `billing-customer:${user.id}` },
      )

      customer = await this.#repository.saveCustomer(user.id, createdCustomer.id)
    }

    const metadata = { userId: user.id, priceId: price.id }
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer: customer.stripeCustomerId,
        client_reference_id: user.id,
        line_items: [{ price: price.id, quantity: 1 }],
        metadata,
        payment_intent_data: { metadata },
        success_url: `${new URL(env.CORS_ORIGIN).origin}${billingConfig.checkout.successPath}`,
        cancel_url: `${new URL(env.CORS_ORIGIN).origin}${billingConfig.checkout.cancelPath}`,
      },
      { idempotencyKey: `checkout:${user.id}:payment:${input.requestId}` },
    )

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL')
    }

    return { id: session.id, url: session.url }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    // The auth plugin owns subscription checkout, while invoices record recurring purchases
    if (
      (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') &&
      event.data.object.mode !== 'payment'
    ) {
      return
    }

    let handleEvent: (customer: BillingCustomer, repository: BillingRepository) => Promise<void>

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        handleEvent = (customer, repository) =>
          this.#handleCheckoutSession(event.data.object.id, customer, repository, event.created)
        break
      case 'invoice.paid':
      case 'invoice.payment_failed':
        handleEvent = (customer, repository) => this.#handleInvoice(event.data.object.id, customer, repository)
        break

      default:
        return
    }

    const object = event.data.object
    const customerId = typeof object.customer === 'string' ? object.customer : object.customer?.id

    if (!customerId) {
      return
    }

    await this.#repository.processEvent({ id: event.id, type: event.type, customerId }, async (repository) => {
      const customer = await repository.findCustomerByStripeId(customerId)

      // Ignore payments owned by other applications sharing the same Stripe account
      if (!customer) {
        return
      }

      await handleEvent(customer, repository)
    })
  }

  async #handleCheckoutSession(
    id: string,
    customer: BillingCustomer,
    repository: BillingRepository,
    occurredAt: number,
  ): Promise<void> {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(id)

    this.#assertCustomer(session.customer, customer)

    if (session.mode !== 'payment' || session.status !== 'complete' || session.payment_status === 'unpaid') {
      return
    }

    if (session.amount_total === null || !session.currency) {
      throw new Error('Paid checkout is missing its amount or currency')
    }

    if (session.invoice) {
      const invoiceId = typeof session.invoice === 'string' ? session.invoice : session.invoice.id

      await this.#handleInvoice(invoiceId, customer, repository)
      return
    }

    const items = await stripe.checkout.sessions.listLineItems(id, { limit: 100 }).autoPagingToArray({ limit: 10000 })

    await repository.savePurchase({
      userId: customer.userId,
      stripeCustomerId: customer.stripeCustomerId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null),
      amount: session.amount_total,
      currency: session.currency,
      items: items.map((item) => ({
        priceId: item.price?.id ?? null,
        productId: typeof item.price?.product === 'string' ? item.price.product : (item.price?.product?.id ?? null),
        description: item.description,
        quantity: item.quantity ?? 1,
        amount: item.amount_total,
        currency: item.currency,
      })),
      paidAt: new Date(occurredAt * 1000),
    })
  }

  async #handleInvoice(id: string, customer: BillingCustomer, repository: BillingRepository): Promise<void> {
    const stripe = getStripe()
    const invoice = await stripe.invoices.retrieve(id)

    this.#assertCustomer(invoice.customer, customer)

    const remoteSubscription = invoice.parent?.subscription_details?.subscription
    const stripeSubscriptionId =
      typeof remoteSubscription === 'string' ? remoteSubscription : (remoteSubscription?.id ?? null)

    if (invoice.status !== 'paid') {
      return
    }

    const items = await stripe.invoices.listLineItems(id, { limit: 100 }).autoPagingToArray({ limit: 10000 })

    await repository.savePurchase({
      userId: customer.userId,
      stripeSubscriptionId,
      stripeCustomerId: customer.stripeCustomerId,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      items: items.map((item) => ({
        priceId:
          typeof item.pricing?.price_details?.price === 'string'
            ? item.pricing.price_details.price
            : (item.pricing?.price_details?.price.id ?? null),
        productId: item.pricing?.price_details?.product ?? null,
        description: item.description,
        quantity: item.quantity ?? 1,
        amount: item.amount,
        currency: item.currency,
      })),
      paidAt: new Date((invoice.status_transitions.paid_at ?? invoice.created) * 1000),
    })
  }

  #assertCustomer(remote: string | { id: string } | null, customer: BillingCustomer): void {
    const id = typeof remote === 'string' ? remote : remote?.id

    if (id !== customer.stripeCustomerId) {
      throw new Error('Stripe resource belongs to a different customer')
    }
  }
}
