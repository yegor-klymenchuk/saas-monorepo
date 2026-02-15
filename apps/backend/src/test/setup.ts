import { beforeAll, afterAll, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../database/database";
import { Pool } from "pg";

let pool: Pool;

beforeAll(async () => {
  // Get the pool instance from the database connection
  pool = (db as any).client as Pool;
});

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
  `);
});

afterAll(async () => {
  // Close the database connection pool
  await pool.end();
});
