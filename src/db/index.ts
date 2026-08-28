import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

const { Pool } = pg

let pool: pg.Pool | null = null
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (process.env.APP_MODE === 'local') {
    return null
  }

  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL || 'postgres://whiteboard_user:whiteboard_secret_password@localhost:5432/whiteboard_db'
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    })
    dbInstance = drizzle(pool, { schema })
  }

  return dbInstance
}

export { schema }
