import { Hono } from 'hono'
import { eq, count, sum, or } from 'drizzle-orm'
import { initDb, schema } from '../db.js'
import { authMiddleware, validatePasswordStrength, hashPassword, comparePassword } from '../auth.js'

const profileRouter = new Hono()

// 更新当前用户资料（昵称、头像、密码、战绩公开开关）
profileRouter.put('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)

  const { name, avatarKey, oldPassword, newPassword, isStatsPublic } = await c.req.json()

  const [currentUser] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
  if (!currentUser) return c.json({ error: '用户不存在' }, 404)

  const updateData = { updatedAt: new Date() }

  // 1. 修改昵称（查重）
  if (name && name.trim() !== currentUser.name) {
    const cleanName = name.trim()
    const [exist] = await db.select().from(schema.users).where(eq(schema.users.name, cleanName)).limit(1)
    if (exist && exist.id !== user.id) {
      return c.json({ error: '该昵称已被使用，请换一个' }, 400)
    }
    updateData.name = cleanName
  }

  // 2. 更换体素头像
  if (avatarKey && avatarKey.startsWith('voxel_')) {
    updateData.avatarKey = avatarKey
  }

  // 3. 设置战绩公开开关
  if (isStatsPublic !== undefined) {
    updateData.isStatsPublic = Boolean(isStatsPublic)
  }

  // 4. 修改密码
  if (newPassword) {
    if (!oldPassword) {
      return c.json({ error: '修改密码必须提供当前原密码' }, 400)
    }
    const isOldValid = await comparePassword(oldPassword, currentUser.passwordHash)
    if (!isOldValid) {
      return c.json({ error: '原密码输入不正确' }, 400)
    }
    const pwdErr = validatePasswordStrength(newPassword)
    if (pwdErr) {
      return c.json({ error: pwdErr }, 400)
    }
    updateData.passwordHash = await hashPassword(newPassword)
  }

  const [updated] = await db.update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, user.id))
    .returning()

  return c.json({
    message: '个人资料已更新',
    user: {
      id: updated.id,
      uid: updated.uid,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      avatarKey: updated.avatarKey,
      isStatsPublic: updated.isStatsPublic
    }
  })
})

// 查看用户公开主页（支持 6~12 位数字 UID 或 UUID）
profileRouter.get('/:uidOrId', async (c) => {
  const uidOrId = c.req.param('uidOrId')
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)

  const isNumericUid = /^[0-9]{6,12}$/.test(uidOrId)
  let targetUser = null

  if (isNumericUid) {
    const numUid = parseInt(uidOrId, 10)
    const [u] = await db.select({
      id: schema.users.id,
      uid: schema.users.uid,
      name: schema.users.name,
      avatarKey: schema.users.avatarKey,
      role: schema.users.role,
      isStatsPublic: schema.users.isStatsPublic,
      createdAt: schema.users.createdAt
    }).from(schema.users).where(eq(schema.users.uid, numUid)).limit(1)
    targetUser = u
  } else {
    try {
      const [u] = await db.select({
        id: schema.users.id,
        uid: schema.users.uid,
        name: schema.users.name,
        avatarKey: schema.users.avatarKey,
        role: schema.users.role,
        isStatsPublic: schema.users.isStatsPublic,
        createdAt: schema.users.createdAt
      }).from(schema.users).where(eq(schema.users.id, uidOrId)).limit(1)
      targetUser = u
    } catch (_) {}
  }

  if (!targetUser) return c.json({ error: '玩家不存在' }, 404)

  // 统计比赛数据
  let stats = { totalGames: 0, totalScore: 0 }
  let records = []

  if (targetUser.isStatsPublic) {
    const [scoreStats] = await db.select({
      totalGames: count(),
      totalScore: sum(schema.gameRecords.score)
    }).from(schema.gameRecords).where(eq(schema.gameRecords.userId, targetUser.id))

    stats = {
      totalGames: scoreStats.totalGames || 0,
      totalScore: Number(scoreStats.totalScore || 0)
    }

    records = await db.select().from(schema.gameRecords)
      .where(eq(schema.gameRecords.userId, targetUser.id))
      .limit(20)
  }

  return c.json({
    user: targetUser,
    stats,
    records
  })
})

export { profileRouter }
