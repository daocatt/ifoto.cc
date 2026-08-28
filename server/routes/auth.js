import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { initDb, schema } from '../db.js'
import { getSettings } from '../settings.js'
import { validatePasswordStrength, hashPassword, comparePassword, signToken, authMiddleware } from '../auth.js'

const authRouter = new Hono()

// 用户注册
authRouter.post('/register', async (c) => {
  if (process.env.APP_MODE === 'local') {
    return c.json({ error: '本地模式无需注册' }, 400)
  }
  const settings = await getSettings()
  if (settings.allowRegister === false) {
    return c.json({ error: '当前系统已关闭公开注册，请联系管理员' }, 403)
  }

  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)

  const { email, name, password, avatarKey } = await c.req.json()
  if (!email || !name || !password) {
    return c.json({ error: '请完整填写邮箱、昵称与密码' }, 400)
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()

  // 1. 强密码校验
  const pwdErr = validatePasswordStrength(password)
  if (pwdErr) return c.json({ error: pwdErr }, 400)

  // 2. 检查邮箱与唯一昵称
  const existingEmail = await db.select().from(schema.users).where(eq(schema.users.email, cleanEmail)).limit(1)
  if (existingEmail.length > 0) {
    return c.json({ error: '该邮箱已被注册' }, 400)
  }

  const existingName = await db.select().from(schema.users).where(eq(schema.users.name, cleanName)).limit(1)
  if (existingName.length > 0) {
    return c.json({ error: '该昵称已被其他玩家使用，请换一个' }, 400)
  }

  const passwordHash = await hashPassword(password)
  const [newUser] = await db.insert(schema.users).values({
    email: cleanEmail,
    name: cleanName,
    passwordHash,
    avatarKey: avatarKey || 'voxel_01',
    role: 'user',
    isStatsPublic: true
  }).returning()

  const token = signToken({
    id: newUser.id,
    uid: newUser.uid,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    avatarKey: newUser.avatarKey
  })

  return c.json({
    message: '注册成功',
    token,
    user: {
      id: newUser.id,
      uid: newUser.uid,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatarKey: newUser.avatarKey
    }
  })
})

// 用户登录
authRouter.post('/login', async (c) => {
  if (process.env.APP_MODE === 'local') {
    return c.json({ error: '本地模式无需登录' }, 400)
  }

  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)

  const { email, password } = await c.req.json()
  if (!email || !password) {
    return c.json({ error: '请输入邮箱和密码' }, 400)
  }

  const cleanEmail = email.trim().toLowerCase()
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, cleanEmail)).limit(1)
  if (!user) {
    return c.json({ error: '邮箱或密码错误' }, 400)
  }

  if (user.enabled === false) {
    return c.json({ error: '账号已被禁用，请联系管理员' }, 403)
  }

  const isValid = await comparePassword(password, user.passwordHash)
  if (!isValid) {
    return c.json({ error: '邮箱或密码错误' }, 400)
  }

  const token = signToken({
    id: user.id,
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarKey: user.avatarKey
  })

  return c.json({
    message: '登录成功',
    token,
    user: {
      id: user.id,
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarKey: user.avatarKey
    }
  })
})

// 获取当前登录用户完整资料
authRouter.get('/me', authMiddleware, async (c) => {
  const jwtUser = c.get('user')
  const db = initDb()
  if (!db) return c.json({ user: jwtUser })

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, jwtUser.id)).limit(1)
  if (!user) {
    return c.json({ error: '用户不存在' }, 404)
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarKey: user.avatarKey,
      isStatsPublic: user.isStatsPublic,
      createdAt: user.createdAt
    }
  })
})

export { authRouter }
