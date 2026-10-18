import { z } from 'zod'

import { env } from '../env'

export interface MailAddress {
  email: string
  name?: string
}

export interface SendMailInput {
  to: string | MailAddress | (string | MailAddress)[]
  subject: string
  body: string
  from?: string | MailAddress
  replyTo?: string
  data?: Record<string, unknown>
  idempotencyKey?: string
}

export interface SendMailResult {
  emails: { id: string; to: string }[]
}

export interface MailClient {
  send(input: SendMailInput): Promise<SendMailResult>
}

export class MailSendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'MailSendError'
  }
}

const sendResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    emails: z
      .array(
        z.object({
          email: z.string().min(1),
          contact: z.object({ email: z.email() }),
        }),
      )
      .min(1),
  }),
})

export const mail: MailClient = {
  async send(input) {
    const response = await fetch(`${env.MAIL_API_URL.replace(/\/+$/, '')}/v1/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MAIL_API_KEY}`,
        'Content-Type': 'application/json',
        ...(input.idempotencyKey === undefined ? {} : { 'Idempotency-Key': input.idempotencyKey }),
      },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        body: input.body,
        from: input.from ?? { email: env.MAIL_FROM_EMAIL, name: env.MAIL_FROM_NAME },
        reply: input.replyTo,
        data: input.data,
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      // Do not expose provider response bodies containing email content or recipient data
      await response.body?.cancel()

      throw new MailSendError('Mail service rejected the send request', response.status)
    }

    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      throw new MailSendError('Mail service returned an invalid response', response.status)
    }

    const result = sendResponseSchema.safeParse(payload)

    if (!result.success) {
      throw new MailSendError('Mail service returned an invalid response', response.status)
    }

    return { emails: result.data.data.emails.map((email) => ({ id: email.email, to: email.contact.email })) }
  },
}
