import { describe, expect, it } from 'vitest'

import { env } from '../env'
import { mailFixtures } from '../test/mocks/mail/fixtures'
import { mailMocks } from '../test/mocks/mail/setup'
import { mail, MailSendError } from './mail'

describe('MailClient - Sending', () => {
  it('sends HTML through the configured API with the default sender and returns accepted email IDs', async () => {
    mailMocks.fetch.mockResolvedValueOnce(mailFixtures.response())

    const result = await mail.send({
      to: 'recipient@example.test',
      subject: 'Welcome',
      body: '<p>Welcome to the app</p>',
    })

    expect(mailMocks.fetch).toHaveBeenCalledExactlyOnceWith(`${env.MAIL_API_URL}/v1/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'recipient@example.test',
        subject: 'Welcome',
        body: '<p>Welcome to the app</p>',
        from: { email: env.MAIL_FROM_EMAIL, name: env.MAIL_FROM_NAME },
      }),
      redirect: 'error',
      signal: expect.any(AbortSignal),
    })
    expect(result).toEqual({ emails: [{ id: 'email_123', to: 'recipient@example.test' }] })
  })

  it('supports named recipients, multiple recipients, sender overrides, reply-to, data and idempotency', async () => {
    mailMocks.fetch.mockResolvedValueOnce(
      mailFixtures.response({
        emails: [
          { email: 'email_one', contact: { id: 'contact_one', email: 'one@example.test' } },
          { email: 'email_two', contact: { id: 'contact_two', email: 'two@example.test' } },
        ],
      }),
    )

    const result = await mail.send({
      to: [{ name: 'First User', email: 'one@example.test' }, 'two@example.test'],
      subject: 'Your receipt',
      body: '<p>Order {{orderId}}</p>',
      from: { name: 'Billing', email: 'billing@example.test' },
      replyTo: 'support@example.test',
      data: { orderId: { value: 'order_123', persistent: false } },
      idempotencyKey: 'receipt-order_123',
    })

    const options = mailMocks.fetch.mock.calls[0]?.[1]

    expect(options?.headers).toMatchObject({ 'Idempotency-Key': 'receipt-order_123' })
    expect(JSON.parse(String(options?.body))).toEqual({
      to: [{ name: 'First User', email: 'one@example.test' }, 'two@example.test'],
      subject: 'Your receipt',
      body: '<p>Order {{orderId}}</p>',
      from: { name: 'Billing', email: 'billing@example.test' },
      reply: 'support@example.test',
      data: { orderId: { value: 'order_123', persistent: false } },
    })
    expect(result.emails).toEqual([
      { id: 'email_one', to: 'one@example.test' },
      { id: 'email_two', to: 'two@example.test' },
    ])
  })

  it('removes trailing slashes from the API URL', async () => {
    const originalUrl = env.MAIL_API_URL

    env.MAIL_API_URL = `${originalUrl}///`
    mailMocks.fetch.mockResolvedValueOnce(mailFixtures.response())

    try {
      await mail.send({ to: 'recipient@example.test', subject: 'Welcome', body: '<p>Hello</p>' })

      expect(mailMocks.fetch.mock.calls[0]?.[0]).toBe(`${originalUrl}/v1/send`)
    } finally {
      env.MAIL_API_URL = originalUrl
    }
  })

  it('surfaces duplicate-key rejection without retrying or reporting a successful send', async () => {
    mailMocks.fetch.mockResolvedValueOnce(mailFixtures.error(409))

    await expect(
      mail.send({
        to: 'recipient@example.test',
        subject: 'Receipt',
        body: '<p>Receipt</p>',
        idempotencyKey: 'receipt-order_123',
      }),
    ).rejects.toMatchObject({ name: 'MailSendError', status: 409 })
    expect(mailMocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('surfaces provider failure without leaking response details or retrying', async () => {
    mailMocks.fetch.mockResolvedValueOnce(mailFixtures.error(503))

    await expect(mail.send({ to: 'recipient@example.test', subject: 'Welcome', body: '<p>Hello</p>' })).rejects.toEqual(
      new MailSendError('Mail service rejected the send request', 503),
    )
    expect(mailMocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed successful responses', async () => {
    // An empty provider result must not be reported as an accepted email
    mailMocks.fetch.mockResolvedValueOnce(mailFixtures.response({ emails: [] }))

    await expect(mail.send({ to: 'recipient@example.test', subject: 'Welcome', body: '<p>Hello</p>' })).rejects.toEqual(
      new MailSendError('Mail service returned an invalid response', 200),
    )
  })

  it('rejects HTML when the API URL points at the dashboard', async () => {
    mailMocks.fetch.mockResolvedValueOnce(mailFixtures.dashboardResponse())

    await expect(mail.send({ to: 'recipient@example.test', subject: 'Welcome', body: '<p>Hello</p>' })).rejects.toEqual(
      new MailSendError('Mail service returned an invalid response', 200),
    )
  })

  it('propagates connection failures without retrying a possibly accepted email', async () => {
    const error = new TypeError('Connection lost')

    mailMocks.fetch.mockRejectedValueOnce(error)

    await expect(mail.send({ to: 'recipient@example.test', subject: 'Welcome', body: '<p>Hello</p>' })).rejects.toBe(
      error,
    )
    expect(mailMocks.fetch).toHaveBeenCalledTimes(1)
  })
})
