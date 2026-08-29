import { lazy, Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ScoreboardPanel } from './components/GameHUD/ScoreboardPanel'
import { QuickChatDrawer } from './components/GameHUD/QuickChatDrawer'
import { Navbar } from './components/Navigation/Navbar'
import { Loader2, LogOut } from 'lucide-react'
import { HomePage } from './pages/HomePage'
import { LocalLobbyPage } from './pages/LocalLobbyPage'
import { OnlineLobbyPage } from './pages/OnlineLobbyPage'
import { AuthPage } from './pages/AuthPages'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { HelpPage } from './pages/HelpPage'
import { AdminPage } from './pages/AdminPage'
import { useGameState } from './hooks/useGameState'
import { useSEO } from './hooks/useSEO'
import { api, ApiUser, getStoredUser, setStoredToken, setStoredUser, setLastPlayedRoom } from './services/api'
import { RoomId } from './types/game'

// 白板（Excalidraw）体积较大，仅在进入游戏房间时才加载，避免拖慢首页/大厅等首屏
const ExcalidrawBoard = lazy(() =>
  import('./components/Whiteboard/ExcalidrawBoard').then(m => ({ default: m.ExcalidrawBoard }))
)

// ─── URL 路由体系 ───────────────────────────────────────────────
type RouteName =
  | 'home' | 'lobby' | 'game' | 'settings'
  | 'login' | 'register' | 'init-admin' | 'help' | 'profile' | 'admin'

interface Route {
  name: RouteName
  roomId?: string
  uid?: string
}

