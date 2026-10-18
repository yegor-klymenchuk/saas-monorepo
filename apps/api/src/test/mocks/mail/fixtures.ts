interface MailResponse {
  success: true
  data: {
    emails: { email: string; contact: { id: string; email: string } }[]
    timestamp: string
  }
}

export const mailFixtures = {
  response(overrides: Partial<MailResponse['data']> = {}): Response {
    const payload: MailResponse = {
      success: true,
      data: {
        emails: [{ email: 'email_123', contact: { id: 'contact_123', email: 'recipient@example.test' } }],
        timestamp: '2026-10-19T00:00:00.000Z',
        ...overrides,
      },
    }

    return Response.json(payload)
  },

  dashboardResponse(): Response {
    return new Response('<html><body>Mail dashboard</body></html>', {
      headers: { 'Content-Type': 'text/html' },
    })
  },

  error(status: number): Response {
    return Response.json(
      {
        success: false,
        error: { code: 'PROVIDER_ERROR', message: 'Private provider details' },
      },
      { status },
    )
  },
}
