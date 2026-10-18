import { sql } from 'drizzle-orm'
import { afterAll, afterEach } from 'vitest'

import { db } from '../database/database'
import { env } from '../env'
import './mocks/mail/setup'
import './mocks/stripe/setup'

if (env.NODE_ENV !== 'test' || !env.DATABASE_NAME.endsWith('_test')) {
  throw new Error('Database tests require NODE_ENV=test and a database name ending in _test')
}

afterEach(async () => {
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
  // Close the database connection pool
  await db.$client.end()
})
