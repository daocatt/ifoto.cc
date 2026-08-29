import React from 'react'
import { Dice5, ArrowRight, Clock } from 'lucide-react'
import { WordItem } from '../../types/game'

interface DrawControlsProps {
  currentWord: WordItem | null
  isDrawer: boolean
  timeLeft: number
  /** 本回合是否已产生加分（用于结算提示） */
  scoresAwarded: boolean
  onDrawWord: () => void
  onNextRound: () => void
  /** mobile: 居中大按钮；panel: 适配右侧悬浮面板 */
  variant?: 'mobile' | 'panel'
}

export const DrawControls: React.FC<DrawControlsProps> = ({
  currentWord,
  isDrawer,
  timeLeft,
  scoresAwarded,
  onDrawWord,
  onNextRound,
  variant = 'mobile'
}) => {
  if (!isDrawer) return null

  const isTimeUp = timeLeft <= 0 && !!currentWord

  // 时间到：显示答案 + 下一轮（附结算提示）
  if (isTimeUp) {
    return (
      <div className="flex flex-col items-center gap-2 select-none">
        <div className="flex items-center gap-1.5 text-[10px] text-danger-deep font-normal bg-danger-deep/10 px-2 py-0.5 rounded-md border border-danger-deep/20">
          <Clock className="w-3 h-3" />
          <span>答案：</span>
          <span className="font-medium tracking-wide">{currentWord!.word}</span>
        </div>

        {!scoresAwarded && (
          <div className="text-[10px] text-gold font-normal bg-gold/10 px-2 py-0.5 rounded-md border border-gold/20 animate-in fade-in">
            💡 还没给第一名加分，建议先结算再进入下一轮
          </div>
        )}

        <button
          onClick={onNextRound}
          className={`inline-flex items-center gap-1.5 bg-primary text-white hover:bg-primary-hover shadow-sm font-bold transition-all active:scale-95 cursor-pointer ${
            variant === 'mobile' ? 'px-6 py-2.5 text-sm rounded-xl' : 'px-4 py-1.5 text-xs rounded-md'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>下一轮</span>
        </button>
      </div>
    )
  }

  // 正常游戏：抽题按钮（题目显示在按钮上 + 随机换题）
  return (
    <div
      className={`flex items-center gap-1.5 select-none ${
        variant === 'mobile' ? 'flex-col gap-2' : 'flex-row'
      }`}
    >
      <button
        onClick={() => !currentWord && onDrawWord()}
        className={`inline-flex items-center justify-center bg-primary text-white hover:bg-primary-hover shadow-sm font-bold transition-all active:scale-95 cursor-pointer ${
          variant === 'mobile' ? 'px-7 py-3 text-base rounded-2xl min-w-[10rem]' : 'px-4 py-1.5 text-xs rounded-md'
        }`}
        title={currentWord ? '已出题' : '随机抽一道题'}
      >
        <span className="truncate max-w-[220px]">{currentWord ? currentWord.word : '抽题'}</span>
      </button>

      {currentWord && (
        <button
          onClick={onDrawWord}
          title="换一道题"
          className={`inline-flex items-center justify-center bg-warm hover:bg-edge/80 text-ink border border-edge/60 transition-all active:scale-95 cursor-pointer ${
            variant === 'mobile' ? 'p-2.5 rounded-full' : 'p-1.5 rounded-md'
          }`}
        >
          <Dice5 className={variant === 'mobile' ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
        </button>
      )}
    </div>
  )
}