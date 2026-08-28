import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'whiteboard_super_secret_jwt_key_2026_change_me_please'

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

// Hono 认证中间件
export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未提供认证凭证，请先登录' }, 401)
  }
  const token = authHeader.split(' ')[1]
  const user = verifyToken(token)
  if (!user) {
    return c.json({ error: '登录凭证已过期或无效，请重新登录' }, 401)
  }
  c.set('user', user)
  await next()
}
