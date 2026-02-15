# Competitor Tracking

> **Template:** [Feature Template](../feature-template.md)

---

## Document Purpose

**This spec defines:**
- What competitor tracking does and why
- Core concepts and terminology
- User roles and access control
- Business rules and constraints
- Available capabilities and actions
- Scraping workflows and state transitions

**This spec does NOT define:**
- UI/UX design or interaction patterns
- Technical implementation or architecture
- API contracts, schemas, or performance requirements

---

Competitor Tracking enables users to monitor competitor pricing pages automatically, track price changes over time, and compare their own pricing against market benchmarks.

---

## Terms

### Exported

- `CompetitorStatus` - Current state of competitor tracking
  - Values: `active`, `paused`, `failed`, `archived`
- `ScrapingStatus` - Status of price scraping operation
  - Values: `pending`, `inProgress`, `completed`, `failed`
- `PriceChangeType` - Type of pricing change detected
  - Values: `increase`, `decrease`, `planAdded`, `planRemoved`, `featuresChanged`, `noChange`

### Imported

None

---

## Core Concepts

### `CompetitorStatus`

Defines the current tracking state of a competitor.

#### `active`
Competitor is being actively monitored. Daily scraping is enabled.

#### `paused`
Tracking temporarily stopped by user. No scraping occurs. Historical data preserved.

#### `failed`
Scraping consistently fails due to website changes, blocking, or invalid URL. User action required.

#### `archived`
Competitor removed from active tracking. Historical data preserved but no longer displayed in main views.

### `ScrapingStatus`

Tracks the status of individual scraping operations.

#### `pending`
Scrape scheduled but not yet started. Queued for execution.

#### `inProgress`
Actively fetching and parsing competitor pricing page.

#### `completed`
Scrape finished successfully. Price data extracted and stored.

#### `failed`
Scrape encountered errors (page structure changed, timeout, blocking). Error details logged.

### `PriceChangeType`

Categories of pricing changes detected between scrapes.

#### `increase`
One or more plan prices increased since last scrape.

#### `decrease`
One or more plan prices decreased since last scrape.

#### `planAdded`
New pricing plan detected that wasn't present before.

#### `planRemoved`
Previously tracked plan no longer found on pricing page.

#### `featuresChanged`
Plan features added, removed, or modified since last scrape. Price remains the same.

#### `noChange`
No pricing or feature changes detected since last scrape.

---

## Access Control

| Access Subject | All authenticated users |
|----------------|------------------------|
| View all tracked competitors | ✓ |
| View competitor pricing history | ✓ |
| View price comparison charts | ✓ |
| View price change alerts | ✓ |

---

## Workflow

### Adding Competitor: `—` → `active`
- User provides competitor name and pricing page URL
- System validates URL accessibility
- Initial scrape is triggered immediately
- → Sets `ScrapingStatus` to `pending`
- Triggered by any authenticated user

### `active` → `inProgress`
- Daily automatic scrape triggers at scheduled time
- User manually requests immediate scrape
- → Sets `ScrapingStatus` to `inProgress`

### `inProgress` → `active`
- Scrape completes successfully
- Price data extracted and stored as new snapshot
- → Updates `ScrapingStatus` to `completed`
- → Analyzes for `PriceChangeType`
- → Sends notification if price change detected

### `inProgress` → `failed`
- Scrape encounters errors (timeout, parsing failure, blocked)
- Error details logged for debugging
- → Updates `ScrapingStatus` to `failed`
- → Retries up to 3 times before marking competitor as `failed`

### `active` → `failed`
- Three consecutive scraping attempts fail
- Website structure changed significantly
- URL becomes inaccessible
- → User notified to review competitor configuration

### `failed` → `active`
- User updates competitor URL or configuration
- Manual scrape succeeds
- → Resumes daily automatic scraping

### `active` → `paused`
- User manually pauses tracking
- Daily scraping stops
- Historical data preserved
- Triggered by authenticated user

### `paused` → `active`
- User resumes tracking
- → Triggers immediate scrape to catch up
- Daily scraping resumes

