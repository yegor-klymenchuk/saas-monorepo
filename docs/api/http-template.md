# [Feature] API

> **Instructions:**
> - Remove this instruction block from your API document
> - This template assumes familiarity with [Conventions](./conventions.md) which defines standard patterns for errors, responses, data formats, and common response codes
> - Content marked with "Example:" is for illustration purposes only and should NOT be copied to your API document
>
> **Documentation Conventions:**
>
> **TypeScript Structures:**
> - MUST use TypeScript syntax for all request/response structures
> - SHOULD include comments for complex fields
> - MUST match actual API response structure
>
> **Query Parameters:**
> - MUST specify type (string, number, boolean, etc.)
> - MUST specify if optional or required
> - SHOULD include description of purpose and valid values
>
> **Response Codes:**
> - MUST include all possible response codes for each endpoint
> - SHOULD include brief description of when each occurs (e.g., "Invalid query parameters" not just "Bad Request")
> - Standard codes (200, 400, 401, 403, 404, 422, 500) are defined in API Conventions
> - Only document endpoint-specific variations or additional context
> - Include **401 Unauthorized** if endpoint requires authentication with message: "Missing or invalid authentication credentials"
>
> **Error Responses:**
> - Generic error responses are defined in API Conventions and should NOT be repeated in individual endpoint specs
> - ONLY include an "Error Response" section if the endpoint returns a structure that differs from the generic format
> - When using standard error format, note "See API Conventions for error response structure"

---

# [Feature] API

> **Template:** [HTTP API Template](./http-template.md)

---

## Document Purpose

**This spec defines:**
- Endpoint paths, methods, and purposes
- Request/response structures and data types
- Query parameters, path parameters, and request bodies
- Success and error response formats
- Authorization and role-based access rules
- Data validation rules that affect the API contract

**This spec does NOT define:**
- Implementation details (database queries, business logic internals, concurrency handling)
- Performance and infrastructure concerns (optimization strategies, rate limiting, caching, load balancing)
- Client-side behavior (how UIs should render data, state management)
- Generic error response structures (defined in API Conventions)

---

API endpoints for [feature description].

---

## Related API

**Purpose:** Declare all external API specifications this feature depends on or references. Once listed here, reference their endpoints freely throughout this spec without repeating links.

**Format:**
- List each related API as a link to its specification document
- Include a brief one-line description of how it's used
- Once declared here, reference endpoints from that API freely in this spec
- If this API has no dependencies, write "None - this API operates independently" or omit this section

**Example:**
- [Conventions](../conventions.md) - Defines common ID formats, date/time formats, and error response structures
- [Users HTTP API](../users/users.http.md) - Provides `/api/users?role=reviewer` endpoint for discovering assignee IDs
- [Cursor Pagination](../cursor-pagination.http.md) - Defines pagination parameters and response structure used by all list endpoints

---

## GET `/api/[resource]`

Description of what this endpoint does.

**Query Parameters:**

Format: `paramName` (type, optional/required) - Description

Examples:
- `status` (string, optional) - Filter by status. Values: `active`, `disabled`, `archived`
- `limit` (number, optional) - Maximum items to return. Default: 20, Max: 100
- `page` (number, required) - Page number for pagination

**Default Behavior:**
- Sort: [Describe default sorting behavior] (e.g., Alphabetically by name (A-Z), By creation date descending)
- Filters: [Describe default filter state] (e.g., No filters applied by default, Shows active items only)

**Response (200):**

```typescript
{
  // response structure
  id: string;
  name: string;
  createdAt: string; // ISO 8601 timestamp
}
```

**Response Codes:**
- **200 OK** - Successful request
- **400 Bad Request** - Invalid query parameters (e.g., limit exceeds maximum)
- **401 Unauthorized** - Missing or invalid authentication credentials *(if endpoint requires authentication)*
- **404 Not Found** - Resource not found *(if applicable)*

