# Stripe Integration

> **Template:** [Feature Template](../feature-template.md)

---

## Document Purpose

**This spec defines:**
- What the Stripe integration does and why
- Core concepts and terminology
- User roles and access control
- Business rules and constraints
- Available capabilities and actions
- Connection workflows

**This spec does NOT define:**
- UI/UX design or interaction patterns
- Technical implementation or architecture
- API contracts, schemas, or performance requirements

---

Stripe Integration enables users to connect their Stripe accounts via OAuth to fetch billing data, subscriptions, and customer information in real-time for pricing analysis and recommendations.

---

## Terms

### Exported

- `StripeConnectionStatus` - Current state of Stripe account connection
  - Values: `connected`, `disconnected`

### Imported

None

---

## Core Concepts

### `StripeConnectionStatus`

Defines the current state of a user's Stripe account connection.

#### `connected`
Stripe account successfully connected and authorized. User can fetch billing data via Stripe SDK.

#### `disconnected`
No Stripe account is connected, or connection has been revoked. User needs to initiate OAuth flow to connect.

---

## Access Control

| Access Subject | All authenticated users |
|----------------|------------------------|
| Connect Stripe account | ✓ |
| View own connection status | ✓ |
| View billing data | ✓ (when `StripeConnectionStatus` is `connected`) |
| Disconnect Stripe account | ✓ |

---

## Workflow

### `disconnected` → `connected`
- User clicks "Connect Stripe" button
- System initiates Stripe OAuth flow
- User is redirected to Stripe authorization page
- User authorizes access on Stripe
- Stripe redirects back with authorization code
- System exchanges code for access token and stores it
- → `StripeConnectionStatus` changes to `connected`
- → User can now view billing data
- Triggered by any authenticated user

### `connected` → `disconnected`
- User manually disconnects account via settings
- User revokes access in Stripe dashboard (token becomes invalid)
- System detects invalid token during API call
- → `StripeConnectionStatus` changes to `disconnected`
- → User prompted to reconnect if they try to access billing data

---

## Discovery & Display

### Connection Status

Shows current Stripe connection status.

#### Displayed Data
- Current `StripeConnectionStatus`
- Connected Stripe account identifier (when `connected`)
- Connection date (when `connected`)

#### Default State
- Shows `disconnected` status for new users
- Displays "Connect Stripe" call-to-action

### Billing Metrics Dashboard

Displays billing data fetched in real-time from Stripe SDK.

#### Displayed Data
- Monthly Recurring Revenue (MRR) per plan
- Customer count per plan
- Average Revenue Per User (ARPU)
- Active subscriptions list
- Plan distribution chart
- Current pricing plans from Stripe

#### Default State
- Empty state with "Connect Stripe" call-to-action if `StripeConnectionStatus` is `disconnected`
- Loading state while fetching data from Stripe API

---

## Capabilities

| Capability | All authenticated users |
|------------|------------------------|
| Connect Stripe account via OAuth | ✓ |
| Disconnect Stripe account | ✓ (when `StripeConnectionStatus` is `connected`) |
| View billing metrics | ✓ (when `StripeConnectionStatus` is `connected`) |
| Refresh billing data | ✓ (when `StripeConnectionStatus` is `connected`) |

---

## Business Rules

### Connection Rules
- Only one Stripe account can be connected per user
- OAuth must request read-only permissions for billing data
- Connection requires valid Stripe account

### Data Fetching
- Billing data is fetched in real-time from Stripe API when user views dashboard
- Data refresh can be triggered manually by user
- Stripe SDK handles all API communication
- Rate limits are managed by Stripe SDK

### Error Handling
- Invalid or expired token automatically sets `StripeConnectionStatus` to `disconnected`
- User prompted to reconnect when token is invalid
- API errors are displayed with user-friendly messages
- Stripe API rate limits are respected

### Security Rules
- OAuth access token stored securely (encrypted)
- Token never exposed to client-side code
- All Stripe API calls made server-side only
- HTTPS required for OAuth callback

### Validation Rules
- Cannot view billing data when `StripeConnectionStatus` is `disconnected`
- OAuth callback must include valid authorization code and state parameter
- State parameter validated to prevent CSRF attacks
