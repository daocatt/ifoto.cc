import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { initDb, schema } from '../db.js'
import { authMiddleware } from '../auth.js'

const scoresRouter = new Hono()

// 上报对局得分
scoresRouter.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = initDb()
  if (!db) return c.json({ recorded: false })

  const { roomId, roomName, score, roundCount } = await c.req.json()
  if (!roomId || score === undefined) {
    return c.json({ error: '参数不完整' }, 400)
  }

  const [record] = await db.insert(schema.gameRecords).values({
    userId: user.id,
    roomId: roomId,
    roomName: roomName || '游戏房间',
    roundCount: roundCount || 1,
    score: Number(score) || 0
  }).returning()

  return c.json({ message: '战绩记录成功', record })
})

// 获取我的历史比赛计分记录
scoresRouter.get('/my', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = initDb()
  if (!db) return c.json({ records: [] })

  const records = await db.select().from(schema.gameRecords)
    .where(eq(schema.gameRecords.userId, user.id))
    .orderBy(desc(schema.gameRecords.playedAt))
    .limit(50)

  return c.json({ records })
})

export { scoresRouter }
