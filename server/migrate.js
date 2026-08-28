import { initDb } from './db.js'

export async function runAutoMigrations() {
  if (process.env.APP_MODE === 'local') return
  const db = initDb()
  if (!db) return

  try {
    // 确保数据库中存在所需的基础表结构
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL UNIQUE,
        "name" varchar(50) NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "avatar_key" varchar(50) DEFAULT 'voxel_01' NOT NULL,
        "role" varchar(20) DEFAULT 'user' NOT NULL,
        "is_stats_public" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "rooms" (
        "id" varchar(64) PRIMARY KEY,
        "owner_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(100) NOT NULL,
        "type" varchar(20) DEFAULT 'draw' NOT NULL,
        "password_hash" varchar(255),
        "is_open" boolean DEFAULT true NOT NULL,
        "open_start_time" varchar(10),
        "open_end_time" varchar(10),
        "is_public" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "game_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "room_id" varchar(64) NOT NULL,
        "room_name" varchar(100) NOT NULL,
        "round_count" integer DEFAULT 1 NOT NULL,
        "score" integer DEFAULT 0 NOT NULL,
        "played_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `)
    console.log(`✅ [Database] PostgreSQL 表结构已就绪 (users, rooms, game_records)`)
  } catch (err) {
    console.error('⚠️ [Database] 初始化数据库表失败 (可能尚未连接到 Postgres):', err.message)
  }
}
