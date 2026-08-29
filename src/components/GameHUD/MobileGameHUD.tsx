import React, { useState } from 'react'
import { Trophy, ChevronDown } from 'lucide-react'
import { Player, GameState } from '../../types/game'
import { VoxelAvatar } from '../Common/VoxelAvatar'
import { PlayerScoreCard } from './PlayerScoreCard'
import { DrawControls } from './DrawControls'

interface MobileGameHUDProps {
  currentUser: Player | null
  players: Player[]
  gameState: GameState
  scoresAwarded: boolean
  activeChatBubbles?: Record<string, { text: string; timestamp: number }>
  onAddScore: (id: string, delta: number, event: React.MouseEvent) => void
  onDrawWord: () => void
  onNextRound: () => void
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export const MobileGameHUD: React.FC<MobileGameHUDProps> = ({
  currentUser,
  players,
  gameState,
  scoresAwarded,
  activeChatBubbles = {},
  onAddScore,
  onDrawWord,
  onNextRound
}) => {
  const [showScores, setShowScores] = useState(false)

  const currentDrawerId = gameState.currentDrawerId || players[0]?.id
  const isDrawer = Boolean(currentUser && currentDrawerId && currentUser.id === currentDrawerId)

  // 排序：出题画师置顶，其余按积分降序
  const drawerPlayer = players.find(p => p.id === currentDrawerId)
  const otherPlayers = players.filter(p => p.id !== currentDrawerId).sort((a, b) => b.score - a.score)
  const displayPlayers = drawerPlayer ? [drawerPlayer, ...otherPlayers] : [...players].sort((a, b) => b.score - a.score)
  const topThree = displayPlayers.slice(0, 3)

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* 右上角：倒计时 + 头像堆叠 + 展开积分榜 */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-auto max-w-[45vw]">
        {/* 倒计时胶囊（与顶部工具栏同高） */}
        <div className="bg-card/90 backdrop-blur-md border border-edge/70 rounded-lg px-3 py-1.5 shadow-xs select-none">
          <span
            className={`font-mono text-base font-bold tabular-nums ${
              gameState.isTimerRunning ? 'text-primary' : 'text-ink-soft'
            }`}
          >
            {formatTime(gameState.timeLeft)}
          </span>
        </div>

        {/* 头像堆叠（最多3个） */}
        <button
          onClick={() => setShowScores(s => !s)}
          className="flex items-center gap-1 bg-card/90 backdrop-blur-md border border-edge/70 rounded-full pl-1 pr-1.5 py-1 shadow-xs cursor-pointer transition-all active:scale-95"
          title="点击展开/收起积分榜"
        >
          <div className="flex -space-x-2">
            {topThree.map(p => (
              <VoxelAvatar
                key={p.id}
                avatarKey={p.avatar}
                size={28}
                className="border-2 border-card rounded-full shrink-0"
              />
            ))}
            {players.length === 0 && <VoxelAvatar avatarKey="voxel_01" size={28} className="border-2 border-card rounded-full" />}
          </div>
          <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
            <Trophy className="w-3 h-3 text-gold" />
            {players.length}
            <ChevronDown className={`w-3 h-3 transition-transform ${showScores ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {/* 展开的积分榜 */}
        {showScores && (
          <div className="w-44 max-h-[45vh] overflow-y-auto bg-card/95 backdrop-blur-md border border-edge/70 rounded-lg shadow-md flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-ink border-b border-edge/60 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-gold" />
              积分榜
            </div>
            <div className="flex flex-col divide-y divide-edge/40">
              {displayPlayers.map(p => (
                <PlayerScoreCard
                  key={p.id}
                  player={p}
                  onAddScore={onAddScore}
                  isDrawer={p.id === currentDrawerId}
                  isCurrentUserDrawer={isDrawer}
                  compact={false}
                  chatBubbleText={activeChatBubbles[p.id]?.text}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 中间偏下：出题按钮 / 下一轮（仅出题人） */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-24 pointer-events-auto">
        <DrawControls
          currentWord={gameState.currentWord}
          isDrawer={isDrawer}
          timeLeft={gameState.timeLeft}
          scoresAwarded={scoresAwarded}
          onDrawWord={onDrawWord}
          onNextRound={onNextRound}
          variant="mobile"
        />
      </div>
    </div>
  )
}