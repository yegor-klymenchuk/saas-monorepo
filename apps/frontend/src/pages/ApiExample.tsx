import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { FormEvent } from 'react'
import { useTRPC } from '@/shared/api'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/shared/ui'

export function ApiExample() {
  const trpc = useTRPC()
  const createMessage = useMutation(trpc.example.createMessage.mutationOptions())
  const [message, setMessage] = useState('Hello from React')
  const [messageId, setMessageId] = useState('')
  const [requestedMessageId, setRequestedMessageId] = useState('')
  const getMessage = useQuery({
    ...trpc.example.getMessage.queryOptions({
      id: requestedMessageId || '00000000-0000-4000-8000-000000000000',
    }),
    enabled: Boolean(requestedMessageId),
  })

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    createMessage.mutate(
      { message: trimmedMessage },
      {
        onSuccess(createdMessage) {
          setMessageId(createdMessage.id)
          setRequestedMessageId(createdMessage.id)
        },
      },
    )
  }

  const handleLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRequestedMessageId(messageId.trim())
  }

  return (
    <section className="grid gap-6 md:grid-cols-2" aria-labelledby="api-example-title">
      <h2 id="api-example-title" className="sr-only">
        Frontend and backend integration examples
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>POST mutation</CardTitle>
          <CardDescription>
            <code>POST /trpc/example.createMessage</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={handleCreate}>
            <div className="space-y-1.5">
              <Label htmlFor="example-message">Message</Label>
              <Input
                id="example-message"
                value={message}
                maxLength={200}
                required
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={createMessage.isPending || !message.trim()}>
              {createMessage.isPending ? 'Saving…' : 'Save to PostgreSQL'}
            </Button>
          </form>

          {createMessage.isError ? <p className="text-destructive">{createMessage.error.message}</p> : null}
          {createMessage.data ? (
            <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
              {JSON.stringify(createMessage.data, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GET query</CardTitle>
          <CardDescription>
            <code>GET /trpc/example.getMessage</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={handleLookup}>
            <div className="space-y-1.5">
              <Label htmlFor="example-message-id">Message ID</Label>
              <Input
                id="example-message-id"
                value={messageId}
                placeholder="Create a message or paste its UUID"
                required
                onChange={(event) => setMessageId(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={getMessage.isFetching || !messageId.trim()}>
              {getMessage.isFetching ? 'Loading…' : 'Load from PostgreSQL'}
            </Button>
          </form>

          {getMessage.isError ? (
            <p className="text-destructive">
              {getMessage.error.data?.applicationCode ? `${getMessage.error.data.applicationCode}: ` : null}
              {getMessage.error.message}
            </p>
          ) : null}
          {getMessage.data ? (
            <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
              {JSON.stringify(getMessage.data, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
