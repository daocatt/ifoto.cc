import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { initDb, schema } from './db.js'
import { eq } from 'drizzle-orm'

// JWT 密钥：必须在 .env 中显式配置（online 模式启动时校验，不再使用硬编码兜底密钥）
const JWT_SECRET = process.env.JWT_SECRET

// 强密码校验 (至少 8 位，包含字母与数字)
export function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return '密码长度不能少于 8 个字符'
  }
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  if (!hasLetter || !hasNumber) {
    return '密码必须同时包含英文字母和数字'
  }
  return null
}

// 密码加密
export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

// 密码比对
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// 签发 JWT
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 解析 JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

// Hono 认证中间件：校验 token 并在 DB 中实时核对账号状态（禁用后立即失效）
export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未提供认证凭证，请先登录' }, 401)
  }
  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)
  if (!payload) {
    return c.json({ error: '登录凭证已过期或无效，请重新登录' }, 401)
  }

  const db = initDb()
  if (db) {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.id)).limit(1)
      if (!user) {
        return c.json({ error: '用户不存在，请重新登录' }, 401)
      }
      if (!user.enabled) {
        return c.json({ error: '账号已被禁用，请联系管理员' }, 403)
      }
      // 以 DB 最新数据为准（角色/头像/昵称可能被管理员修改）
      c.set('user', {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarKey: user.avatarKey,
        superAdmin: user.superAdmin === true,
        enabled: user.enabled
      })
      return next()
    } catch (e) {
      return c.json({ error: '认证服务暂不可用' }, 500)
    }
  }

  // 本地模式（无 DB）：仅信任 token
  c.set('user', payload)
  return next()
}

// 管理员中间件：必须是已启用的超级管理员
export function adminMiddleware(c, next) {
  return authMiddleware(c, async () => {
    const user = c.get('user')
    if (user.role !== 'admin') {
      return c.json({ error: '需要超级管理员权限' }, 403)
    }
    return next()
  })
}
