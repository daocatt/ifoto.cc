import { useState, useEffect, useCallback, useRef } from 'react'
import { Player, GameState, RoomId } from '../types/game'
import { WORD_DATABASE, WORD_DATABASE_EN } from '../constants/words'
import { triggerCelebration } from '../components/Common/ConfettiEffect'
import { api } from '../services/api'

const SESSION_USER_KEY = 'whiteboard_current_user_v2'
const SESSION_ROOM_KEY = 'whiteboard_current_room_v2'
const SESSION_LAST_ACTIVE_KEY = 'whiteboard_last_active_v2'
const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000 // 4 小时无操作自动失效

function isSessionExpired(): boolean {
  try {
    const lastActive = parseInt(localStorage.getItem(SESSION_LAST_ACTIVE_KEY) || '0')
    return Date.now() - lastActive > IDLE_TIMEOUT_MS
  } catch { return false }
}

function touchActivity() {
  try { localStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(Date.now())) } catch {}
}

export function useGameState(
  onRemoteSceneUpdate?: (elements: readonly any[]) => void,
  onRemoteSceneClear?: () => void
) {
  const [currentUser, setCurrentUser] = useState<Player | null>(() => {
    try {
      if (isSessionExpired()) {
        localStorage.removeItem(SESSION_USER_KEY)
        localStorage.removeItem(SESSION_ROOM_KEY)
        return null
      }
      return JSON.parse(localStorage.getItem(SESSION_USER_KEY) || 'null')
    } catch { return null }
  })
  const [currentRoomId, setCurrentRoomId] = useState<RoomId | null>(() => {
    try {
      if (isSessionExpired()) return null
      return (localStorage.getItem(SESSION_ROOM_KEY) as RoomId) || null
    } catch { return null }
  })
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      if (isSessionExpired()) return []
      const savedUser = JSON.parse(localStorage.getItem(SESSION_USER_KEY) || 'null')
      return savedUser ? [savedUser] : []
    } catch { return [] }
  })
  // 活跃的气泡消息：playerId -> { text, timestamp }
  const [activeChatBubbles, setActiveChatBubbles] = useState<Record<string, { text: string; timestamp: number }>>({})
  const [gameState, setGameState] = useState<GameState>(() => {
    let savedUserId: string | null = null
    try {
      if (!isSessionExpired()) {
        const u = JSON.parse(localStorage.getItem(SESSION_USER_KEY) || 'null')
        savedUserId = u?.id || null
      }
    } catch {}
    return {
      currentDrawerId: savedUserId,
      currentWord: null,
      isWordRevealed: false,
      roundNumber: 1,
      timeLeft: 90,
      totalTime: 90,
      isTimerRunning: false,
      history: []
    }
  })

  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Refs 保持最新值，避免把函数/对象放进 useEffect deps 导致副作用重建
  const currentRoomIdRef = useRef(currentRoomId)
  const currentUserRef = useRef(currentUser)
  const playersRef = useRef(players)
  const gameStateRef = useRef(gameState)
  const pendingScoreRef = useRef(0)
  const onRemoteSceneUpdateRef = useRef(onRemoteSceneUpdate)
  const onRemoteSceneClearRef = useRef(onRemoteSceneClear)
  useEffect(() => { currentRoomIdRef.current = currentRoomId }, [currentRoomId])
  useEffect(() => { currentUserRef.current = currentUser }, [currentUser])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { onRemoteSceneUpdateRef.current = onRemoteSceneUpdate }, [onRemoteSceneUpdate])
  useEffect(() => { onRemoteSceneClearRef.current = onRemoteSceneClear }, [onRemoteSceneClear])

  // ── 1. WebSocket 连接：仅用稳定的 ID 字符串做 deps，绝不放函数引用 ──
  useEffect(() => {
    if (!currentUser?.id || !currentRoomId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomId: currentRoomId, payload: { player: currentUser } }))

      // 每 25 秒发一次心跳，防止熄屏/网络挂起被服务端误判为掉线
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }))
        }
      }, 25_000)

      // WS 关闭时同步清除心跳定时器
      ws.addEventListener('close', () => clearInterval(pingInterval), { once: true })
    }

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data)
        if (type === 'SYNC_FULL_STATE') {
          if (payload.players) setPlayers(payload.players)
          if (payload.gameState) setGameState(prev => ({ ...prev, ...payload.gameState }))
          if (payload.elements) onRemoteSceneUpdateRef.current?.(payload.elements)
        } else if (type === 'ROOM_PLAYERS_UPDATED') {
          if (payload.players) setPlayers(payload.players)
          if (payload.gameState) setGameState(prev => ({ ...prev, ...payload.gameState }))
        } else if (type === 'GAME_STATE_UPDATED') {
          if (payload.gameState) setGameState(prev => ({ ...prev, ...payload.gameState }))
          if (payload.players) setPlayers(payload.players)
        } else if (type === 'CANVAS_SCENE_UPDATE') {
          if (payload.elements) onRemoteSceneUpdateRef.current?.(payload.elements)
        } else if (type === 'CANVAS_SCENE_CLEARED') {
          onRemoteSceneClearRef.current?.()
        } else if (type === 'CELEBRATION_EVENT') {
          triggerCelebration(payload.x || 0.5, payload.y || 0.5)
        } else if (type === 'QUICK_CHAT_EVENT') {
          const { playerId, text, timestamp } = payload
          setActiveChatBubbles(prev => ({
            ...prev,
            [playerId]: { text, timestamp }
          }))
          // 3.5秒后自动清除该气泡
          setTimeout(() => {
            setActiveChatBubbles(prev => {
              if (prev[playerId]?.timestamp === timestamp) {
                const next = { ...prev }
                delete next[playerId]
                return next
              }
              return prev
            })
          }, 3500)
        } else if (type === 'ROOM_CLOSED_NOTICE') {
          alert(payload?.reason || '房间已关闭或到达非开放时段，您已被移出房间')
          leaveRoom()
        }
      } catch (e) { console.error('WS parse error:', e) }
    }

    ws.onerror = (e) => console.error('WS error:', e)
    ws.onclose = () => { wsRef.current = null }
    return () => { ws.close() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentRoomId])  // ← 只用 ID，不用对象/函数

  // ── 基础发送（sendWS 引用永久稳定） ──
  const sendWS = useCallback((msg: object) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
  }, [])

  const broadcastState = useCallback((patch: Partial<GameState>, nextPlayers?: Player[]) => {
    sendWS({ type: 'UPDATE_GAME_STATE', roomId: currentRoomIdRef.current, payload: { gameState: patch, players: nextPlayers } })
  }, [sendWS])

  const broadcastCanvasScene = useCallback((elements: readonly any[]) => {
    sendWS({ type: 'SYNC_CANVAS_SCENE', roomId: currentRoomIdRef.current, payload: { elements } })
  }, [sendWS])

  const broadcastClearCanvas = useCallback(() => {
    sendWS({ type: 'CLEAR_CANVAS_SCENE', roomId: currentRoomIdRef.current })
  }, [sendWS])

  // ── 1.5 回合结束时一次性落库当前登录玩家本回合获得的分数（避免每点一次 +1 都写一条记录） ──
  const flushScore = useCallback(() => {
    const gained = pendingScoreRef.current
    if (gained <= 0 || !currentRoomIdRef.current) return
    pendingScoreRef.current = 0
    api.reportScore({
      roomId: currentRoomIdRef.current,
      roomName: currentRoomIdRef.current === 'english' ? '英语猜猜看' : '你画我猜',
      score: gained,
      roundCount: 1
    }).catch(() => {})
  }, [])

  // ── 2. 加入/切换房间 ──
  const joinRoom = useCallback((name: string, avatar: string, roomId: RoomId) => {
    // 优先复用 localStorage 中已有的 player ID（同一浏览器再次进入保持同一身份）
    let existingUser: Player | null = null
    try { existingUser = JSON.parse(localStorage.getItem(SESSION_USER_KEY) || 'null') } catch {}

    const user: Player = {
      id: existingUser?.id || ('u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      name: name.trim() || '玩家', avatar, score: 0
    }
    setCurrentUser(user)
    setCurrentRoomId(roomId)
    setPlayers(prev => {
      const exists = prev.find(p => p.id === user.id)
      if (exists) return prev.map(p => p.id === user.id ? { ...p, name: user.name, avatar: user.avatar } : p)
      return [user, ...prev]
    })
    setGameState(prev => ({
      ...prev,
      currentDrawerId: prev.currentDrawerId || user.id
    }))
    touchActivity()
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
    localStorage.setItem(SESSION_ROOM_KEY, roomId)
  }, [])

  const leaveRoom = useCallback(() => {
    setCurrentRoomId(null)
    localStorage.removeItem(SESSION_ROOM_KEY)
    wsRef.current?.close()
  }, [])

  // ── 3. 倒计时心跳（sendWS 稳定，不会无限重建 effect） ──
  useEffect(() => {
    if (!gameState.isTimerRunning || gameState.timeLeft <= 0) return
    timerRef.current = setTimeout(() => {
      setGameState(prev => {
        const next = { ...prev, timeLeft: prev.timeLeft - 1 }
        if (next.timeLeft === 0) {
          next.isTimerRunning = false
          flushScore()
          sendWS({ type: 'UPDATE_GAME_STATE', roomId: currentRoomIdRef.current, payload: { gameState: { isTimerRunning: false, timeLeft: 0 } } })
        }
        return next
      })
    }, 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [gameState.isTimerRunning, gameState.timeLeft, sendWS, flushScore])

  // ── 4. 加减分 ──
  const addScore = useCallback((playerId: string, delta: number, event?: React.MouseEvent) => {
    setPlayers(prev => {
      const next = prev.map(p => p.id === playerId ? { ...p, score: Math.max(0, p.score + delta) } : p)
      broadcastState({}, next)
      return next
    })
    if (delta > 0) {
      const x = event ? event.clientX / window.innerWidth : 0.5
      const y = event ? event.clientY / window.innerHeight : 0.5
      triggerCelebration(x, y)
      sendWS({ type: 'CELEBRATION_EVENT', roomId: currentRoomIdRef.current, payload: { x, y } })

      // 仅当被加分玩家是当前登录者时累计，待回合结束时统一落库
      if (playerId === currentUserRef.current?.id) {
        pendingScoreRef.current += delta
      }
    }
  }, [broadcastState, sendWS])

  // ── 5. 抽词（英语猜猜看房间专属使用英文词库，你画我猜房间使用中文词库） ──
  const drawWord = useCallback((category = 'ALL') => {
    const isEnglishRoom = currentRoomIdRef.current === 'english'
    const baseDatabase = isEnglishRoom ? WORD_DATABASE_EN : WORD_DATABASE
    const pool = category === 'ALL' ? baseDatabase : baseDatabase.filter(w => w.category === category)
    const selected = pool[Math.floor(Math.random() * pool.length)] || baseDatabase[0]
    setGameState(prev => {
      const next: Partial<GameState> = { currentWord: selected, isWordRevealed: true, timeLeft: prev.totalTime, isTimerRunning: true }
      broadcastState(next)
      return { ...prev, ...next }
    })
  }, [broadcastState])

  // 查看/隐藏题目（仅画师本地，不广播）
  const toggleRevealWord = useCallback(() => {
    setGameState(prev => ({ ...prev, isWordRevealed: !prev.isWordRevealed }))
  }, [])

  const startTimer = useCallback(() => {
    setGameState(prev => { const n = { ...prev, isTimerRunning: true }; broadcastState({ isTimerRunning: true }); return n })
  }, [broadcastState])

  const pauseTimer = useCallback(() => {
    setGameState(prev => { const n = { ...prev, isTimerRunning: false }; broadcastState({ isTimerRunning: false }); return n })
  }, [broadcastState])

  const resetTimer = useCallback((newTotal?: number) => {
    setGameState(prev => {
      const total = newTotal ?? prev.totalTime
      const patch = { timeLeft: total, totalTime: total, isTimerRunning: false }
      broadcastState(patch)
      return { ...prev, ...patch }
    })
  }, [broadcastState])

  // ── 6. 换画师（读 ref，不依赖 state/players 闭包） ──
  const getNextDrawerId = useCallback(() => {
    const pp = playersRef.current
    const gs = gameStateRef.current
    if (!pp.length) return gs.currentDrawerId
    const idx = pp.findIndex(p => p.id === gs.currentDrawerId)
    return pp[(idx + 1) % pp.length]?.id || pp[0].id
  }, [])

  const passDrawer = useCallback(() => {
    const nextId = getNextDrawerId()
    const patch: Partial<GameState> = {
      currentDrawerId: nextId, currentWord: null, isWordRevealed: false,
      timeLeft: gameStateRef.current.totalTime, isTimerRunning: false
    }
    setGameState(prev => ({ ...prev, ...patch }))
    flushScore()
    broadcastState(patch)
  }, [getNextDrawerId, broadcastState, flushScore])

  const nextRound = useCallback(() => {
    const nextId = getNextDrawerId()
    const gs = gameStateRef.current
    const historyItem = gs.currentWord ? {
      round: gs.roundNumber, word: gs.currentWord.word, winnerId: null, timestamp: Date.now()
    } : null
    const patch: Partial<GameState> = {
      roundNumber: gs.roundNumber + 1,
      currentDrawerId: nextId,
      currentWord: null,
      isWordRevealed: false,
      timeLeft: gs.totalTime,
      isTimerRunning: false,
      history: historyItem ? [historyItem, ...gs.history].slice(0, 20) : gs.history
    }
    setGameState(prev => ({ ...prev, ...patch }))
    flushScore()
    broadcastState(patch)
  }, [getNextDrawerId, broadcastState, flushScore])

  const sendQuickChat = useCallback((text: string) => {
    if (!currentUser?.id) return
    const now = Date.now()
    // 1. 本地立即触发气泡展示，零延迟
    setActiveChatBubbles(prev => ({
      ...prev,
      [currentUser.id]: { text, timestamp: now }
    }))
    setTimeout(() => {
      setActiveChatBubbles(prev => {
        if (prev[currentUser.id]?.timestamp === now) {
          const next = { ...prev }
          delete next[currentUser.id]
          return next
        }
        return prev
      })
    }, 3500)

    // 2. 通过 WS 广播给房间其他玩家
    sendWS({ type: 'QUICK_CHAT_EVENT', roomId: currentRoomIdRef.current, payload: { text, playerId: currentUser.id, timestamp: now } })
  }, [currentUser?.id, sendWS])

  return {
    currentUser, currentRoomId, players, gameState, activeChatBubbles,
    joinRoom, leaveRoom, addScore, passDrawer, drawWord,
    toggleRevealWord, startTimer, pauseTimer, resetTimer, nextRound,
    broadcastCanvasScene, broadcastClearCanvas, sendQuickChat
  }
}
