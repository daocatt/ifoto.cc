import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ExcalidrawBoard } from './components/Whiteboard/ExcalidrawBoard'
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
import { useGameState } from './hooks/useGameState'
import { api, ApiUser, getStoredUser, setStoredToken, setStoredUser, setLastPlayedRoom } from './services/api'
import { RoomId } from './types/game'

export function App() {
  const [appMode, setAppMode] = useState<'local' | 'online'>('local')
  const [allowRegister, setAllowRegister] = useState(true)
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(getStoredUser())
  const [viewUserUid, setViewUserUid] = useState<string | null>(null)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    // 自动解析 /u/:uid 个人主页链接
    const path = window.location.pathname
    const match = path.match(/^\/u\/([0-9a-zA-Z_-]+)/)
    if (match && match[1]) {
      return 'profile'
    }
    if (path === '/help') return 'help'
    try {
      const savedRoom = localStorage.getItem('whiteboard_current_room_v2')
      const savedUser = localStorage.getItem('whiteboard_current_user_v2')
      if (savedRoom && savedUser) {
        return 'game'
      }
    } catch {}
    return 'home'
  })
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null)
  const [appLoading, setAppLoading] = useState(true)
  const [appError, setAppError] = useState<string | null>(null)

  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const isApplyingRemoteRef = useRef(false)
  const remoteApplyTimerRef = useRef<NodeJS.Timeout | null>(null)
  const syncThrottleTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 1. 初始化系统状态与鉴权探针
  useEffect(() => {
    const initApp = async () => {
      const path = window.location.pathname
      const match = path.match(/^\/u\/([0-9a-zA-Z_-]+)/)
      if (match && match[1]) {
        setViewUserUid(match[1])
      }
      try {
        const status = await api.getStatus()
        setAppMode(status.mode)
        setAllowRegister(status.allowRegister)

        if (status.mode === 'online') {
          if (status.needsInitAdmin) {
            setCurrentRoute('init-admin')
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
  }, [])

  // 2. 监听 URL Hash（例如邀请链接 /#/room/my-room-123）
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash.startsWith('#/room/')) {
        const roomId = hash.replace('#/room/', '').trim()
        if (roomId) {
          setTargetRoomId(roomId)
          // 若已登录或是本地模式，直接进入游戏
          if (appMode === 'local' || currentUser) {
            handleJoinRoom(roomId)
          } else {
            // 未登录线上模式，跳转至登录页
            setCurrentRoute('login')
          }
        }
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [appMode, currentUser])

  // 3. 画布居中与协同回调
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

  // 3. 远端白板笔迹同步回调
  const handleRemoteSceneUpdate = (remoteElements: readonly any[]) => {
    if (!excalidrawAPIRef.current) return
    isApplyingRemoteRef.current = true
    excalidrawAPIRef.current.updateScene({ elements: remoteElements as any })

    if (remoteApplyTimerRef.current) clearTimeout(remoteApplyTimerRef.current)
    remoteApplyTimerRef.current = setTimeout(() => {
      isApplyingRemoteRef.current = false
    }, 50)
  }

  // 3.1 远端清空画布回调
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

  // 4. 游戏状态 Hook
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

  // 5. 判断当前画师
  const isDrawer = gameUser?.id === gameState.currentDrawerId

  // 6. 跨端笔迹本地变更防抖广播
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

  // 7. 清空画布（彻底清空笔迹，并锁定保持画笔 freedraw 工具，不跳回 selection 鼠标）
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

  // 8. 进入指定房间
  const handleJoinRoom = (roomId: string) => {
    const userToJoin = currentUser
      ? { name: currentUser.name, avatar: currentUser.avatarKey }
      : { name: '玩家', avatar: 'voxel_01' }

    joinRoom(userToJoin.name, userToJoin.avatar, roomId as RoomId, currentUser?.id)
    setLastPlayedRoom(roomId)
    setCurrentRoute('game')

    setTimeout(() => {
      if (excalidrawAPIRef.current) {
        centerCanvasStage(excalidrawAPIRef.current)
      }
    }, 150)
  }

  // 9. 本地选房入房
  const handleLocalJoin = (name: string, avatar: string, roomId: RoomId) => {
    joinRoom(name, avatar, roomId)
    setLastPlayedRoom(roomId)
    setCurrentRoute('game')

    setTimeout(() => {
      if (excalidrawAPIRef.current) {
        centerCanvasStage(excalidrawAPIRef.current)
      }
    }, 150)
  }

  // 9. 登出
  const handleLogout = () => {
    setStoredToken(null)
    setStoredUser(null)
    setCurrentUser(null)
    setCurrentRoute('home')
  }

  // 10. 离开房间返回大厅
  const handleLeaveGame = () => {
    leaveRoom()
    if (appMode === 'local') {
      setCurrentRoute('local-lobby')
    } else {
      setCurrentRoute('lobby')
    }
  }

  // 11. 首页“立即开启”点击处理
  const handleStartFromHome = () => {
    if (appMode === 'local') {
      setCurrentRoute('local-lobby')
    } else {
      if (currentUser) {
        setCurrentRoute('lobby')
      } else {
        setCurrentRoute('login')
      }
    }
  }

  // 12. 登录/注册成功后重定向
  const handleAuthSuccess = (user: ApiUser) => {
    setCurrentUser(user)
    if (targetRoomId) {
      const room = targetRoomId
      setTargetRoomId(null)
      handleJoinRoom(room)
    } else {
      setCurrentRoute('lobby')
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

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-paper text-ink">
      {/* 顶部统一导航栏 (仅在非全屏游戏房间时常驻展示) */}
      {currentRoute !== 'game' && (
        <Navbar
          mode={appMode}
          currentUser={currentUser}
          currentRoute={currentRoute}
          onNavigate={(r) => setCurrentRoute(r)}
          onLogout={handleLogout}
        />
      )}

      {/* 主视图区域根据当前路由切换 */}
      <main className="flex-1 overflow-y-auto relative">
        {/* 1. 首页 */}
        {currentRoute === 'home' && (
          <HomePage onStart={handleStartFromHome} />
        )}

        {/* 2. 本地模式独立选房页面 */}
        {currentRoute === 'local-lobby' && (
          <LocalLobbyPage
            initialRoom={currentRoomId || 'draw'}
            onJoin={handleLocalJoin}
          />
        )}

        {/* 3. 线上大厅页面 */}
        {currentRoute === 'lobby' && currentUser && (
          <OnlineLobbyPage
            currentUser={currentUser}
            onJoinRoom={(roomId) => handleJoinRoom(roomId)}
            onNavigate={(r) => setCurrentRoute(r)}
          />
        )}

        {/* 4. 认证页面 (登录/注册/超管初始化) */}
        {(currentRoute === 'login' || currentRoute === 'register' || currentRoute === 'init-admin') && (
          <AuthPage
            type={currentRoute as 'login' | 'register' | 'init-admin'}
            allowRegister={allowRegister}
            onSuccess={handleAuthSuccess}
            onNavigate={(r) => setCurrentRoute(r)}
          />
        )}

        {/* 5. 个人主页 */}
        {currentRoute === 'profile' && currentUser && (
          <ProfilePage
            currentUser={currentUser}
            viewUserId={viewUserUid}
            onNavigate={(r) => {
              setViewUserUid(null)
              setCurrentRoute(r)
            }}
          />
        )}

        {/* 6. 个人设置页面 */}
        {currentRoute === 'help' && (
          <HelpPage onNavigate={(r) => setCurrentRoute(r)} />
        )}

        {currentRoute === 'settings' && currentUser && (
          <SettingsPage
            currentUser={currentUser}
            onUserUpdated={(u) => setCurrentUser(u)}
            onNavigate={(r) => setCurrentRoute(r)}
          />
        )}

        {/* 7. 游戏全屏房间 (画板全屏沉浸 + 左上角退出 + 右上角悬浮毛玻璃 HUD) */}
        {currentRoute === 'game' && (
          <div className="w-full h-full relative overflow-hidden">
            {/* 100% 满屏画板 */}
            <ExcalidrawBoard
              isDrawer={isDrawer}
              onApiReady={(api) => {
                excalidrawAPIRef.current = api
                centerCanvasStage(api)
              }}
              onChange={handleExcalidrawChange}
            />

            {/* 左上角退出游戏按钮 (无阴影、小圆角) */}
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
              currentRoomId={currentRoomId}
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
