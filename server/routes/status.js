import { Hono } from 'hono'
import { count } from 'drizzle-orm'
import { initDb, schema } from '../db.js'
import { validatePasswordStrength, hashPassword, signToken } from '../auth.js'

const statusRouter = new Hono()

// 获取系统状态与运行模式
statusRouter.get('/status', async (c) => {
  const mode = process.env.APP_MODE === 'online' ? 'online' : 'local'
  const allowRegister = process.env.ALLOW_REGISTER !== 'false'
  const domain = process.env.APP_DOMAIN || 'http://localhost:3000'

  if (mode === 'local') {
    return c.json({
      mode: 'local',
      allowRegister: true,
      domain,
      needsInitAdmin: false
    })
  }

  try {
    const db = initDb()
    if (!db) {
      return c.json({ mode: 'local', allowRegister: true, domain, needsInitAdmin: false })
    }
    const [result] = await db.select({ total: count() }).from(schema.users)
    const needsInitAdmin = result.total === 0
    return c.json({
      mode: 'online',
      allowRegister,
      domain,
      needsInitAdmin
    })
  } catch (err) {
    console.error('Check DB status failed:', err)
    return c.json({ mode: 'online', allowRegister, domain, needsInitAdmin: false, error: 'Database connection failed' })
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
    isStatsPublic: true
  }).returning()

  const token = signToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    avatarKey: newUser.avatarKey
  })

  return c.json({
    message: '超级管理员初始化成功',
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatarKey: newUser.avatarKey
    }
  })
})

export { statusRouter }
