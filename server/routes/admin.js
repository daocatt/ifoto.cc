import { Hono } from 'hono'
import { eq, ilike, count, and, or } from 'drizzle-orm'
import { initDb, schema } from '../db.js'
import { adminMiddleware, hashPassword } from '../auth.js'
import { getSettings } from '../settings.js'
import { forceCloseRoom, forceCloseUserConnections } from '../websocket.js'

const adminRouter = new Hono()
adminRouter.use('*', adminMiddleware)

const MAX_PAGE_SIZE = 100

// 分页参数解析
function parsePage(c) {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(c.req.query('pageSize') || '10', 10) || 10))
  return { page, pageSize }
}

// ── 基本设置 ──

adminRouter.get('/settings', async (c) => {
  return c.json({ settings: await getSettings() })
})

adminRouter.put('/settings', async (c) => {
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)

  const { allowRegister, allowUserCreateRoom, systemRoomsEnabled } = await c.req.json()
  const update = { updatedAt: new Date() }
  if (allowRegister !== undefined) update.allowRegister = Boolean(allowRegister)
  if (allowUserCreateRoom !== undefined) update.allowUserCreateRoom = Boolean(allowUserCreateRoom)
  if (systemRoomsEnabled !== undefined) update.systemRoomsEnabled = Boolean(systemRoomsEnabled)

  await db.update(schema.settings).set(update).where(eq(schema.settings.id, 1))
  const settings = await getSettings()

  // 关闭系统房间时，立即清空两间内置房在线玩家
  if (systemRoomsEnabled === false) {
    forceCloseRoom('draw')
    forceCloseRoom('english')
  }

  return c.json({ settings })
})

// ── 用户管理 ──

adminRouter.get('/users', async (c) => {
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)
  const { page, pageSize } = parsePage(c)
  const search = (c.req.query('search') || '').trim()

  const conditions = search
    ? or(ilike(schema.users.name, `%${search}%`), ilike(schema.users.email, `%${search}%`))
    : undefined

  const where = conditions || undefined
  const [totalRes] = await db.select({ total: count() }).from(schema.users).where(where)
  const rows = await db.select({
    id: schema.users.id,
    uid: schema.users.uid,
    email: schema.users.email,
    name: schema.users.name,
    role: schema.users.role,
    avatarKey: schema.users.avatarKey,
    enabled: schema.users.enabled,
    isStatsPublic: schema.users.isStatsPublic,
    createdAt: schema.users.createdAt
  })
    .from(schema.users)
    .where(where)
    .orderBy(schema.users.createdAt)
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return c.json({
    items: rows,
    total: totalRes.total,
    page,
    pageSize,
    totalPages: Math.ceil(totalRes.total / pageSize)
  })
})

adminRouter.put('/users/:id', async (c) => {
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)
  const me = c.get('user')
  const targetId = c.req.param('id')

  if (targetId === me.id) {
    return c.json({ error: '不能修改自己的账号' }, 400)
  }

  const { enabled, role, name, avatarKey, password } = await c.req.json()
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, targetId)).limit(1)
  if (!target) return c.json({ error: '用户不存在' }, 404)

  const update = { updatedAt: new Date() }
  if (enabled !== undefined) update.enabled = Boolean(enabled)
  if (role !== undefined && (role === 'admin' || role === 'user')) update.role = role
  if (name !== undefined && name.trim()) {
    const cleanName = name.trim()
    const [exist] = await db.select().from(schema.users).where(eq(schema.users.name, cleanName)).limit(1)
    if (exist && exist.id !== targetId) return c.json({ error: '该昵称已被使用' }, 400)
    update.name = cleanName
  }
  if (avatarKey !== undefined && /^voxel_\d+$/.test(avatarKey)) update.avatarKey = avatarKey
  if (password) {
    const pwdErr = password.length < 8 ? '密码长度不能少于 8 个字符' : null
    if (pwdErr) return c.json({ error: pwdErr }, 400)
    update.passwordHash = await hashPassword(password)
  }

  const [updated] = await db.update(schema.users).set(update).where(eq(schema.users.id, targetId)).returning()

  // 禁用账号：立即销毁其 WebSocket 会话（登录态随之失效）
  if (enabled === false) {
    forceCloseUserConnections(targetId)
  }

  return c.json({ user: { id: updated.id, enabled: updated.enabled, role: updated.role } })
})

