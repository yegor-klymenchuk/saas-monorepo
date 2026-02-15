# @pricing/contracts

Shared API contracts using ts-rest for type-safe communication between frontend and backend.

## Overview

This package contains all API contracts that define the interface between the frontend and backend applications. Using [ts-rest](https://ts-rest.com/), we ensure full type-safety across the entire stack.

## Usage

### In Backend (Server)

```typescript
import { sessionContract } from '@pricing/contracts';
import { initServer } from '@ts-rest/express';

const s = initServer();

const router = s.router(sessionContract, {
  getSession: async ({ req }) => {
    // Your implementation
    return {
      status: 200,
      body: {
        user: { /* ... */ },
        session: { /* ... */ }
      }
    };
  }
});
```

### In Frontend (Client)

```typescript
import { sessionContract } from '@pricing/contracts';
import { initClient } from '@ts-rest/core';

const client = initClient(sessionContract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {}
});

// Fully typed request and response
const { status, body } = await client.getSession();
```

## Available Contracts

- **sessionContract**: User session management endpoints

## Development

### Build

```bash
pnpm run build
```

### Clean

```bash
pnpm run clean
```

## Adding New Contracts

1. Create a new file in `src/` (e.g., `user.contract.ts`)
2. Define your contract using `initContract()` from `@ts-rest/core`
3. Export the contract from `src/index.ts`
4. Run `pnpm run build` to compile

## Documentation

- [ts-rest Documentation](https://ts-rest.com/)
- [Contract Overview](https://ts-rest.com/contract/overview)
