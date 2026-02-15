# Feature Template

> **Instructions:**
> - Replace all `[placeholders]` with actual content
> - Remove this instruction block from your feature document
>
> **Reference Rules (apply when writing your feature document):**
>
> - MUST use backticks for all term references
> - MUST qualify enum values with their enum type: `EnumType` is `value`
> - NEVER use bare enum values in backticks without enum type context
> - First reference in a section MUST be explicit with both enum type and value
> - Subsequent references in the same context may be shorter if unambiguous
>
> **Cross-Document References:**
>
> - References to other documents are ONLY allowed through Terms import/export
> - DO NOT link to other documents outside of the Terms section
>
> **Examples:**
> ```
> ✅ When `UserState` transitions to `archived`
> ✅ Cases with `CompletionStatus` of `inProgress`
> ✅ User has `UserRole` of `manager`
>
> ❌ When user is `archived` (missing enum type)
> ❌ Cases that are `inProgress` (missing enum type)
> ❌ User is a `manager` (missing enum type)
> ❌ See [Case](../case/case.feature.md) for more details (link outside Terms section)
> ❌ See [Sorting Specification](../shared/sorting.md) for rules (link outside Terms section)
> ```

---

# [Feature Name]

> **Template:** [Feature Template](./feature-template.md)

---

## Document Purpose

**This spec defines:**
- What the feature does and why
- Core concepts and terminology
- User roles and access control
- Business rules and constraints
- Available capabilities and actions
- Workflows and state transitions

**This spec does NOT define:**
- UI/UX design or interaction patterns
- Technical implementation or architecture
- API contracts, schemas, or performance requirements

---

[2-3 sentences: What this feature does and why it exists]

**Example:** User Management controls system access through role-based permissions and lifecycle states.

---

## Terms

**General Rules (applies to both Exported and Imported):**
- MUST use backticks for term names
- MUST use PascalCase for term names (no spaces): `UserState`, `CompletionStatus`
- MUST use camelCase for enumeration values (no spaces): `active`, `inProgress`
- SHOULD include possible values for enumerations
- Individual enum values are NOT terms - only the enumeration type is a term

**Cross-Document Reference Rules:**
- This is the ONLY section where links to other documents are allowed (via Imported terms)

### Exported

Terms defined by this feature (source of truth):

**Format:**
```
- `TermName` - Brief definition
  - Values: `value1`, `value2`, `value3` (for enumerations)
```

**Rules:**
- MUST list all terms this feature owns

**Example:**
- `UserState` - Lifecycle status of a user
  - Values: `invited`, `active`, `disabled`, `archived`
- `UserRole` - Permission level and capabilities
  - Values: `reviewer`, `manager`, `admin`

### Imported

Terms and notifications used from other features:

**Format for Terms:**
```
- `TermName` - from [Feature Name](path/to/feature.md#terms)
  - Values: `value1`, `value2` (which values this feature references)
```

**Format for Notifications:**
```
- `notification-template-id` - from [Notification Templates](../notification/notification-templates.md#notification-template-id)
```

**Rules:**
- MUST list all external terms used in this document
- MUST link to source feature's Terms section
- MUST list which enumeration values this feature references (makes dependencies explicit)
- MUST list all notification templates used by this feature
- MUST link to the notification template definition in the Notifications registry
- DO NOT redefine imported terms or notifications

