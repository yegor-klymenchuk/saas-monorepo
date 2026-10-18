# Pricing Intelligence Platform

AI-powered SaaS pricing intelligence platform for optimizing pricing strategies.

## Monorepo Structure

```
.
├── apps/
│   ├── api/              # Express API server and tRPC application router
│   └── web/              # React + TanStack Start
├── docs/                 # Feature specs & documentation
└── docker-compose.yml    # PostgreSQL + Redis
```

## Tech Stack

### API

- **Runtime**: Node.js 20+
- **Framework**: Express
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Queue**: BullMQ + Redis
- **Language**: TypeScript

### Web

- **Framework**: React 19 + TanStack Start
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI
- **State**: TanStack Query
- **Auth**: Better Auth

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Start PostgreSQL + Redis
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers (both apps)
pnpm dev

# Or start individually
pnpm dev:api   # http://localhost:4000
pnpm dev:web  # http://localhost:3000
```

### Environment Setup

Copy `.env.example` files in each app and configure:

```bash
# API
cp apps/api/.env.example apps/api/.env.development

# Web
cp apps/web/.env.example apps/web/.env
```

## Development

### Available Scripts

```bash
# Development
pnpm dev                 # Start all apps
pnpm dev:api         # Start API only
pnpm dev:web        # Start web only

# Build
pnpm build               # Build all apps
pnpm build:api       # Build API only
pnpm build:web      # Build web only

# Testing
pnpm test                # Run all tests

# Database
pnpm db:generate         # Generate migrations
pnpm db:migrate          # Run migrations
pnpm db:push             # Push schema to DB
pnpm db:studio           # Open Drizzle Studio

# Code Quality
pnpm lint                # Lint all apps
pnpm format              # Format all apps
```

## Project Structure

### API (`apps/api`)

```
src/
├── config/              # Typed billing catalog and checkout configuration
├── database/            # Database client and Drizzle schemas
├── errors/              # Application errors and stable codes
├── lib/                 # Authentication, Stripe client, and logging
├── repositories/        # Database access
├── routes/              # Billing and session tRPC procedures
├── schemas/             # Request and response validation
├── services/            # Billing behavior
├── test/                # Shared setup, fixtures, and provider mocks
├── trpc/                # Context, middleware, procedures, and root router
├── server.ts            # Express configuration
└── main.ts              # Entry point
```

### Web (`apps/web`)

```
src/
├── app/                 # Providers, router construction, global styles
├── routes/              # Thin TanStack route adapters and guards
├── pages/               # Route-level page slices
├── features/            # Reused user interactions
└── shared/              # API, auth, config, generic libraries and UI
```

## Documentation

- [Feature Specifications](./docs/features/)
- [API Conventions](./docs/api/conventions.md)
- [Web Architecture](./docs/architecture/frontend-feature-sliced-design.md)
- [tRPC Migration Plan](./docs/architecture/trpc-migration.md)
- [Roadmap](./docs/ROADMAP.md)

## License

ISC
