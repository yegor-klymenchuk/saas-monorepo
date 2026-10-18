import Stripe from 'stripe'

import { env } from '../env'

let stripe: Stripe | null = null

export function getStripe(): Stripe {
  stripe ??= new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia' })

  return stripe
}