### `active` → `archived`
- User removes competitor from tracking
- → Stops all scraping
- → Hides from main competitor list
- Historical data preserved for reference

### `archived` → `active`
- User restores archived competitor
- → Triggers immediate scrape
- Resumes daily tracking

---

## Discovery & Display

### Competitor List

Main listing of all tracked competitors.

#### Filters
- Status: `active`, `paused`, `failed`, `archived`
- Recent changes: Last 7 days, Last 30 days, All time

#### Search
- Competitor name
- Pricing page URL

#### Sorting
- Primary: Competitor name (alphabetical)
- Secondary: Last scraped date (most recent first)

#### Displayed Data
- Competitor name
- Current `CompetitorStatus`
- Last successful scrape timestamp
- Number of pricing plans tracked
- Most recent `PriceChangeType` (if any)
- Quick comparison: lowest and highest plan prices

#### Default State
- Shows all competitors with `CompetitorStatus` of `active` by default
- Sorted by most recently scraped

### Competitor Detail View

Detailed pricing information for a single competitor.

#### Displayed Data
- Competitor name and pricing page URL
- Current `CompetitorStatus` and `ScrapingStatus`
- All pricing plans with current prices
- Price history chart (last 90 days)
- List of detected price changes with dates
- Plan features (if extracted)

### Price Comparison View

Side-by-side comparison of user's pricing vs competitors.

#### Filters
- Select specific competitors to compare
- Date range for historical comparison

#### Displayed Data
- User's pricing plans (from Stripe integration)
- Selected competitors' pricing plans
- Price difference calculations and percentages
- Visual highlighting of price gaps
- Market position indicator (below average, average, above average)

#### Default State
- Shows all `active` competitors
- Displays current prices (most recent scrape)

---

## Capabilities

| Capability | All authenticated users |
|------------|------------------------|
| Add competitor (provide name and URL) | ✓ |
| Edit competitor details (name, URL) | ✓ |
| Change `CompetitorStatus` to `paused` | ✓ |
| Change `CompetitorStatus` to `active` from `paused` | ✓ |
| Change `CompetitorStatus` to `archived` | ✓ |
| Restore competitor from `archived` to `active` | ✓ |
| Trigger manual scrape | ✓ (when `CompetitorStatus` is `active` or `paused`) |
| View price history | ✓ |
| Export competitor data to CSV | ✓ |
| Compare multiple competitors | ✓ |

---

## Business Rules

### Competitor Limits
- Free tier: Maximum 1 competitor tracked
- Pro tier: Unlimited competitors tracked
- Cannot add duplicate competitor URLs

### Scraping Rules
- Automatic daily scrape runs at 3:00 AM UTC
- Manual scrape can only be triggered once every 30 minutes per competitor
- Failed scrapes retry automatically up to 3 times with 5-minute delays
- After 3 consecutive failures, `CompetitorStatus` changes to `failed`

### URL Validation
- Must be valid HTTPS URL
- Must be publicly accessible (no authentication required)
- Must return HTTP 200 status code
- Recommended to be dedicated pricing page

### Price Change Detection
- Compares current scrape with previous successful scrape
- Changes detected at plan level (price and features)
- Minimum 5% price difference to trigger `increase` or `decrease` notification
- Feature changes trigger `featuresChanged` when features are added, removed, or modified
- New plans must exist in 2 consecutive scrapes to avoid false positives

### Data Retention
- All price snapshots preserved indefinitely
- Minimum 1 snapshot per day when `CompetitorStatus` is `active`
- Historical data preserved when competitor is `paused` or `archived`

### Error Handling
- When `ScrapingStatus` is `failed`, specific error message is shown
- Common errors: "Page structure changed", "URL not accessible", "Timeout", "Blocked by website"
- User can update URL or configuration to resolve `failed` status

### Data Freshness
- Competitors with data older than 48 hours show "stale data" warning
- Manual scrape button prominently displayed for stale competitors
- All changes to competitor data are immediately visible to the user

### Scraping Limits
- Maximum 50 competitors can be scraped per day (rate limiting)
- Individual scrape timeout: 30 seconds
- Respects robots.txt and rate limiting best practices
