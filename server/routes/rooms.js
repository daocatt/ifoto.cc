import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { initDb, schema } from '../db.js'
import { getSettings } from '../settings.js'
import { authMiddleware, hashPassword, comparePassword } from '../auth.js'

const roomsRouter = new Hono()

// 工具函数：判断当前是否在定时开放时间范围内
export function isRoomInOpenTime(startTime, endTime) {
  if (!startTime || !endTime) return true // 未设置时间限制则全天开放
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [sH, sM] = startTime.split(':').map(Number)
  const [eH, eM] = endTime.split(':').map(Number)
  const startMinutes = sH * 60 + sM
  const endMinutes = eH * 60 + eM

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  } else {
    // 跨午夜情况 (如 22:00 ~ 02:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }
}

// 1. 获取公开房间列表 (所有人可访问)
roomsRouter.get('/public', async (c) => {
  const db = initDb()
  if (!db) {
    // 本地模式返回默认公开房间
    return c.json({
      rooms: [
        { id: 'draw', name: '你画我猜', type: 'draw', isSystem: true, isOpen: true, hasPassword: false, ownerName: '系统预设' },
        { id: 'english', name: '英语猜猜看', type: 'english', isSystem: true, isOpen: true, hasPassword: false, ownerName: '系统预设' }
      ]
    })
  }

  const settings = await getSettings()

  // 线上模式：预设系统房间(可按开关隐藏) + 用户创建的公开房间
  const dbRooms = await db.select({
    id: schema.rooms.id,
    name: schema.rooms.name,
    type: schema.rooms.type,
    isOpen: schema.rooms.isOpen,
    adminDisabled: schema.rooms.adminDisabled,
    openStartTime: schema.rooms.openStartTime,
    openEndTime: schema.rooms.openEndTime,
    isPublic: schema.rooms.isPublic,
    createdAt: schema.rooms.createdAt,
    hasPassword: schema.rooms.passwordHash,
    ownerId: schema.users.id,
    ownerName: schema.users.name,
    ownerAvatar: schema.users.avatarKey
  })
  .from(schema.rooms)
  .leftJoin(schema.users, eq(schema.rooms.ownerId, schema.users.id))
  .where(eq(schema.rooms.isPublic, true))
  .orderBy(desc(schema.rooms.createdAt))

  const processedRooms = dbRooms.map(r => {
    const inTime = isRoomInOpenTime(r.openStartTime, r.openEndTime)
    const effectiveOpen = r.isOpen && inTime && !r.adminDisabled
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      isOpen: effectiveOpen,
      rawIsOpen: r.isOpen,
      adminDisabled: !!r.adminDisabled,
      openStartTime: r.openStartTime,
      openEndTime: r.openEndTime,
      hasPassword: !!r.hasPassword,
      ownerName: r.ownerName || '玩家',
      ownerAvatar: r.ownerAvatar || 'voxel_01',
      createdAt: r.createdAt
    }
  })

  // 系统房间按开关决定是否出现在列表；未启用时既不出现在列表也无法进入
  const result = []
  if (settings.systemRoomsEnabled) {
    result.push(
      { id: 'draw', name: '🎨 你画我猜', type: 'draw', isSystem: true, isOpen: true, hasPassword: false, ownerName: 'ifoto', ownerAvatar: 'voxel_10' },
      { id: 'english', name: '🔤 英语猜猜看', type: 'english', isSystem: true, isOpen: true, hasPassword: false, ownerName: 'ifoto', ownerAvatar: 'voxel_12' }
    )
  }
  result.push(...processedRooms)

  return c.json({ rooms: result })
})

// 2. 获取我的专属房间 (需登录)
roomsRouter.get('/my', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = initDb()
  if (!db) return c.json({ room: null })

  const [myRoom] = await db.select().from(schema.rooms).where(eq(schema.rooms.ownerId, user.id)).limit(1)
  if (!myRoom) return c.json({ room: null })

  const inTime = isRoomInOpenTime(myRoom.openStartTime, myRoom.openEndTime)
  return c.json({
    room: {
      id: myRoom.id,
      name: myRoom.name,
      type: myRoom.type,
      isOpen: myRoom.isOpen,
      adminDisabled: !!myRoom.adminDisabled,
      effectiveIsOpen: myRoom.isOpen && inTime && !myRoom.adminDisabled,
      openStartTime: myRoom.openStartTime,
      openEndTime: myRoom.openEndTime,
      isPublic: myRoom.isPublic,
      hasPassword: !!myRoom.passwordHash,
      createdAt: myRoom.createdAt
    }
  })
})

