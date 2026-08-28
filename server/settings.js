import { initDb, schema } from './db.js'
import { eq } from 'drizzle-orm'

export const DEFAULT_SETTINGS = {
  id: 1,
  allowRegister: true,
  allowUserCreateRoom: true,
  systemRoomsEnabled: true
}

// 读取系统设置（本地模式或表缺失时返回默认值）
export async function getSettings() {
  const db = initDb()
  if (!db) return { ...DEFAULT_SETTINGS }

  try {
    let [row] = await db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1)
    if (!row) {
      const [created] = await db.insert(schema.settings).values({ id: 1 }).returning()
      row = created
    }
    return row
  } catch (e) {
    return { ...DEFAULT_SETTINGS }
  }
}