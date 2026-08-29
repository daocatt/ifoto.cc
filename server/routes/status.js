import { Hono } from 'hono'
import { count } from 'drizzle-orm'
import { initDb, schema } from '../db.js'
import { getSettings } from '../settings.js'
import { validatePasswordStrength, hashPassword, signToken } from '../auth.js'

const statusRouter = new Hono()

// 获取系统状态与运行模式 — 以 .env APP_MODE 为绝对权威，不允许 fallback
statusRouter.get('/status', async (c) => {
  const mode = process.env.APP_MODE === 'online' ? 'online' : 'local'
  const domain = process.env.APP_DOMAIN || 'http://localhost:3000'

  if (mode === 'local') {
    return c.json({ mode: 'local', allowRegister: true, domain, needsInitAdmin: false })
  }

  // online 模式：必须有正常的 DB 连接，否则返回 503 错误（不 fallback 为 local）
  try {
    const db = initDb()
    if (!db) {
      return c.json({ mode: 'online', error: 'DATABASE_NOT_CONFIGURED' }, 503)
    }
    const [result] = await db.select({ total: count() }).from(schema.users)
    const needsInitAdmin = result.total === 0
    const settings = await getSettings()
    return c.json({ mode: 'online', allowRegister: settings.allowRegister, domain, needsInitAdmin })
  } catch (err) {
    console.error('[status] DB connection failed:', err)
    return c.json({ mode: 'online', error: 'DATABASE_CONNECTION_FAILED' }, 503)
  }
})

// 超级管理员首次初始化
statusRouter.post('/init-admin', async (c) => {
  const mode = process.env.APP_MODE === 'online' ? 'online' : 'local'
  if (mode === 'local') {
    return c.json({ error: '本地模式无需初始化管理员' }, 400)
  }

  const db = initDb()
  if (!db) {
    return c.json({ error: '数据库未连接' }, 500)
  }

  // 检查是否已有用户
  const [result] = await db.select({ total: count() }).from(schema.users)
  if (result.total > 0) {
    return c.json({ error: '超级管理员已被初始化，请直接登录' }, 400)
  }

  const { email, name, password, avatarKey } = await c.req.json()
  if (!email || !name || !password) {
    return c.json({ error: '请完整填写邮箱、昵称与密码' }, 400)
  }

  const pwdError = validatePasswordStrength(password)
  if (pwdError) {
    return c.json({ error: pwdError }, 400)
  }

  const passwordHash = await hashPassword(password)
  const [newUser] = await db.insert(schema.users).values({
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash,
    avatarKey: avatarKey || 'voxel_01',
    role: 'admin',
    superAdmin: true, // 首个创建者为唯一超级管理员
    isStatsPublic: true
  }).returning()

  const token = signToken({
    id: newUser.id,
    uid: newUser.uid,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    avatarKey: newUser.avatarKey,
    superAdmin: true
  })

  return c.json({
    message: '超级管理员初始化成功',
    token,
    user: {
      id: newUser.id,
      uid: newUser.uid,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatarKey: newUser.avatarKey,
      superAdmin: true
    }
  })
})

export { statusRouter }
