import { WebSocketServer, WebSocket } from 'ws'
import { isRoomInOpenTime } from './routes/rooms.js'
import { initDb, schema } from './db.js'
import { eq } from 'drizzle-orm'

// 房间状态映射：roomId -> { clients: Map<ws, Player>, elements: any[], gameState: any }
const rooms = new Map()

export function getRoomState(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Map(), // ws -> player
      elements: [],
      gameState: null
    })
  }
  return rooms.get(roomId)
}

export function broadcastToRoom(roomId, senderWs, data) {
  const room = rooms.get(roomId)
  if (!room) return

  for (const [client] of room.clients.entries()) {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}

export function broadcastToAllInRoom(roomId, data) {
  const room = rooms.get(roomId)
  if (!room) return

  for (const [client] of room.clients.entries()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}

export function initWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true })

  // 1. HTTP Upgrade 握手（兼容 /ws, /ws-game, /ws/game）
  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`)
    const pathname = url.pathname

    if (pathname === '/ws' || pathname === '/ws-game' || pathname === '/ws/game') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    } else {
      socket.destroy()
    }
  })

  // 2. 连接与消息分发
  wss.on('connection', (ws) => {
    let currentRoomId = null

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString())
        const type = data.type

        // 玩家加入房间
        if (type === 'JOIN_ROOM') {
          const roomId = data.roomId || 'draw'
          const player = data.payload?.player

          if (currentRoomId && currentRoomId !== roomId) {
            const oldRoom = getRoomState(currentRoomId)
            oldRoom.clients.delete(ws)
            broadcastToAllInRoom(currentRoomId, JSON.stringify({
              type: 'ROOM_PLAYERS_UPDATED',
              payload: { players: Array.from(oldRoom.clients.values()) }
            }))
          }

          currentRoomId = roomId
          const room = getRoomState(roomId)

          if (player) {
            room.clients.set(ws, player)
          }

          const playersList = Array.from(room.clients.values())
          console.log(`[WS] 玩家 [${player?.name || '未知'}] 加入房间 [${roomId}]，当前在线: ${playersList.length} 人`)

          // 第 1 个人进入房间默认设为画师，若原有画师已离线也自动指定当前首位玩家
          if (!room.gameState) {
            room.gameState = {
              roundNumber: 1,
              currentDrawerId: player ? player.id : null,
              currentWord: null,
              isWordRevealed: false,
              timeLeft: 90,
              totalTime: 90,
              isTimerRunning: false,
              history: []
            }
          } else if (!room.gameState.currentDrawerId || !playersList.some(p => p.id === room.gameState.currentDrawerId)) {
            room.gameState.currentDrawerId = playersList[0]?.id || null
          }

          // 1. 发送给当前加入者完整的同步状态
          ws.send(JSON.stringify({
            type: 'SYNC_FULL_STATE',
            payload: {
              players: playersList,
              gameState: room.gameState,
              elements: room.elements
            }
          }))

          // 2. 广播给房间其他人人员变动及游戏状态
          broadcastToRoom(roomId, ws, JSON.stringify({
            type: 'ROOM_PLAYERS_UPDATED',
            payload: { players: playersList, gameState: room.gameState }
          }))
          return
        }

        // 画笔同步
        if (type === 'SYNC_CANVAS_SCENE' || type === 'CANVAS_SCENE_UPDATE') {
          if (currentRoomId) {
            const room = getRoomState(currentRoomId)
            if (data.payload?.elements) {
              room.elements = data.payload.elements
            }
            broadcastToRoom(currentRoomId, ws, message.toString())
          }
          return
        }

        // 画板清空
        if (type === 'CLEAR_CANVAS_SCENE') {
          if (currentRoomId) {
            const room = getRoomState(currentRoomId)
            room.elements = []
            broadcastToRoom(currentRoomId, ws, message.toString())
          }
          return
        }

        // 游戏状态更新 (加分、抽词、切画师、倒计时)
        if (type === 'UPDATE_GAME_STATE') {
          if (currentRoomId) {
            const room = getRoomState(currentRoomId)
            if (data.payload?.gameState) {
              room.gameState = { ...(room.gameState || {}), ...data.payload.gameState }
            }
            if (data.payload?.players) {
              // 同步分值
              for (const p of data.payload.players) {
                for (const [clientWs, clientPlayer] of room.clients.entries()) {
                  if (clientPlayer.id === p.id) {
                    room.clients.set(clientWs, { ...clientPlayer, score: p.score })
                  }
                }
              }
            }
            broadcastToRoom(currentRoomId, ws, message.toString())
          }
          return
        }

        // 心跳 Ping
        if (type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }))
          return
        }

        // 房间内其他消息透传广播 (庆祝彩带、快捷气泡)
        if (currentRoomId) {
          broadcastToRoom(currentRoomId, ws, message.toString())
        }
      } catch (err) {
        console.error('[WS] 消息解析错误:', err)
      }
    })

    ws.on('close', () => {
      if (currentRoomId) {
        const room = getRoomState(currentRoomId)
        room.clients.delete(ws)
        const remainingPlayers = Array.from(room.clients.values())

        if (remainingPlayers.length === 0) {
          rooms.delete(currentRoomId)
        } else {
          // 若离线的是画师，自动移交给剩余首位玩家
          if (room.gameState && !remainingPlayers.some(p => p.id === room.gameState.currentDrawerId)) {
            room.gameState.currentDrawerId = remainingPlayers[0].id
          }
          broadcastToAllInRoom(currentRoomId, JSON.stringify({
            type: 'ROOM_PLAYERS_UPDATED',
            payload: { players: remainingPlayers, gameState: room.gameState }
          }))
        }
        console.log(`[WS] 玩家离开房间 [${currentRoomId}]，剩余: ${remainingPlayers.length} 人`)
      }
    })

    ws.on('error', (err) => {
      console.error('[WS] Socket 异常:', err)
    })
  })

  // 3. 定时检查开放时段
  setInterval(async () => {
    if (process.env.APP_MODE === 'local') return
    const db = initDb()
    if (!db) return

    try {
      for (const [roomId, room] of rooms.entries()) {
        if (roomId === 'draw' || roomId === 'english') continue

        const [dbRoom] = await db.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).limit(1)
        if (dbRoom && (!dbRoom.isOpen || !isRoomInOpenTime(dbRoom.openStartTime, dbRoom.openEndTime))) {
          console.log(`[WS Room Check] 房间 [${roomId}] 当前未开放，清空 ${room.clients.size} 名在线人员`)
          const closeNotice = JSON.stringify({
            type: 'ROOM_CLOSED_NOTICE',
            reason: '房间已到达非开放时段或已被房主关闭'
          })
          for (const [client] of room.clients.entries()) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(closeNotice)
              client.close(4001, 'Room Closed')
            }
          }
          rooms.delete(roomId)
        }
      }
    } catch (e) {
      // ignore
    }
  }, 30000)

  return wss
}
