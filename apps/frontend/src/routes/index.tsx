import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Authentication Links */}
          <a
            href="/sign-in"
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6 text-primary"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  Sign In
                </h3>
                <p className="text-sm text-muted-foreground">
                  Access your account with email/password or Google OAuth
                </p>
              </div>
            </div>
          </a>

          <a
            href="/sign-up"
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6 text-primary"
                >
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  Sign Up
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create a new account to get started with the platform
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard"
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-6 h-6 text-primary"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  Dashboard
                </h3>
                <p className="text-sm text-muted-foreground">
                  View your profile and account details (requires authentication)
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* Tech Stack */}
        <div className="pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground mb-4">Built with</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
              TanStack Router
            </span>
            <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
              TanStack Start
            </span>
            <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
              Better Auth
            </span>
            <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
              Drizzle ORM
            </span>
            <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
              PostgreSQL
            </span>
            <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
              Tailwind CSS
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
