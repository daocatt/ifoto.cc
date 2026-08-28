import { pgTable, text, varchar, timestamp, boolean, integer, uuid, bigint, pgSequence } from 'drizzle-orm/pg-core'

// UID 全局自增序列 (从 100001 起，6位数字，自然增长至12位)
export const userUidSeq = pgSequence('user_uid_seq', { startWith: 100001, increment: 1 })

// 1. 用户表
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: bigint('uid', { mode: 'number' }).notNull().unique(), // 6-12位全局数字UID，由 server 端调用 nextval('user_uid_seq') 填充
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 50 }).notNull().unique(), // 全局唯一昵称
  passwordHash: text('password_hash').notNull(),
  avatarKey: varchar('avatar_key', { length: 50 }).notNull().default('voxel_01'), // 绑定的体素头像 key
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'admin' | 'user'
  isStatsPublic: boolean('is_stats_public').notNull().default(true), // 个人战绩是否公开
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

// 2. 自定义房间表 (每个用户最多拥有1个专属房间)
export const rooms = pgTable('rooms', {
  id: varchar('id', { length: 64 }).primaryKey(), // 房间唯一 slug/code
  ownerId: uuid('owner_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('draw'), // 'draw' | 'english'
  passwordHash: varchar('password_hash', { length: 255 }),
  isOpen: boolean('is_open').notNull().default(true),
  openStartTime: varchar('open_start_time', { length: 10 }),
  openEndTime: varchar('open_end_time', { length: 10 }),
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

// 3. 计分历史与比赛记录表
export const gameRecords = pgTable('game_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roomId: varchar('room_id', { length: 64 }).notNull(),
  roomName: varchar('room_name', { length: 100 }).notNull(),
  roundCount: integer('round_count').notNull().default(1),
  score: integer('score').notNull().default(0),
  playedAt: timestamp('played_at', { withTimezone: true }).notNull().defaultNow()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert
export type GameRecord = typeof gameRecords.$inferSelect
export type NewGameRecord = typeof gameRecords.$inferInsert
