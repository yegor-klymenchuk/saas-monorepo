import { defineConfig } from 'drizzle-kit'
import { env } from "./src/env"

export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema/*',
  dialect: 'postgresql',
  dbCredentials: {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: false,
  },
  verbose: true,
  strict: true,
})