// 3. 创建或更新我的专属房间 (每个用户最多1个)
roomsRouter.post('/my', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = initDb()
  if (!db) return c.json({ error: '数据库不可用' }, 500)

  const { name, type, password, isOpen, openStartTime, openEndTime, isPublic } = await c.req.json()
  if (!name || !name.trim()) {
    return c.json({ error: '房间名称不能为空' }, 400)
  }

  const [existingRoom] = await db.select().from(schema.rooms).where(eq(schema.rooms.ownerId, user.id)).limit(1)

  let passwordHash = undefined
  if (password !== undefined) {
    passwordHash = password ? await hashPassword(password) : null
  }

  if (existingRoom) {
    // 管理员已禁用的房间，房主无法编辑
    if (existingRoom.adminDisabled) {
      return c.json({ error: '房间已被管理员禁用，暂无法编辑' }, 403)
    }

    const updateValues = {
      name: name.trim(),
      type: type || existingRoom.type,
      isOpen: isOpen !== undefined ? isOpen : existingRoom.isOpen,
      openStartTime: openStartTime !== undefined ? openStartTime : existingRoom.openStartTime,
      openEndTime: openEndTime !== undefined ? openEndTime : existingRoom.openEndTime,
      isPublic: isPublic !== undefined ? isPublic : existingRoom.isPublic
    }
    if (passwordHash !== undefined) {
      updateValues.passwordHash = passwordHash
    }

    const [updated] = await db.update(schema.rooms)
      .set(updateValues)
      .where(eq(schema.rooms.id, existingRoom.id))
      .returning()

    return c.json({ message: '房间更新成功', room: updated })
  } else {
    // 新建房间受系统设置约束
    const settings = await getSettings()
    if (settings.allowUserCreateRoom === false) {
      return c.json({ error: '当前系统已关闭用户创建房间功能' }, 403)
    }

    // 新建房间，生成随机 slug
    const roomId = `room_${Math.random().toString(36).substring(2, 8)}`
    const [created] = await db.insert(schema.rooms).values({
      id: roomId,
      ownerId: user.id,
      name: name.trim(),
      type: type || 'draw',
      passwordHash: passwordHash || null,
      isOpen: isOpen !== undefined ? isOpen : true,
      openStartTime: openStartTime || null,
      openEndTime: openEndTime || null,
      isPublic: isPublic !== undefined ? isPublic : true
    }).returning()

    return c.json({ message: '房间创建成功', room: created })
  }
})

// 4. 验证房间密码
roomsRouter.post('/verify-password', async (c) => {
  const { roomId, password } = await c.req.json()

  const db = initDb()
  if (!db) return c.json({ valid: true })

  const settings = await getSettings()

  if (roomId === 'draw' || roomId === 'english') {
    if (!settings.systemRoomsEnabled) {
      return c.json({ error: '系统房间已停用' }, 404)
    }
    return c.json({ valid: true })
  }

  const [room] = await db.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).limit(1)
  if (!room) return c.json({ error: '房间不存在' }, 404)

  if (room.adminDisabled) {
    return c.json({ error: '房间已被管理员禁用' }, 403)
  }

  if (!room.passwordHash) {
    return c.json({ valid: true })
  }

  const isValid = await comparePassword(password || '', room.passwordHash)
  if (!isValid) {
    return c.json({ valid: false, error: '房间密码不正确' }, 400)
  }
  return c.json({ valid: true })
})

// 5. 获取指定房间详情（检查开放状态）
roomsRouter.get('/:id', async (c) => {
  const roomId = c.req.param('id')
  const db = initDb()

  if (roomId === 'draw' || roomId === 'english') {
    const settings = db ? await getSettings() : { systemRoomsEnabled: true }
    if (!settings.systemRoomsEnabled) {
      return c.json({ error: '系统房间已停用' }, 404)
    }
    return c.json({
      room: {
        id: roomId,
        name: roomId === 'draw' ? '你画我猜' : '英语猜猜看',
        type: roomId,
        isOpen: true,
        hasPassword: false,
        isSystem: true
      }
    })
  }

  if (!db) {
    return c.json({ room: { id: roomId, name: '游戏房间', type: 'draw', isOpen: true, hasPassword: false } })
  }

  const [room] = await db.select({
    id: schema.rooms.id,
    name: schema.rooms.name,
    type: schema.rooms.type,
    isOpen: schema.rooms.isOpen,
    adminDisabled: schema.rooms.adminDisabled,
    openStartTime: schema.rooms.openStartTime,
    openEndTime: schema.rooms.openEndTime,
    isPublic: schema.rooms.isPublic,
    hasPassword: schema.rooms.passwordHash,
    ownerName: schema.users.name,
    ownerAvatar: schema.users.avatarKey
  })
  .from(schema.rooms)
  .leftJoin(schema.users, eq(schema.rooms.ownerId, schema.users.id))
  .where(eq(schema.rooms.id, roomId))
  .limit(1)

  if (!room) {
    return c.json({ error: '房间不存在或已解散' }, 404)
  }

  const inTime = isRoomInOpenTime(room.openStartTime, room.openEndTime)
  return c.json({
    room: {
      ...room,
      hasPassword: !!room.hasPassword,
      effectiveIsOpen: room.isOpen && inTime && !room.adminDisabled,
      isTimeRestricted: !!(room.openStartTime && room.openEndTime),
      inTime
    }
  })
})

export { roomsRouter }