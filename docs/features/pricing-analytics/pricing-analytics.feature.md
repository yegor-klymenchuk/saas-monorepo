# Pricing Analytics Dashboard

> **Template:** [Feature Template](../feature-template.md)

---

## Document Purpose

**This spec defines:**
- What the pricing analytics dashboard does and why
- Core concepts and terminology
- User roles and access control
- Business rules and constraints
- Available capabilities and actions
- Data visualization and metrics

**This spec does NOT define:**
- UI/UX design or interaction patterns
- Technical implementation or architecture
- API contracts, schemas, or performance requirements

---

Pricing Analytics Dashboard provides comprehensive visualization and analysis of billing metrics, competitor pricing, and revenue trends to help users make data-driven pricing decisions.

---

## Terms

### Exported

- `MetricPeriod` - Time range for metric calculations
  - Values: `last7Days`, `last30Days`, `last90Days`, `lastYear`, `allTime`, `custom`
- `MetricType` - Category of pricing metric
  - Values: `revenue`, `customers`, `arpu`, `churn`, `conversion`, `planDistribution`
- `ChartType` - Visualization format for data
  - Values: `line`, `bar`, `pie`, `table`

### Imported

- `StripeConnectionStatus` - from [Stripe Integration](../stripe-integration/stripe-integration.feature.md#terms)
  - Values: `connected`
- `CompetitorStatus` - from [Competitor Tracking](../competitor-tracking/competitor-tracking.feature.md#terms)
  - Values: `active`

---

## Core Concepts

### `MetricPeriod`

Defines the time range for calculating and displaying metrics.

#### `last7Days`
Shows data from the past 7 days. Useful for recent trends and immediate impact analysis.

#### `last30Days`
Shows data from the past 30 days. Standard view for monthly performance tracking.

#### `last90Days`
Shows data from the past 90 days. Useful for quarterly trends and seasonal patterns.

#### `lastYear`
Shows data from the past 12 months. Annual performance and year-over-year comparisons.

#### `allTime`
Shows all available historical data since account connection. Complete historical view.

#### `custom`
User-defined date range. Allows specific period analysis.

### `MetricType`

Categories of pricing and revenue metrics tracked by the system.

#### `revenue`
Monthly Recurring Revenue (MRR), total revenue, revenue by plan, revenue trends over time.

#### `customers`
Total customer count, new customers, churned customers, customer growth rate, customers by plan.

#### `arpu`
Average Revenue Per User. Calculated as MRR divided by total active customers.

#### `churn`
Customer churn rate and revenue churn rate. Percentage of customers or revenue lost in period.

#### `conversion`
Free to paid conversion rate, trial to paid conversion rate, upgrade rate between tiers.

#### `planDistribution`
Distribution of customers and revenue across pricing plans. Shows tier adoption patterns.

### `ChartType`

Visualization formats available for displaying metrics.

#### `line`
Time-series line chart. Best for showing trends over time (revenue growth, customer count).

#### `bar`
Bar chart. Best for comparing discrete values (revenue by plan, customers by tier).

#### `pie`
Pie chart. Best for showing proportional distribution (plan distribution, revenue split).

#### `table`
Tabular data view. Best for detailed numerical data and exports.

---

## Access Control

| Access Subject | All authenticated users |
|----------------|------------------------|
| View all analytics dashboards | ✓ |
| View revenue metrics | ✓ (requires Stripe connection) |
| View competitor comparisons | ✓ (requires active competitors) |
| Export analytics data | ✓ |
| Customize dashboard views | ✓ |
| Set metric period | ✓ |

---

## Workflow

This feature does not define workflows. It provides visualization and analysis interfaces for data managed by Stripe Integration and Competitor Tracking features.

---

## Discovery & Display

### Main Analytics Dashboard

Primary view showing key pricing metrics and trends.

#### Filters
- Period: `last7Days`, `last30Days`, `last90Days`, `lastYear`, `allTime`, `custom`
- Metric type: `revenue`, `customers`, `arpu`, `churn`, `conversion`, `planDistribution`

#### Displayed Data
- Current MRR with month-over-month change percentage
- Total active customers with growth rate
- ARPU with trend indicator
- Monthly churn rate
- Revenue trend chart (`line` chart for selected `MetricPeriod`)
- Customer growth chart (`line` chart)
- Plan distribution chart (`pie` chart showing revenue by plan)
- Recent metrics summary table

#### Default State
- Shows `last30Days` period by default
- Displays all `MetricType` categories
- Empty state with call-to-action if `StripeConnectionStatus` is not `connected`

### Revenue Analytics

Detailed revenue breakdown and analysis.

#### Filters
- Period: `last7Days`, `last30Days`, `last90Days`, `lastYear`, `allTime`, `custom`
- Plan filter: All plans or specific plan selection

#### Displayed Data
- Total MRR and trend
- MRR by plan (`bar` chart)
- Revenue growth rate
- New MRR (from new customers)
- Expansion MRR (from upgrades)
- Churned MRR (from cancellations)
- Net MRR movement
- Revenue timeline (`line` chart)

#### Default State
- Shows `last90Days` period
- All plans included

### Customer Analytics

Customer metrics and cohort analysis.

#### Filters
- Period: `last7Days`, `last30Days`, `last90Days`, `lastYear`, `allTime`, `custom`
- Plan filter: All plans or specific plan selection

#### Displayed Data
- Total active customers
- New customers in period
- Churned customers in period
- Customer growth rate
- Customers by plan (`bar` chart)
- Customer acquisition trend (`line` chart)
- Churn rate by plan
- Customer lifetime value (LTV) estimate

#### Default State
- Shows `last90Days` period
- All plans included

### Competitor Comparison

Side-by-side pricing comparison with market positioning.

#### Filters
- Select specific competitors for comparison
- Plan tier mapping (match your plans to competitor plans)

#### Displayed Data
- Your pricing vs competitor average
- Price positioning chart (below/at/above market)
- Plan-by-plan comparison table
- Feature comparison (if available)
- Market percentile indicator
- Price gap analysis with recommendations

#### Default State
- Shows all competitors with `CompetitorStatus` of `active`
- Displays current prices (most recent scrape)
- Empty state if no competitors tracked

### Plan Performance

Analysis of individual pricing plan performance.

#### Filters
- Select specific plan
- Period: `last7Days`, `last30Days`, `last90Days`, `lastYear`, `allTime`, `custom`

#### Displayed Data
- Plan name and current price
- Customer count on plan
- MRR from plan
- Percentage of total revenue
- Percentage of total customers
- Conversion rate to this plan
- Churn rate for this plan
- Average customer lifetime on plan
- Upgrade/downgrade patterns

---

## Capabilities

| Capability | All authenticated users |
|------------|------------------------|
| View all analytics dashboards | ✓ |
| Change `MetricPeriod` filter | ✓ |
| Filter by specific plans | ✓ |
| Switch between `ChartType` views | ✓ |
| Export metrics to CSV | ✓ |
| Export charts as images | ✓ |
| Set custom date ranges | ✓ |
| Customize dashboard layout | ✓ (saved per user) |
| Compare multiple time periods | ✓ |
| View metric definitions and calculations | ✓ |

---

## Business Rules

### Data Requirements
- Revenue metrics require `StripeConnectionStatus` of `connected`
- Competitor comparisons require at least 1 competitor with `CompetitorStatus` of `active`
- Minimum 7 days of data required for trend calculations
- Minimum 30 days of data required for churn rate accuracy

### Metric Calculations

#### MRR (Monthly Recurring Revenue)
- Sum of all active subscription values normalized to monthly amount
- Annual subscriptions divided by 12
- Calculated from most recent Stripe sync

#### ARPU (Average Revenue Per User)
- Total MRR divided by total active customers
- Calculated at end of each day
- Excludes trial and cancelled customers

#### Churn Rate
- (Customers lost in period / Customers at start of period) × 100
- Calculated monthly
- Minimum 30 days of data required

#### Conversion Rate
- (Converted customers / Total trial starts) × 100
- Calculated for selected `MetricPeriod`
- Minimum 14 days of data recommended

#### Growth Rate
- ((Current value - Previous value) / Previous value) × 100
- Calculated for selected `MetricPeriod`
- Compared to equivalent previous period

### Data Freshness
- All metrics update after daily Stripe sync (2:00 AM UTC)
- Competitor data updates after daily scrape (3:00 AM UTC)
- Manual sync triggers immediate metric recalculation
- Dashboard shows timestamp of last data update
- Stale data warning if metrics are >48 hours old

### Visualization Rules
- `line` charts require minimum 3 data points
- `pie` charts show maximum 10 segments (others grouped as "Other")
- `bar` charts limited to 20 bars (use pagination for more)
- Charts automatically adjust scale based on data range
- Zero values displayed but noted in tooltips

### Export Rules
- CSV exports include all filtered data (no pagination limits)
- Exports include metadata: date range, filters applied, export timestamp
- Chart image exports in PNG format at 1200×800 resolution
- Maximum export size: 100,000 rows

### Performance Rules
- Dashboard loads with cached data (updated after sync)
- Custom date ranges limited to maximum 2 years
- Heavy calculations (LTV, cohorts) cached for 24 hours
- Real-time calculations only for current day metrics

### Validation Rules
- Cannot select `custom` date range with end date before start date
- Cannot select future dates in `custom` range
- Cannot filter by plans that don't exist in data
- Cannot compare more than 5 competitors simultaneously (performance limit)

### Display Rules
- All currency values displayed in user's Stripe account currency
- Percentages rounded to 1 decimal place
- Large numbers abbreviated (1.2K, 3.5M) in charts, full in tables
- Negative trends shown in red, positive in green, neutral in gray
- Empty states provide clear call-to-action (connect Stripe, add competitors)
