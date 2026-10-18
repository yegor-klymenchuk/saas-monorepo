# Database Management Guide

This guide covers database operations using Drizzle ORM with a **database-first approach**.

## Table of Contents

- [Database-First Approach](#database-first-approach)
- [Pull Schema from Database](#pull-schema-from-database)
- [Generate Migrations](#generate-migrations)
- [Apply Migrations](#apply-migrations)
- [Revert Migrations](#revert-migrations)
- [Other Useful Commands](#other-useful-commands)

---

## Database-First Approach

In the **database-first** approach, your database schema is the source of truth. You manage your database schema either directly on the database or via migration files, and then pull the schema to generate TypeScript files.

### Workflow

```
SQL Migration File → Apply to Database → Pull Schema → TypeScript Schema Files
```

```bash
psql -h localhost -p 5433 -U tanstack-kit -d test -f better-auth_migrations/2025-12-25T13-10-31.651Z.sql
```

---

## Pull Schema from Database

**Pull** reads your existing database schema and generates corresponding TypeScript Drizzle schema files.

### Command

```bash
pnpm db:pull
```

### What it does

1. Connects to your database using credentials from `drizzle.config.ts`
2. Introspects the current database schema
3. Generates TypeScript schema files in `./src/database/schemas/`

### Example

```bash
# After applying SQL migrations to your database
psql -h localhost -p 5433 -U tanstack-kit -d test -f better-auth_migrations/2025-12-25T13-10-31.651Z.sql

# Pull the schema
pnpm db:pull
```

This will generate/update TypeScript files like:
- `schemas/user.ts`
- `schemas/account.ts`
- `schemas/session.ts`
- etc.

---

## Generate Migrations

**Generate** creates SQL migration files based on changes in your TypeScript schema files (codebase-first approach).

### Command

```bash
pnpm db:generate
```

### What it does

1. Reads previous migration snapshots in `./drizzle/` folder
2. Compares current TypeScript schema with previous state
3. Prompts for column/table renames if needed
4. Generates SQL migration files

### Example Output

```
📂 drizzle/
└── 📂 0001_cool_migration_name/
    ├── 📜 snapshot.json
    └── 📜 migration.sql
```

### When to use

- You've modified your TypeScript schema files
- You want to generate SQL that represents those changes
- You're using the **codebase-first** approach

---

## Apply Migrations

### Option 1: Using Drizzle Kit (CLI)

```bash
pnpm db:migrate
```

Reads migration files from `./drizzle/` and applies them to the database.

### Option 2: Using Runtime Migration

Apply migrations during application startup:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const db = drizzle(process.env.DATABASE_URL)

// Apply migrations
await migrate(db, { migrationsFolder: './drizzle' })
```

### Option 3: Direct SQL Application

For external migration files (like Better Auth):

```bash
psql -h localhost -p 5433 -U tanstack-kit -d test -f path/to/migration.sql
```

Or with environment variables:

```bash
psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -f migration.sql
```

---

## Revert Migrations

Drizzle Kit doesn't have a built-in automatic rollback command. Here are your options:

### Option 1: Manual SQL Rollback

Create reverse migration SQL files manually:

```sql
-- Original migration (0001_add_users.sql)
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL
);

-- Rollback migration (0001_rollback_add_users.sql)
DROP TABLE "users";
```

Apply the rollback:

```bash
psql -h localhost -p 5433 -U tanstack-kit -d test -f drizzle/0001_rollback_add_users.sql
```

### Option 2: Use Drizzle Studio to Inspect and Modify

```bash
pnpm db:studio
```

Opens a web UI at `https://local.drizzle.studio` where you can:
- View your database schema
- Manually modify data
- Inspect migrations

### Option 3: Database Backup and Restore

**Before applying migrations:**

```bash
# Backup
pg_dump -h localhost -p 5433 -U tanstack-kit -d test > backup.sql

# Apply migration
pnpm db:migrate

# If something goes wrong, restore
psql -h localhost -p 5433 -U tanstack-kit -d test < backup.sql
```

### Option 4: Delete Migration from Tracking Table

Drizzle tracks applied migrations in the `__drizzle_migrations` table:

```sql
-- View migration history
SELECT * FROM __drizzle_migrations ORDER BY created_at DESC;

-- Manually remove the last migration record
DELETE FROM __drizzle_migrations WHERE id = <migration_id>;
```

⚠️ **Warning**: This only removes the tracking record, not the actual schema changes!

### Option 5: Use External Migration Tools

For production environments, consider using tools that support rollbacks:
- [Atlas](https://atlasgo.io/)
- [Liquibase](https://www.liquibase.org/)
- [Bytebase](https://www.bytebase.com/)
- [Flyway](https://flywaydb.org/)

---

## Other Useful Commands

### Push Schema Directly

Push your TypeScript schema directly to the database without generating SQL files:

```bash
pnpm db:push
```

⚠️ **Warning**: This is great for development but skips SQL migration file generation.

### Open Drizzle Studio

Visual database browser:

```bash
pnpm db:studio
```

### View Database Schema

```bash
psql -h localhost -p 5433 -U tanstack-kit -d test

# Inside psql:
\dt          # List tables
\d users     # Describe table structure
\q           # Quit
```

---

## Database Configuration

Database connection settings are in `drizzle.config.ts`:

```typescript
{
  out: './drizzle',              // Migration output folder
  schema: './src/database/schema', // Schema files location
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5433'),
    user: process.env.DATABASE_USERNAME || 'tanstack-kit',
    password: process.env.DATABASE_PASSWORD || '123456789',
    database: process.env.DATABASE_NAME || 'test',
  }
}
```

---

## Best Practices

1. **Always backup before migrations** in production
2. **Test migrations in development** before applying to production
3. **Version control your migrations** - commit migration files to git
4. **Use descriptive migration names** when prompted during `generate`
5. **Review generated SQL** before applying with `migrate`
6. **Keep track of migration order** - Drizzle uses folder names for ordering

---

## Troubleshooting

### "relation already exists" error

You're trying to create a table that already exists. Either:
- Drop the table manually
- Use `drizzle-kit push` instead (handles diffs automatically)
- Skip the migration

### Pull generates incorrect types

Make sure:
- Database connection settings are correct
- You have proper permissions to read schema
- Database is running and accessible

### Migration conflicts in teams

- Always pull latest migrations from git before generating new ones
- Use meaningful migration names
- Communicate with team when making schema changes

---

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
