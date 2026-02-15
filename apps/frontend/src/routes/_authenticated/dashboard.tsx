import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { signOut as signOutServer } from '@/features/auth/actions/sign-out'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const context = Route.useRouteContext()
  const navigate = useNavigate()

  const signOut = useServerFn(signOutServer)

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/sign-in' })
  }

  const user = context.session.user
  const session = context.session.session

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back! Here's your account overview.</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Logout
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-bold ring-4 ring-primary/10">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {user.emailVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
                  {user.emailVerified && <Badge variant="secondary">Verified</Badge>}
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                  </svg>
                  {user?.email || 'No email'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  User ID: <code className="text-xs bg-muted px-2 py-0.5 rounded">{user?.id}</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Account Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Your account verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Verified</span>
                  <Badge variant={user.emailVerified ? 'default' : 'destructive'}>
                    {user.emailVerified ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Type</span>
                  <Badge variant="outline">Standard</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Created Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Created</CardTitle>
              <CardDescription>When you joined our platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path
                      fillRule="evenodd"
                      d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  You've been with us for{' '}
                  {user.createdAt
                    ? Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : 0}{' '}
                  days
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated Card */}
          <Card>
            <CardHeader>
              <CardTitle>Last Updated</CardTitle>
              <CardDescription>Most recent account changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">{user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>Information about your active session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Session ID</p>
                <code className="text-xs bg-muted px-3 py-1.5 rounded block break-all">{session.id}</code>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Expires At</p>
                <p className="text-sm text-muted-foreground">
                  {session.expiresAt ? formatDate(session.expiresAt) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