**Error Response:** *(only include if different from API Conventions)*

[Descriptive label for non-generic error case]:
```typescript
{
  code: "VALIDATION_ERROR",
  message: "Invalid fields",
  fields: {
    email: "Invalid email format",
    age: "Must be 18 or older"
  }
}
```

---

## POST `/api/[resource]`

Description of what this endpoint does.

**Request Body:**

Specify which fields are required vs optional and include validation rules.

```typescript
{
  name: string; // Required. Max 100 characters
  email?: string; // Optional. Must be valid email format
  metadata?: {
    // Optional nested object
    key: string;
    value: string;
  };
}
```

**Response (200):**

```typescript
{
  // response structure
  id: string;
  name: string;
  email?: string;
  createdAt: string;
}
```

**Response Codes:**
- **200 OK** - Resource created successfully
- **400 Bad Request** - Invalid request body or validation failure
- **401 Unauthorized** - Missing or invalid authentication credentials *(if endpoint requires authentication)*
- **409 Conflict** - Resource already exists *(if applicable)*
- **422 Unprocessable Entity** - Valid syntax but semantic errors *(if applicable)*

---

## PUT/PATCH `/api/[resource]/{id}`

Description of what this endpoint does.

**Path Parameters:**
- `id` (string, required) - Unique identifier of the resource

**Request Body:**

```typescript
{
  // fields to update
  name?: string;
  status?: "active" | "disabled";
}
```

**Response (200):**

```typescript
{
  // updated resource structure
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}
```

**Response Codes:**
- **200 OK** - Resource updated successfully
- **400 Bad Request** - Invalid request body
- **401 Unauthorized** - Missing or invalid authentication credentials *(if endpoint requires authentication)*
- **404 Not Found** - Resource with specified ID not found

---

## DELETE `/api/[resource]/{id}`

Description of what this endpoint does.

**Path Parameters:**
- `id` (string, required) - Unique identifier of the resource to delete

**Response (204):**

No content returned on successful deletion.

**Response Codes:**
- **204 No Content** - Resource deleted successfully
- **401 Unauthorized** - Missing or invalid authentication credentials *(if endpoint requires authentication)*
- **404 Not Found** - Resource with specified ID not found
- **409 Conflict** - Resource cannot be deleted due to dependencies *(if applicable)*

---

## POST `/api/[resource]/bulk-[action]`

Description of bulk operation endpoint. (e.g., Disable multiple active users at once)

> **Note:** Follow [Bulk Operations](../bulk-operations.md) conventions for request/response structures.

**Request Body:**

```typescript
{
  [resource]Ids: string[]; // Array of resource IDs. Must not be empty. All IDs must be valid UUIDs.
}
```

**Example:**
```typescript
{
  userIds: ["550e8400-e29b-41d4-a716-446655440000", "660e8400-e29b-41d4-a716-446655440001"]
}
```

**Response (200 OK):** All operations completed successfully

```typescript
{
  success: true;
  successCount: number;
  items: [
    {
      id: string;
      // ... operation-specific fields (e.g., status, updatedAt, archivedAt)
    }
  ];
}
```

**Response (207 Multi-Status):** Partial success - some items succeeded, some failed

```typescript
{
  success: false;
  successCount: number;
  failedCount: number;
  results: [
    {
      id: string;
      success: true;
      // ... operation-specific success fields
    },
    {
      id: string;
      success: false;
      error: string;
      statusCode: number;
    }
  ];
}
```

**Response Codes:**
- **200 OK** - All operations completed successfully
- **207 Multi-Status** - Partial success (some items succeeded, some failed - check individual results)
- **400 Bad Request** - Invalid request structure (e.g., empty array, invalid ID format)
- **401 Unauthorized** - Missing or invalid authentication credentials *(if endpoint requires authentication)*
- **403 Forbidden** - User does not have permission to perform this bulk operation *(if applicable)*

---
