import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../src/db/schema.ts'

const { Pool } = pg

let pool = null
let db = null

export function initDb() {
  if (process.env.APP_MODE === 'local') {
    return null
  }
  if (!db) {
    const connectionString = process.env.DATABASE_URL || 'postgres://ifoto_user:ifoto_secret_password@localhost:5432/ifoto_db'
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    })
    db = drizzle(pool, { schema })
  }
  return db
}

export { schema }
