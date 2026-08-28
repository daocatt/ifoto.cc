import React, { useState } from 'react'
import { Trophy, ChevronDown, ChevronUp, Palette, Crown } from 'lucide-react'
import { Player, GameState, RoomId } from '../../types/game'
import { PlayerScoreCard } from './PlayerScoreCard'
import { TimerControl } from './TimerControl'
import { WordDrawerModal } from './WordDrawerModal'
import { Button } from '../Common/Button'

interface ScoreboardPanelProps {
  currentRoomId?: RoomId | null
  currentUser?: Player | null
  players: Player[]
  gameState: GameState
  activeChatBubbles?: Record<string, { text: string; timestamp: number }>
  onLeaveRoom?: () => void
  onAddScore: (id: string, delta: number, event: React.MouseEvent) => void
  onPassDrawer: () => void
  onDrawWord: (category?: string) => void
  onToggleReveal: () => void
  onStartTimer: () => void
  onPauseTimer: () => void
  onResetTimer: (time?: number) => void
  onNextRound: (winnerId?: string) => void
  onClearCanvas: () => void
}

export const ScoreboardPanel: React.FC<ScoreboardPanelProps> = ({
  currentRoomId,
  currentUser,
  players,
  gameState,
  activeChatBubbles = {},
  onLeaveRoom,
  onAddScore,
  onPassDrawer,
  onDrawWord,
  onToggleReveal,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onNextRound,
  onClearCanvas
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const currentDrawerId = gameState.currentDrawerId || players[0]?.id
  const isCurrentUserDrawer = Boolean(currentUser && currentDrawerId && currentUser.id === currentDrawerId)
  const currentDrawer = players.find(p => p.id === currentDrawerId) || players[0]
  const isMultiPlayer = players.length >= 4

  // 排序：出题画师始终置顶排在第 1 个位置，其余玩家按积分降序排列在其后
  const drawerPlayer = players.find(p => p.id === currentDrawerId)
  const otherPlayers = players
    .filter(p => p.id !== currentDrawerId)
    .sort((a, b) => b.score - a.score)
  const displayPlayers = drawerPlayer ? [drawerPlayer, ...otherPlayers] : [...players].sort((a, b) => b.score - a.score)
  const topScorer = [...players].sort((a, b) => b.score - a.score)[0]

  return (
    <>
      {/* 
        整体上移至 top-3 right-3，宽度适中 w-64，布局整洁不遮挡
      */}
      <div className="absolute top-3 right-3 z-30 w-64 max-w-[calc(100vw-1.5rem)] flex flex-col gap-1.5 transition-all duration-200">
        {/* 板块 1：顶部主控制卡片 (Excalidraw 浮岛设计) */}
        <div className="bg-card/95 backdrop-blur-md p-2 rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col gap-1.5 select-none">
          {/* 第一行：[🏆图标] [🧩 puzzle 房间] ······ [👑榜首] [∧/∨ 折叠] */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-md bg-tint flex items-center justify-center text-primary shrink-0 border border-primary/20">
                <Trophy className="w-3 h-3" />
              </div>

              {currentRoomId && (
                <button
                  onClick={onLeaveRoom}
                  className="text-[11px] bg-warm hover:bg-edge/80 text-ink px-2 py-0.5 rounded-md font-normal shrink-0 flex items-center gap-1 cursor-pointer transition-colors border border-edge/50"
                  title="点击切换房间"
                >
                  <span>{currentRoomId === 'english' ? '🔤' : '🎨'}</span>
                  <span className="font-normal">{currentRoomId === 'english' ? '英语猜猜看' : '你画我猜'}</span>
                </button>
              )}

              {topScorer && topScorer.score > 0 && (
                <span className="flex items-center gap-0.5 text-ink-soft text-[10px] truncate">
                  <Crown className="w-2.5 h-2.5 text-gold shrink-0" />
                  <span className="font-normal text-ink truncate max-w-[45px]">{topScorer.name}</span>
                </span>
              )}
            </div>

            {/* 折叠/展开按钮 */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-5 h-5 rounded-md bg-warm hover:bg-edge/80 text-ink flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 border border-edge/40"
              title={isCollapsed ? '展开面板' : '收起面板'}
            >
              {isCollapsed ? <ChevronDown className="w-3 h-3 text-ink-soft" /> : <ChevronUp className="w-3 h-3 text-ink-soft" />}
            </button>
          </div>

          {/* 第二行：倒计时全长展示 1:30 ━━━━━ [▶/⏸] [⟲] */}
          <TimerControl
            timeLeft={gameState.timeLeft}
            totalTime={gameState.totalTime}
            isRunning={gameState.isTimerRunning}
            isDrawer={isCurrentUserDrawer}
            onStart={onStartTimer}
            onPause={onPauseTimer}
            onReset={onResetTimer}
          />
        </div>

        {/* 展开内容区 */}
        {!isCollapsed && (
          <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* 板块 2：题词出题区 (WordDrawerModal 内部采用浮岛样式) */}
            <WordDrawerModal
              currentWord={gameState.currentWord}
              currentDrawer={currentDrawer}
              currentUser={currentUser}
              isRevealed={gameState.isWordRevealed}
              roundNumber={gameState.roundNumber}
              timeLeft={gameState.timeLeft}
              onPassDrawer={onPassDrawer}
              onDrawWord={onDrawWord}
              onToggleReveal={onToggleReveal}
              onNextRound={() => {
                onNextRound()
                onClearCanvas()
              }}
            />

            {/* 板块 3：积分榜卡片 (Excalidraw 浮岛设计 + 内嵌 Table 网格分割线) */}
            <div className="bg-card/95 backdrop-blur-md rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-edge/60 p-2 pb-1.5 px-2.5">
                <span className="text-[11px] font-normal text-ink flex items-center gap-1">
                  <span>积分榜</span>
                  <span className="text-[9px] text-ink-soft bg-warm px-1.5 py-0.2 rounded-md font-mono font-normal">
                    {players.length}人
                  </span>
                </span>

                {isCurrentUserDrawer && (
                  <Button
                    variant="warm"
                    size="sm"
                    className="h-5 px-1.5 text-[10px] font-normal rounded-md"
                    onClick={onClearCanvas}
                    title="清空白板笔迹"
                  >
                    <Palette className="w-2.5 h-2.5" />
                    <span>清画板</span>
                  </Button>
                )}
              </div>

              {/* 玩家列表：类似 table 的浅色贯穿分割线，无缝衔接外边框 */}
              <div className="max-h-60 overflow-y-auto">
                <div
                  className={
                    isMultiPlayer
                      ? 'grid grid-cols-2 bg-edge/40 gap-[1px]'
                      : 'flex flex-col divide-y divide-edge/40'
                  }
                >
                  {displayPlayers.map((player) => (
                    <PlayerScoreCard
                      key={player.id}
                      player={player}
                      onAddScore={onAddScore}
                      isDrawer={player.id === currentDrawerId}
                      isCurrentUserDrawer={isCurrentUserDrawer}
                      compact={isMultiPlayer}
                      chatBubbleText={activeChatBubbles[player.id]?.text}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
