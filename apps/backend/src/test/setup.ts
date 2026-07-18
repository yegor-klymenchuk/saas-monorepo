import { afterAll, afterEach, beforeAll } from 'vitest'
import { sql } from 'drizzle-orm'
import { Pool } from 'pg'

import { db } from '../database/database'

const databaseTestsEnabled = process.env.DATABASE_TESTS_ENABLED === 'true'
let pool: Pool | undefined

beforeAll(async () => {
  if (!databaseTestsEnabled) return

  // Get the pool instance from the database connection
  pool = (db as unknown as { client: Pool }).client
})

afterEach(async () => {
  if (!databaseTestsEnabled) return

  // Clean up all tables after each test
  await db.execute(sql`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
      LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `)
})

afterAll(async () => {
  if (!pool) return

  // Close the database connection pool
  await pool.end()
})
