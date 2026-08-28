// 前端统一 API 客户端
const TOKEN_KEY = 'whiteboard_auth_token_v2'
const USER_KEY = 'whiteboard_auth_user_v2'
const LAST_ROOM_KEY = 'whiteboard_last_room_v2'

export interface ApiUser {
  id: string
  uid?: number
  email: string
  name: string
  role: 'admin' | 'user'
  avatarKey: string
  isStatsPublic?: boolean
  createdAt?: string
}

export interface ApiRoom {
  id: string
  name: string
  type: 'draw' | 'english'
  isOpen: boolean
  rawIsOpen?: boolean
  effectiveIsOpen?: boolean
  openStartTime?: string | null
  openEndTime?: string | null
  isPublic?: boolean
  hasPassword?: boolean
  isSystem?: boolean
  ownerName?: string
  ownerAvatar?: string
  createdAt?: string
}

export interface SystemStatus {
  mode: 'local' | 'online'
  allowRegister: boolean
  domain: string
  needsInitAdmin: boolean
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getStoredUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function setStoredUser(user: ApiUser | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function getLastPlayedRoom(): string | null {
  return localStorage.getItem(LAST_ROOM_KEY)
}

export function setLastPlayedRoom(roomId: string) {
  localStorage.setItem(LAST_ROOM_KEY, roomId)
}

async function request<T>(path: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const timeoutMs = options.timeoutMs || 8000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(path, {
      ...options,
      headers,
      signal: controller.signal
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || `请求失败 (${res.status})`)
    }
    return data as T
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  // 1. 系统状态 (快速 600ms 探针，超时瞬间降级为本地免登录模式，0 延迟秒开)
  getStatus: () =>
    request<SystemStatus>('/api/status', { timeoutMs: 600 }).catch(() => ({
      mode: 'local' as const,
      allowRegister: true,
      domain: window.location.origin,
      needsInitAdmin: false
    })),

  // 2. 超管初始化
  initAdmin: (payload: { email: string; name: string; password: string; avatarKey?: string }) =>
    request<{ message: string; token: string; user: ApiUser }>('/api/init-admin', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // 3. 认证
  register: (payload: { email: string; name: string; password: string; avatarKey?: string }) =>
    request<{ message: string; token: string; user: ApiUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () => request<{ user: ApiUser }>('/api/auth/me'),

  // 4. 个人主页与设置
  updateProfile: (payload: { name?: string; avatarKey?: string; oldPassword?: string; newPassword?: string; isStatsPublic?: boolean }) =>
    request<{ message: string; user: ApiUser }>('/api/profile/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  getUserProfile: (userId: string) =>
    request<{ user: ApiUser; stats: { totalGames: number; totalScore: number }; records: any[] }>(`/api/profile/${userId}`),

  // 5. 房间系统
  getPublicRooms: () => request<{ rooms: ApiRoom[] }>('/api/rooms/public'),

  getMyRoom: () => request<{ room: ApiRoom | null }>('/api/rooms/my'),

  saveMyRoom: (payload: {
    name: string
    type?: 'draw' | 'english'
    password?: string
    isOpen?: boolean
    openStartTime?: string | null
    openEndTime?: string | null
    isPublic?: boolean
  }) =>
    request<{ message: string; room: ApiRoom }>('/api/rooms/my', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  verifyRoomPassword: (roomId: string, password?: string) =>
    request<{ valid: boolean; error?: string }>('/api/rooms/verify-password', {
      method: 'POST',
      body: JSON.stringify({ roomId, password })
    }),

  getRoomDetails: (roomId: string) =>
    request<{ room: ApiRoom }>(`/api/rooms/${roomId}`),

  // 6. 计分战绩
  reportScore: (payload: { roomId: string; roomName?: string; score: number; roundCount?: number }) =>
    request<{ message: string }>('/api/scores', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMyScores: () => request<{ records: any[] }>('/api/scores/my'),

  getScoreSummary: () => request<{ summary: ScoreSummary | null }>('/api/scores/summary')
}

export interface ScoreSummary {
  totalGames: number
  totalScore: number
  bestScore: number
  lowestScore: number
  avgScore: number
}