adminRouter.delete('/users/:id', async (c) => {
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)
  const me = c.get('user')
  const targetId = c.req.param('id')

  if (targetId === me.id) {
    return c.json({ error: '不能删除自己的账号' }, 400)
  }

  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, targetId)).limit(1)
  if (!target) return c.json({ error: '用户不存在' }, 404)

  forceCloseUserConnections(targetId)
  // 清理其在线的专属房间
  const [ownRoom] = await db.select({ id: schema.rooms.id }).from(schema.rooms).where(eq(schema.rooms.ownerId, targetId)).limit(1)
  if (ownRoom) forceCloseRoom(ownRoom.id)
  // 用户关联数据（房间、战绩记录）通过外键 ON DELETE CASCADE 一并删除
  await db.delete(schema.users).where(eq(schema.users.id, targetId))

  return c.json({ message: '用户及其关联数据已删除' })
})

// ── 房间管理 ──

adminRouter.get('/rooms', async (c) => {
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)
  const { page, pageSize } = parsePage(c)
  const search = (c.req.query('search') || '').trim()

  const conditions = search
    ? or(ilike(schema.rooms.name, `%${search}%`), ilike(schema.users.name, `%${search}%`))
    : undefined

  const [totalRes] = await db.select({ total: count() }).from(schema.rooms)
    .leftJoin(schema.users, eq(schema.rooms.ownerId, schema.users.id))
    .where(conditions)

  const rows = await db.select({
    id: schema.rooms.id,
    name: schema.rooms.name,
    type: schema.rooms.type,
    ownerId: schema.rooms.ownerId,
    ownerName: schema.users.name,
    ownerEmail: schema.users.email,
    isOpen: schema.rooms.isOpen,
    adminDisabled: schema.rooms.adminDisabled,
    isPublic: schema.rooms.isPublic,
    hasPassword: schema.rooms.passwordHash,
    openStartTime: schema.rooms.openStartTime,
    openEndTime: schema.rooms.openEndTime,
    createdAt: schema.rooms.createdAt
  })
    .from(schema.rooms)
    .leftJoin(schema.users, eq(schema.rooms.ownerId, schema.users.id))
    .where(conditions)
    .orderBy(schema.rooms.createdAt)
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return c.json({
    items: rows.map(r => ({ ...r, hasPassword: !!r.hasPassword })),
    total: totalRes.total,
    page,
    pageSize,
    totalPages: Math.ceil(totalRes.total / pageSize)
  })
})

adminRouter.put('/rooms/:id', async (c) => {
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)
  const roomId = c.req.param('id')

  const { name, type, password, isOpen, isPublic, adminDisabled } = await c.req.json()
  const [room] = await db.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).limit(1)
  if (!room) return c.json({ error: '房间不存在' }, 404)

  const update = {}
  if (name !== undefined && name.trim()) update.name = name.trim()
  if (type !== undefined && (type === 'draw' || type === 'english')) update.type = type
  if (isOpen !== undefined) update.isOpen = Boolean(isOpen)
  if (isPublic !== undefined) update.isPublic = Boolean(isPublic)
  if (adminDisabled !== undefined) update.adminDisabled = Boolean(adminDisabled)
  if (password !== undefined) {
    update.passwordHash = password ? await hashPassword(password) : null
  }

  if (Object.keys(update).length > 0) {
    await db.update(schema.rooms).set(update).where(eq(schema.rooms.id, roomId))
  }

  // 管理员禁用房间：立即清空在线玩家
  if (adminDisabled === true) {
    forceCloseRoom(roomId)
  }

  return c.json({ room: { id: roomId, adminDisabled: update.adminDisabled } })
})

adminRouter.delete('/rooms/:id', async (c) => {
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)
  const roomId = c.req.param('id')

  const [room] = await db.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).limit(1)
  if (!room) return c.json({ error: '房间不存在' }, 404)

  forceCloseRoom(roomId)
  await db.delete(schema.rooms).where(eq(schema.rooms.id, roomId))

  return c.json({ message: '房间已删除' })
})

export { adminRouter }