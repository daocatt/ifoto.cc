import React from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface TimerControlProps {
  timeLeft: number
  totalTime: number
  isRunning: boolean
  isDrawer?: boolean
  onStart: () => void
  onPause: () => void
  onReset: (time?: number) => void
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}

export const TimerControl: React.FC<TimerControlProps> = ({
  timeLeft,
  totalTime,
  isRunning,
  isDrawer = false,
  onStart,
  onPause,
  onReset
}) => {
  const percentage = totalTime > 0 ? Math.max(0, Math.min(100, (timeLeft / totalTime) * 100)) : 0
  const isUrgent = timeLeft > 0 && timeLeft <= 15

  return (
    <div className="flex items-center justify-between w-full gap-2 bg-paper/80 px-2.5 py-1 rounded-[8px] border border-edge/60">
      {/* 左侧：倒计时数字与长条形进度条 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={`text-xs font-mono font-medium tracking-tight shrink-0 ${
            isUrgent ? 'text-danger-deep animate-pulse' : 'text-ink'
          }`}
        >
          {formatTime(timeLeft)}
        </span>

        {/* 动态主进度条 */}
        <div className="flex-1 h-1.5 bg-warm rounded-full overflow-hidden border border-edge/30">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isUrgent ? 'bg-danger-deep' : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 右侧控制按钮：仅出题人可见 */}
      {isDrawer && (
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-edge/60">
          {isRunning ? (
            <button
              onClick={onPause}
              className="w-5 h-5 rounded-md bg-warm hover:bg-edge/80 text-ink flex items-center justify-center cursor-pointer transition-colors active:scale-95 border border-edge/40"
              title="暂停倒计时"
            >
              <Pause className="w-2.5 h-2.5" />
            </button>
          ) : (
            <button
              onClick={onStart}
              className="w-5 h-5 rounded-md bg-primary hover:bg-primary-hover text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95 shadow-xs"
              title="开始倒计时"
            >
              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={() => onReset()}
            className="w-5 h-5 rounded-md bg-warm hover:bg-edge/80 text-ink-soft hover:text-ink flex items-center justify-center cursor-pointer transition-colors active:scale-95 border border-edge/40"
            title="重置倒计时"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  )
}