**Example:**
- `CaseStatus` - from [Case](../case/case.feature.md#terms)
  - Values: `archived`, `inProgress`
- `AssignmentStatus` - from [Case Assignment](../case-assignment/case-assignment.feature.md#terms)
  - Values: `assigned`, `unassigned`
- `user-disabled-notification` - from [Notification Templates](../notification/notification-templates.md#user-disabled-notification)
- `invitation-email` - from [Notification Templates](../notification/notification-templates.md#invitation-email)

---

## Core Concepts

Define terms listed in "Exported" section above.

**Rules:**
- MUST define only exported terms (not imported)
- SHOULD organize as subsections with term as heading
- MAY reference imported terms

**Structure:**
```
### `ExportedTermName`

[Definition and explanation]

#### `enumValue` (for enumeration members)
[Details about this specific state/value]
```

**Example:**

### `UserState`

Defines the lifecycle status of a user in the system.

#### `invited`
User has been invited but not yet activated. Cannot access system. See Invitation feature for activation process.

#### `active`
Full access based on `UserRole`. Standard working state for users.

#### `disabled`
Temporarily revoked access. Expected to return to `active` status.

#### `archived`
Permanently removed. Data preserved for audit. Cannot return to `active` without explicit unarchive action.

---

## Access Control

Define visibility and access by role.

**Rules:**
- MUST use table format with roles as columns and access subjects as rows
- Use exported role terms for column headers
- Focus on what users CAN see/access (not actions)
- Use checkmarks (✓) for allowed access, dashes (—) for denied access, or descriptive text for conditional access

**Structure:**
```
| Access Subject   | `roleName1`            | `roleName2`         | `roleName3` |
|------------------|------------------------|---------------------|-------------|
| View all users   | ✓                      | —                   | —           |
| View own profile | ✓                      | ✓                   | ✓           |
| Access feature X | Description of access  | Conditional access  | —           |
```

**Example:**

| Access Subject | `admin` | `manager` | `reviewer` |
|----------------|---------|-----------|------------|
| View all users in any `UserState` | ✓ | — | — |
| View users in assigned teams | ✓ | ✓ | — |
| View users with `UserState` of `active` and `disabled` | ✓ | ✓ | — |
| View own profile | ✓ | ✓ | ✓ |
| Access all system features | ✓ | — | — |

---

## Workflow

Define state transitions, processes, or phases.

**Rules:**
- Use arrows for transitions: `enumValue` → `enumValue`
- Use symbols: `→` (triggers), `←` (requires)
- Note cross-feature impacts
- If feature does NOT define workflows, explicitly state this and reference the feature(s) that DO define related workflows

**Structure for State Machine:**
```
### `value1` → `value2`
- When/how it happens
- Who can trigger it
- ← Requirements (if any)
- → Side effects (if any)
- → Sends `notification-template-id` (if applicable, see Notifications)
```

**Structure for Features Without Workflows:**
```
This feature does not define workflows. [Brief explanation of why]. For [related workflow topic], see [Feature Name] feature.
```

**Example:**

### `invited` → `active`
- User completes activation via email link
- Occurs automatically when `InvitationToken` is validated
- → Grants access based on `UserRole`
- → Sends `activation-email` (see Notifications)

### `active` → `disabled`
- Manual action by user with `UserRole` of `admin` or `manager`
- ← Requires `UserState` is `active`
- → Terminates all active sessions
- → Unassigns all cases (triggers Case Assignment feature)
- → Sends `user-disabled-notification` (see Notifications)

**Example (No Workflows):**

This feature does not define workflows. It provides discovery and filtering interfaces for data managed by other features. For state transitions, see the Users feature.

---

## Discovery & Display

How users find and view data in the feature.

**Rules:**
- Organize by each list or data view in the feature
- All subsections (Filters, Search, Sorting, Displayed Data, Default State) are optional - only include what applies
- Not all features have filtering, search, or sorting capabilities
- Reference `DefaultSearch` and `DefaultSorting` when using shared behavior
- Note which data comes from other features

**Structure:**
```
### [List or View Name]

Brief description of what this list/view shows.

#### Filters *(optional)*
- Filter name: `value1`, `value2`, `value3`
- Filter name: `value1`, `value2`

#### Search *(optional)*
- Search scope: what fields can be searched
- References `DefaultSearch` or describes custom behavior

#### Sorting *(optional)*
- Sort order specification
- References `DefaultSorting` or describes custom behavior

#### Displayed Data *(optional)*
- Field name (source if from another feature)
- Field name

#### Default State *(optional)*
- What's shown when user first accesses this list/view
```

**Example:**

### Manager List

Main listing of all managers in the system.

#### Filters
- Status: `invited`, `active`, `disabled`, `archived`

#### Search
- Follows `FullNameAndEmailSearch` scope (firstName, lastName, email)
- Adheres to `DefaultSearch` rules

#### Sorting
- Primary: First name (alphabetical)
- Secondary: Last name (alphabetical)
- Follows `DefaultSorting` rules

#### Displayed Data
- Full name and email
- Current `UserState`
- Who invited them and when

#### Default State
- Shows all managers with `UserState` of `active` by default

### Assignee Selection

List of reviewers available for filtering cases.

#### Search
- Follows `FullNameAndEmailSearch` scope (firstName, lastName, email)
- Adheres to `DefaultSearch` rules

#### Sorting
- Primary: First name (alphabetical)
- Secondary: Last name (alphabetical)

#### Displayed Data
- Full name and email

---

## Capabilities

Actions users can perform.

**Rules:**
- MUST use table format with roles as columns and capabilities as rows
- Use action verbs: Create, Edit, Delete, Assign, Change, Perform, etc.
- Do NOT use View-related verbs (View, Access, See) - those belong in Access Control
- Use checkmarks (✓) for allowed capabilities, dashes (—) for denied capabilities, or descriptive text for conditional capabilities
- For bulk operations, reference `DefaultBulkProcessing` in the capability description

**Structure:**
| Capability       | `roleName1`        | `roleName2` | `roleName3` |
|------------------|--------------------|--------------| ------------|
| Create users     | ✓                  | —            | —           |
| Edit own profile | ✓                  | ✓            | ✓           |
| Delete users     | Conditions/notes   | —            | —           |

**Example:**

| Capability | `admin` | `manager` | `reviewer` |
|------------|---------|-----------|------------|
| Create users (initial `UserState` is `invited`) | ✓ | — | — |
| Invite users with `UserRole` of `manager` | ✓ | — | — |
| Change `UserState` to any value | ✓ | — | — |
| Change `UserState` between `active` ↔ `disabled` | ✓ | ✓ | — |
| Change `UserRole` | ✓ | — | — |
| Delete users with `UserState` of `invited` | ✓ | — | — |
| Perform bulk operations (archive, disable, reset passwords) | ✓ | — | — |
| Update own preferences | ✓ | ✓ | ✓ |

---

## Business Rules

Constraints and validations.

**Rules:**
- Group related rules in subsections
- Use clear can/cannot language
- State what happens when violated

**Common Subsections:**
- State-Based Access
- State Transition Rules
- Validation Rules
- Permission Rules
- Data Retention
- Time-Based Rules
- Bulk Action Execution (if feature has bulk operations)
- Data Freshness *(optional - include if feature requires immediate visibility of changes)*

**Structure:**
```
### Rule Category
- EnumType with value can/cannot do X
- When Y happens, Z occurs
```

**Example:**

### State-Based Access
- Users with `UserState` of `invited` cannot log in
- Users with `UserState` of `active` can log in
- Users with `UserState` of `disabled` cannot log in; sessions terminate immediately
- Users with `UserState` of `archived` cannot log in

### State Transition Rules
- Cannot transition `UserState` from `invited` → `disabled` (must activate first)
- Cannot transition `UserState` from `archived` to any state except `active`
- Only users with `UserRole` of `admin` can transition `UserState` to `archived`

### Validation Rules
- Email must be unique across all users regardless of `UserState`
- `UserRole` cannot be empty
- Users with `UserRole` of `reviewer` cannot create users with `UserRole` of `admin`

### Bulk Action Execution
- Follows `DefaultBulkProcessing` rules
- Failure message examples for this feature:
  - For **Archive**: "Cannot archive [Item Name] ([identifier]) - item must have `ItemState` of `active` or `disabled`"
  - For **Disable**: "Cannot disable [Item Name] ([identifier]) - item must have `ItemState` of `active`"
  - For **Reset Password**: "Cannot reset password for [Item Name] ([identifier]) - item must have `ItemState` of `active`"

### Data Freshness *(optional)*
- All changes to [ResourceType] data are immediately visible to all users with access rights to view those [ResourceType]s
- Changes made by one user are immediately visible to other users without requiring manual refresh
- This applies to all operations: single updates, bulk operations, and system imports
- Visibility respects role-based access control rules defined in Access Control section
