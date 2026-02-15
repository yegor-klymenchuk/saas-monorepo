# API Conventions

Common conventions and standards for API contracts in the CA application.

---

## Shared Conventions

These conventions apply to both HTTP and WebSocket contracts.

### ID Format

All entity IDs use **UUID v4 format**.

**Format:** `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**Example:** `550e8400-e29b-41d4-a716-446655440000`

---

### Timestamps

All timestamps use **ISO 8601 UTC format**.

**Format:** `YYYY-MM-DDTHH:mm:ssZ`

**Example:** `2024-01-15T10:30:00Z`

**Date-Only Values:**

Some parameters accept date-only values (no time component).

**Format:** `YYYY-MM-DD`

**Example:** `2024-01-15`

**Interpretation:** Date-only values represent the full day in UTC (00:00:00Z to 23:59:59Z). Date ranges are inclusive on both ends.

---

### Null Values

Nullable fields are explicitly typed as `type | null` in TypeScript definitions.

**Example:**
```typescript
{
  firstName: string | null,
  assignee: { id: string, name: string } | null
}
```

---

### Default Sorting

When sorting behavior is not specified in a request:

**Alphabetical Lists:**
- Primary: First name (A-Z)
- Secondary: Last name (A-Z)

**Temporal Lists:**
- Most recent first (descending by creation date)

**Feature-Specific:**
- See individual feature documentation for domain-specific defaults

---

## HTTP Conventions

### Error Response Structure

```typescript
{
  error: string,      // Human-readable error message
  statusCode: number, // HTTP status code
  timestamp: string   // ISO 8601 UTC
}
```

**Example:**
```typescript
{
  error: "Case not found",
  statusCode: 404,
  timestamp: "2024-01-15T10:30:00Z"
}
```

### Validation Error Structure

When validation fails on specific fields:

```typescript
{
  error: string,
  statusCode: 400,
  timestamp: string,
  fields: {
    [fieldName]: string  // Field-specific error message
  }
}
```

**Example:**
```typescript
{
  error: "Validation failed",
  statusCode: 400,
  timestamp: "2024-01-15T10:30:00Z",
  fields: {
    email: "Invalid email format",
    assigneeId: "Must be a valid UUID"
  }
}
```

### Pagination

All list endpoints use cursor-based pagination. See [Cursor Pagination](./cursor-pagination.http.md).

### Bulk Operations

Bulk operation endpoints follow standard patterns for request/response structures. See [Bulk Operations](./bulk-operations.md).

---

## WebSocket Conventions

### Message Format

All WebSocket messages use this structure:

```typescript
{
  type: string,      // Event type identifier
  data: object,      // Event-specific payload
  timestamp: string  // ISO 8601 UTC (added by server)
}
```

**Example:**
```typescript
{
  type: "cases-updated",
  data: {
    items: [{
      id: "550e8400-e29b-41d4-a716-446655440000",
      assignee: { id: "...", firstName: "John", lastName: "Doe" },
      // ... other case fields
    }]
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

### Array-Based Event Structure

**Convention:** Events use array-based payloads to support both single and bulk operations efficiently.

#### Collection Channels (Plural Events)

Collection channels like `/ws/cases` or `/ws/users/reviewers` receive **plural events** with **array-based payloads**.

**Event Naming:** Event types use plural names (e.g., `cases-created`, `users-updated`, `cases-removed`) to reflect that they can contain multiple items.

**Structure Pattern:**
```typescript
{
  type: "items-created" | "items-updated" | "items-removed",
  data: {
    items: Array<ItemType>  // Or itemIds: string[] for lightweight events
  },
  timestamp: string
}
```

**Benefits:**

1. **Unified handling:** Clients process single and bulk operations with the same code path
2. **Efficiency:** One event for bulk operations instead of multiple individual events
3. **Consistency:** All events follow the same pattern regardless of operation size
4. **Scalability:** Reduces WebSocket message overhead for bulk operations

**Example - Single Item:**
```typescript
// Sent to /ws/cases
{
  type: "cases-updated",
  data: {
    items: [{
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "inProgress",
      // ... other fields
    }]
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

**Example - Multiple Items:**
```typescript
// Sent to /ws/cases
{
  type: "cases-updated",
  data: {
    items: [
      { id: "550e8400-...", status: "archived", ... },
      { id: "661f9511-...", status: "archived", ... },
      { id: "772fa622-...", status: "archived", ... }
    ]
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

#### ID-Specific Channels (Singular Events)

ID-specific channels like `/ws/cases/:id` or `/ws/users/reviewers/:id` receive **singular events** with **single-item payloads** (no array wrapper).

**Event Naming:** Event types use singular names (e.g., `case-updated`, `user-updated`, `user-removed`) to reflect that they contain a single item.

**Structure Pattern:**
```typescript
{
  type: "item-created" | "item-updated" | "item-removed",
  data: {
    // Item fields directly in data object (no items array)
    id: string,
    // ... other fields
  },
  timestamp: string
}
```

**Rationale:**

1. **Scope guarantee:** Channel path already specifies which item, so arrays are unnecessary
2. **Simplicity:** Clients don't need to iterate over single-item arrays
3. **Clarity:** Singular naming makes it explicit that only one item is affected
4. **Efficiency:** Slightly smaller payload without array wrapper

**Example - Update Event:**
```typescript
// Sent to /ws/users/reviewers/:id
{
  type: "user-updated",
  data: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    firstName: "John",
    lastName: "Doe",
    status: "active",
    // ... other fields directly in data
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

**Example - Remove Event:**
```typescript
// Sent to /ws/users/reviewers/:id
{
  type: "user-removed",
  data: {
    userId: "550e8400-e29b-41d4-a716-446655440000"
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

#### Event Routing

When an operation affects items:

1. **Plural events** are sent to collection channels with all affected items in an array
2. **Singular events** are sent to each affected item's ID-specific channel (if it exists)

**Example:** When a user is updated via `POST /api/users/:id/activate`:
- `/ws/users/reviewers` receives: `{ type: "users-updated", data: { items: [{...}] } }`
- `/ws/users/reviewers/:id` receives: `{ type: "user-updated", data: {...} }`

### Channel Paths

**Pattern:** `/ws/[resource]` or `/ws/[resource]/:id`

**Examples:**
- `/ws/cases` - All case events
- `/ws/cases/:id` - Specific case events
- `/ws/public/notifications` - Public notification channel

### Connection = Subscription

Connecting to a WebSocket channel automatically subscribes to events on that channel. No explicit subscribe/unsubscribe messages are required.

**Subscription:** Open connection to channel
**Unsubscription:** Close connection

### Authentication & Authorization

**Connection-Level:**
- Authentication is verified when establishing the WebSocket connection
- Invalid or expired credentials result in connection rejection
- Permission changes (e.g., role revocation) result in connection closure

**Event-Level:**
- Server filters events based on user permissions before sending
- Users only receive events they are authorized to see
- No error events are sent for permission violations - events are simply not delivered

### Server Events Only

WebSocket communication is **server→client only**:
- **No client→server events** - Clients cannot send commands via WebSocket
- **All operations via HTTP** - Use HTTP endpoints for CRUD operations
- **WebSocket for notifications** - Server pushes cache invalidation signals to notify clients when data becomes stale

---
