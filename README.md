# Pricing Intelligence Platform

AI-powered SaaS pricing intelligence platform for optimizing pricing strategies.

## Monorepo Structure

```
.
├── apps/
│   ├── backend/          # Express API server and tRPC application router
│   └── frontend/         # React + TanStack Start
├── docs/                 # Feature specs & documentation
└── docker-compose.yml    # PostgreSQL + Redis
```

## Tech Stack

### Backend

- **Runtime**: Node.js 20+
- **Framework**: Express
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Queue**: BullMQ + Redis
- **Language**: TypeScript

### Frontend

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
pnpm dev:backend   # http://localhost:4000
pnpm dev:frontend  # http://localhost:3000
```

### Environment Setup

Copy `.env.example` files in each app and configure:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env.development

# Frontend
cp apps/frontend/.env.example apps/frontend/.env
```

## Development

### Available Scripts

```bash
# Development
pnpm dev                 # Start all apps
pnpm dev:backend         # Start backend only
pnpm dev:frontend        # Start frontend only

# Build
pnpm build               # Build all apps
pnpm build:backend       # Build backend only
pnpm build:frontend      # Build frontend only

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

### Backend (`apps/backend`)

```
src/
├── database/
│   └── schema/          # Drizzle schemas
├── errors/              # ApplicationError and global category errors
├── modules/             # Domain-oriented backend slices
│   └── example/
│       ├── example.repository.ts # Database access
│       ├── example.service.ts    # Application behavior
│       ├── example.router.ts     # tRPC transport boundary
│       └── errors/               # Module-specific application errors
├── middlewares/         # Express middlewares
├── trpc/                # Context, errors, middlewares, procedures and router
├── utils/               # Shared utilities
└── main.ts              # Entry point
```

### Frontend (`apps/frontend`)

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
- [Frontend Architecture](./docs/architecture/frontend-feature-sliced-design.md)
- [tRPC Migration Plan](./docs/architecture/trpc-migration.md)
- [Roadmap](./docs/ROADMAP.md)

## License

ISC