// 从当前 URL（pathname + 兼容旧 hash 邀请链接）解析出路由对象
function parseLocation(): Route {
  const { pathname, hash } = window.location

  // 兼容旧版邀请链接 /#/room/:roomId
  const hashRoom = hash.match(/^#\/room\/([0-9a-zA-Z_-]+)/)
  if (hashRoom) return { name: 'game', roomId: hashRoom[1] }

  const segs = pathname.split('/').filter(Boolean)
  if (segs.length === 0) return { name: 'home' }
  const [a, b] = segs

  if (a === 'lobby') return { name: 'lobby' }
  if (a === 'room' && b) return { name: 'game', roomId: b }
  if (a === 'settings') return { name: 'settings' }
  if (a === 'login') return { name: 'login' }
  if (a === 'register') return { name: 'register' }
  if (a === 'init-admin') return { name: 'init-admin' }
  if (a === 'help') return { name: 'help' }
  if (a === 'admin') return { name: 'admin' }
  if (a === 'u' && b) return { name: 'profile', uid: b }
  return { name: 'home' }
}

// 路由对象 → 规范 URL
function urlFor(r: Route): string {
  switch (r.name) {
    case 'home': return '/'
    case 'lobby': return '/lobby'
    case 'game': return `/room/${r.roomId || 'draw'}`
    case 'settings': return '/settings'
    case 'login': return '/login'
    case 'register': return '/register'
    case 'init-admin': return '/init-admin'
    case 'help': return '/help'
    case 'admin': return '/admin'
    case 'profile': return `/u/${r.uid || ''}`
    default: return '/'
  }
}

export function App() {
  const [appMode, setAppMode] = useState<'local' | 'online'>('local')
  const [allowRegister, setAllowRegister] = useState(true)
  const [needsInitAdmin, setNeedsInitAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(getStoredUser())
  const [route, setRoute] = useState<Route>(() => parseLocation())
  const [appLoading, setAppLoading] = useState(true)
  const [appError, setAppError] = useState<string | null>(null)

  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const isApplyingRemoteRef = useRef(false)
  const remoteApplyTimerRef = useRef<NodeJS.Timeout | null>(null)
  const syncThrottleTimerRef = useRef<NodeJS.Timeout | null>(null)
  // 未登录线上模式访问房间 → 先登录，成功后回跳该房间
  const pendingJoinRoomIdRef = useRef<string | null>(null)
  // 本地模式自定义玩家身份（昵称/头像）
  const localJoinInfoRef = useRef<{ name: string; avatar: string } | null>(null)

  // ── 统一导航：更新 state 并同步浏览器历史 URL ──
  const go = useCallback((next: Route) => {
    setRoute(next)
    const url = urlFor(next)
    if (window.location.pathname !== url) {
      window.history.pushState({ route: next }, '', url)
    }
  }, [])

  // ── 供 Navbar/各页面 onNavigate 使用：字符串路由名/路径 → 跳转 ──
  const handleNavigate = useCallback((target: string) => {
    // 支持直接传入 /u/100001 或 /room/draw 等标准路径
    if (target.startsWith('/')) {
      const segs = target.split('/').filter(Boolean);
      if (segs.length === 0) return go({ name: 'home' });
      const [a, b] = segs;
      if (a === 'u' && b) return go({ name: 'profile', uid: b });
      if (a === 'room' && b) return go({ name: 'game', roomId: b });
      if (a === 'lobby') return go({ name: 'lobby' });
      if (a === 'settings') return go({ name: 'settings' });
      if (a === 'login') return go({ name: 'login' });
      if (a === 'register') return go({ name: 'register' });
      if (a === 'help') return go({ name: 'help' });
      if (a === 'admin') return go({ name: 'admin' });
      return go({ name: 'home' });
    }

    switch (target) {
      case 'home': return go({ name: 'home' });
      case 'lobby':
      case 'local-lobby': return go({ name: 'lobby' });
      case 'settings': return go({ name: 'settings' });
      case 'login': return go({ name: 'login' });
      case 'register': return go({ name: 'register' });
      case 'init-admin': return go({ name: 'init-admin' });
      case 'help': return go({ name: 'help' });
      case 'admin': return go({ name: 'admin' });
      case 'profile':
        return currentUser?.uid
          ? go({ name: 'profile', uid: String(currentUser.uid) })
          : go({ name: 'lobby' });
      default: return go({ name: 'home' });
    }
  }, [go, currentUser?.uid])

  // ── 画布居中 ──
  const centerCanvasStage = useCallback((api: ExcalidrawImperativeAPI, targetElements?: readonly any[]) => {
    try {
      const RIGHT_PANEL_WIDTH = 272
      const availableWidth = Math.max(300, window.innerWidth - RIGHT_PANEL_WIDTH)
      const viewportHeight = window.innerHeight

      const defaultScrollX = availableWidth / 2
      const defaultScrollY = viewportHeight / 2

      if (targetElements && targetElements.length > 0) {
        api.scrollToContent(targetElements as any, {
          fitToContent: true,
          animate: false
        })
      } else {
        api.updateScene({
          appState: {
            scrollX: defaultScrollX,
            scrollY: defaultScrollY,
            zoom: { value: 1 as any }
          }
        })
      }
    } catch (e) {
      console.warn('Center canvas error:', e)
    }
  }, [])

  // 远端白板笔迹同步回调
  const handleRemoteSceneUpdate = (remoteElements: readonly any[]) => {
    if (!excalidrawAPIRef.current) return
    isApplyingRemoteRef.current = true
    excalidrawAPIRef.current.updateScene({ elements: remoteElements as any })

    if (remoteApplyTimerRef.current) clearTimeout(remoteApplyTimerRef.current)
    remoteApplyTimerRef.current = setTimeout(() => {
      isApplyingRemoteRef.current = false
    }, 50)
  }

  // 远端清空画布回调
  const handleRemoteSceneClear = () => {
    if (!excalidrawAPIRef.current) return
    const appState = excalidrawAPIRef.current.getAppState()
    const activeToolType = appState.activeTool?.type
    const targetTool = (activeToolType && activeToolType !== 'selection') ? activeToolType : 'freedraw'

    excalidrawAPIRef.current.updateScene({
      elements: [],
      appState: {
        activeTool: {
          type: targetTool,
          customType: null,
          locked: true
        } as any
      }
    })
  }

  // ── 游戏状态 Hook ──
  const {
    gameState,
    players,
    currentUser: gameUser,
    currentRoomId,
    activeChatBubbles,
    joinRoom,
    leaveRoom,
    drawWord,
    toggleRevealWord,
    startTimer,
    pauseTimer,
    resetTimer,
    nextRound,
    addScore,
    passDrawer,
    sendQuickChat,
    broadcastCanvasScene,
    broadcastClearCanvas
  } = useGameState(handleRemoteSceneUpdate, handleRemoteSceneClear)

  // ── 判断当前画师 ──
  const isDrawer = gameUser?.id === gameState.currentDrawerId

  // 跨端笔迹本地变更防抖广播
  const handleExcalidrawChange = (elements: readonly any[]) => {
    if (!isDrawer) return
    if (isApplyingRemoteRef.current) return

    if (syncThrottleTimerRef.current) {
      clearTimeout(syncThrottleTimerRef.current)
    }

    syncThrottleTimerRef.current = setTimeout(() => {
      broadcastCanvasScene(elements)
    }, 40)
  }

  // 清空画布
  const handleClearCanvas = () => {
    if (!excalidrawAPIRef.current) return
    const appState = excalidrawAPIRef.current.getAppState()
    const activeToolType = appState.activeTool?.type
    const targetTool = (activeToolType && activeToolType !== 'selection') ? activeToolType : 'freedraw'

    excalidrawAPIRef.current.updateScene({
      elements: [],
      appState: {
        activeTool: {
          type: targetTool,
          customType: null,
          locked: true
        } as any
      }
    })
    centerCanvasStage(excalidrawAPIRef.current)
    broadcastClearCanvas()
  }

  // ── 渲染期鉴权门控：根据 (路由, 模式, 登录态, 是否需要初始化管理员) 同步决定显示什么，避免受保护页闪现 ──
  // 返回 null 表示当前路由可直接渲染；否则返回应回退到的路由
  const gate = useCallback((): Route | null => {
    const isLocal = appMode === 'local'
    switch (route.name) {
      // 房间 / 大厅：线上未登录 → 登录
      case 'game':
      case 'lobby':
        if (!isLocal && !currentUser) return { name: 'login' }
        return null
      // 设置 / 个人主页：需账号（本地模式无账号 → 首页；线上未登录 → 登录）
      case 'settings':
      case 'profile':
        if (isLocal) return { name: 'home' }
        if (!currentUser) return { name: 'login' }
        return null
      // 已登录访问登录/注册页 → 大厅
      case 'login':
      case 'register':
        if (!isLocal && currentUser) return { name: 'lobby' }
        return null
      // 超管初始化：仅当数据库为空时允许
      case 'init-admin':
        if (needsInitAdmin) return null
        return isLocal ? { name: 'home' } : { name: 'lobby' }
      // 管理后台：仅超级管理员可进入
      case 'admin':
        if (isLocal) return { name: 'home' }
        if (!currentUser) return { name: 'login' }
        if (currentUser.role !== 'admin') return { name: 'home' }
        return null
      default:
        return null
    }
  }, [route.name, appMode, currentUser, needsInitAdmin])

  // 实际用于渲染的路由（被门控时回退到登录/首页等，受保护页面绝不渲染）
  const effectiveRoute = gate() ?? route

  // ── 动态 SEO（跟随实际渲染的页面） ──
  const seo = useMemo(() => {
    const base = 'iFOTO 你画我猜'
    const desc = 'iFOTO 开源的有趣益智互动游戏，在线多人实时你画我猜白板。'
    switch (effectiveRoute.name) {
      case 'home': return { title: `${base} · 在线你画我猜互动`, description: desc, path: '/' }
      case 'lobby': return { title: `游戏大厅 · ${base}`, description: '选择或创建房间，开始在线多人你画我猜。', path: '/lobby' }
      case 'game': return { title: `房间 · ${base}`, description: '实时多人你画我猜房间。', path: `/room/${effectiveRoute.roomId || 'draw'}` }
      case 'settings': return { title: `个人设置 · ${base}`, path: '/settings' }
      case 'login': return { title: `登录 · ${base}`, path: '/login' }
      case 'register': return { title: `注册 · ${base}`, path: '/register' }
      case 'init-admin': return { title: `初始化管理员 · ${base}`, path: '/init-admin' }
      case 'help': return { title: `关于 iFOTO · 你画我猜`, path: '/help' }
      case 'admin': return { title: `管理后台 · ${base}`, path: '/admin' }
      case 'profile': return { title: `个人主页 · ${base}`, path: `/u/${effectiveRoute.uid || ''}` }
      default: return { title: base, path: '/' }
    }
  }, [effectiveRoute.name, effectiveRoute.roomId, effectiveRoute.uid])
  useSEO(seo)

  // ── 1. 初始化系统状态与鉴权探针 ──
  useEffect(() => {
    const initApp = async () => {
      try {
        const status = await api.getStatus()
        setAppMode(status.mode)
        setAllowRegister(status.allowRegister)
        setNeedsInitAdmin(status.needsInitAdmin)

        if (status.mode === 'online') {
          if (status.needsInitAdmin) {
            go({ name: 'init-admin' })
          } else {
            // 验证登录状态
            try {
              const meRes = await api.getMe()
              setCurrentUser(meRes.user)
              setStoredUser(meRes.user)
            } catch (e) {
              setCurrentUser(null)
              setStoredUser(null)
              setStoredToken(null)
            }
          }
        }
      } catch (e) {
        console.error('Init app status error:', e)
        setAppError('无法连接到服务器，请检查后端服务是否已启动')
      } finally {
        setAppLoading(false)
      }
    }

    initApp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 2. 浏览器前进/后退 → 重新解析 URL 恢复页面 ──
  useEffect(() => {
    const onPop = () => setRoute(parseLocation())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // ── 3. 兼容旧版 Hash 邀请链接 /#/room/:roomId ──
  useEffect(() => {
    const onHash = () => {
      const r = parseLocation()
      setRoute(r)
      // 将 hash 邀请规范化为主流路径
      if (r.name === 'game' && r.roomId) {
        window.history.replaceState({ route: r }, '', urlFor(r))
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ── 4. 游戏路由：进入房间（含在线未登录重定向与本地自定义身份） ──
  useEffect(() => {
    if (appLoading) return // 等系统状态/运行模式确定后再处理房间加入
    if (route.name !== 'game' || !route.roomId) return

    // 在线模式未登录访问房间 → 记录待回跳房间，由渲染期门控显示登录页（保留 /room URL）
    if (appMode === 'online' && !currentUser) {
      pendingJoinRoomIdRef.current = route.roomId
      return
    }

    // 已在目标房间则跳过（用于 F5 刷新恢复会话，避免重复加入）
    if (currentRoomId === route.roomId) return

    const userToJoin = currentUser
      ? { name: currentUser.name, avatar: currentUser.avatarKey }
      : (localJoinInfoRef.current || { name: '玩家', avatar: 'voxel_01' })

    joinRoom(userToJoin.name, userToJoin.avatar, route.roomId as RoomId, currentUser?.id)
    setLastPlayedRoom(route.roomId)
    localJoinInfoRef.current = null

    setTimeout(() => {
      if (excalidrawAPIRef.current) {
        centerCanvasStage(excalidrawAPIRef.current)
      }
    }, 150)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.name, route.roomId, appMode, currentUser, currentRoomId, appLoading])

  // ── 5. 首页会话恢复：刷新 / 时若存在进行中的游戏则回到房间 ──
  const didInitialResumeRef = useRef(false)
  useEffect(() => {
    if (appLoading || didInitialResumeRef.current) return
    didInitialResumeRef.current = true
    if (parseLocation().name !== 'home') return
    try {
      const savedRoom = localStorage.getItem('whiteboard_current_room_v2')
      const savedUser = localStorage.getItem('whiteboard_current_user_v2')
      if (savedRoom && savedUser) {
        go({ name: 'game', roomId: savedRoom })
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLoading])

  // ── 6. 进入房间（仅更新路由，实际加入由上面的路由 effect 处理） ──
  const handleJoinRoom = (roomId: string) => {
    go({ name: 'game', roomId })
  }

  // 本地选房入房（携带自定义昵称/头像）
  const handleLocalJoin = (name: string, avatar: string, roomId: RoomId) => {
    localJoinInfoRef.current = { name, avatar }
    go({ name: 'game', roomId })
  }

  // 登出
  const handleLogout = () => {
    setStoredToken(null)
    setStoredUser(null)
    setCurrentUser(null)
    go({ name: 'home' })
  }

  // 离开房间返回大厅
  const handleLeaveGame = () => {
    leaveRoom()
    go({ name: 'lobby' })
  }

  // 首页“立即开启”点击处理
  const handleStartFromHome = () => {
    if (appMode === 'local') {
      go({ name: 'lobby' })
    } else if (currentUser) {
      go({ name: 'lobby' })
    } else {
      go({ name: 'login' })
    }
  }

  // 登录/注册成功后重定向（优先回到先前想进的房间）
  const handleAuthSuccess = (user: ApiUser) => {
    setCurrentUser(user)
    if (pendingJoinRoomIdRef.current) {
      const room = pendingJoinRoomIdRef.current
      pendingJoinRoomIdRef.current = null
      go({ name: 'game', roomId: room })
    } else {
      go({ name: 'lobby' })
    }
  }

  if (appLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-paper text-ink gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs text-ink-soft font-bold tracking-wide">正在初始化...</span>
      </div>
    )
  }

  if (appError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-paper text-ink gap-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-base font-bold text-ink">服务连接失败</h2>
        <p className="text-xs text-ink-soft max-w-xs text-center">{appError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white cursor-pointer hover:bg-primary-hover transition-colors"
        >
          重新连接
        </button>
      </div>
    )
  }

  const roomId = effectiveRoute.roomId || currentRoomId || 'draw'

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-paper text-ink">
      {/* 顶部统一导航栏 (仅在非全屏游戏房间时常驻展示) */}
      {effectiveRoute.name !== 'game' && (
        <Navbar
          mode={appMode}
          currentUser={currentUser}
          currentRoute={effectiveRoute.name}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* 主视图区域根据当前路由切换 */}
      <main className="flex-1 overflow-y-auto relative">
        {/* 1. 首页 */}
        {effectiveRoute.name === 'home' && (
          <HomePage onStart={handleStartFromHome} />
        )}

        {/* 2. 大厅（本地/线上共用 /lobby，按模式渲染对应页面） */}
        {effectiveRoute.name === 'lobby' && (
          appMode === 'local' ? (
            <LocalLobbyPage
              initialRoom={currentRoomId || 'draw'}
              onJoin={handleLocalJoin}
            />
          ) : currentUser ? (
            <OnlineLobbyPage
              currentUser={currentUser}
              onJoinRoom={handleJoinRoom}
              onNavigate={handleNavigate}
            />
          ) : (
            <AuthPage
              type="login"
              allowRegister={allowRegister}
              onSuccess={handleAuthSuccess}
              onNavigate={handleNavigate}
            />
          )
        )}

        {/* 3. 认证页面 (登录/注册/超管初始化) */}
        {(effectiveRoute.name === 'login' || effectiveRoute.name === 'register' || effectiveRoute.name === 'init-admin') && (
          <AuthPage
            type={effectiveRoute.name as 'login' | 'register' | 'init-admin'}
            allowRegister={allowRegister}
            onSuccess={handleAuthSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {/* 4. 个人主页 */}
        {effectiveRoute.name === 'profile' && currentUser && (
          <ProfilePage
            currentUser={currentUser}
            viewUserId={effectiveRoute.uid}
            onNavigate={handleNavigate}
          />
        )}

        {/* 5. 帮助/关于页面 */}
        {effectiveRoute.name === 'help' && (
          <HelpPage onNavigate={handleNavigate} />
        )}

        {/* 5.1 管理后台（门控保证 currentUser 为非空管理员） */}
        {effectiveRoute.name === 'admin' && (
          <AdminPage currentUser={currentUser!} />
        )}

        {/* 6. 个人设置页面 */}
        {effectiveRoute.name === 'settings' && currentUser && (
          <SettingsPage
            currentUser={currentUser}
            onUserUpdated={(u) => setCurrentUser(u)}
            onNavigate={handleNavigate}
          />
        )}

        {/* 7. 游戏全屏房间 (画板全屏沉浸 + 左上角退出 + 右上角悬浮毛玻璃 HUD) */}
        {effectiveRoute.name === 'game' && (
          <div className="w-full h-full relative overflow-hidden">
            {/* 100% 满屏画板（懒加载） */}
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-paper text-ink gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-xs text-ink-soft font-bold tracking-wide">正在加载画板...</span>
              </div>
            }>
              <ExcalidrawBoard
                isDrawer={isDrawer}
                onApiReady={(api) => {
                  excalidrawAPIRef.current = api
                  centerCanvasStage(api)
                }}
                onChange={handleExcalidrawChange}
              />
            </Suspense>

            {/* 左上角退出游戏按钮 */}
            <button
              onClick={handleLeaveGame}
              className="absolute top-3 left-3 z-30 h-7.5 px-2.5 rounded-md bg-card/95 backdrop-blur-md border border-edge/80 hover:border-coral/60 hover:text-coral hover:bg-warm/70 text-ink text-xs font-normal flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95"
              title="退出当前游戏，返回大厅"
            >
              <LogOut className="w-3.5 h-3.5 text-ink-soft hover:text-coral" />
              <span>退出游戏</span>
            </button>

            {/* 右上角悬浮毛玻璃积分与控制台 */}
            <ScoreboardPanel
              currentRoomId={roomId}
              currentUser={gameUser}
              players={players}
              gameState={gameState}
              activeChatBubbles={activeChatBubbles}
              onLeaveRoom={handleLeaveGame}
              onAddScore={addScore}
              onPassDrawer={passDrawer}
              onDrawWord={drawWord}
              onToggleReveal={toggleRevealWord}
              onStartTimer={startTimer}
              onPauseTimer={pauseTimer}
              onResetTimer={resetTimer}
              onNextRound={nextRound}
              onClearCanvas={handleClearCanvas}
            />

            {/* 底部快速发言抽屉 */}
            <QuickChatDrawer onSendChat={sendQuickChat} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App