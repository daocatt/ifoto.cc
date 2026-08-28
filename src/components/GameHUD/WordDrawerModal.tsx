import React, { useState } from 'react'
import { Sparkles, Eye, EyeOff, Shuffle, ArrowRight, BookOpen, Clock } from 'lucide-react'
import { WordItem, Player } from '../../types/game'
import { CATEGORY_LABELS } from '../../constants/words'
import { Button } from '../Common/Button'

interface WordDrawerModalProps {
  currentWord: WordItem | null
  currentDrawer?: Player | null
  currentUser?: Player | null
  isRevealed: boolean
  roundNumber: number
  timeLeft: number
  onPassDrawer: () => void
  onDrawWord: (category?: string) => void
  onToggleReveal: () => void
  onNextRound: () => void
}

export const WordDrawerModal: React.FC<WordDrawerModalProps> = ({
  currentWord,
  currentDrawer,
  currentUser,
  isRevealed,
  roundNumber,
  timeLeft,
  onDrawWord,
  onToggleReveal,
  onNextRound
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  // 判断是否为当前出题画师
  const isCurrentDrawer = currentUser && currentDrawer && currentUser.id === currentDrawer.id
  // 判断是否倒计时结束
  const isTimeUp = timeLeft === 0 && currentWord !== null

  return (
    <div className="bg-card/95 backdrop-blur-md p-2 rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col gap-1.5 select-none">
      {/* 题词头部：[📖] 第 1 轮 ────── [分类下拉] */}
      <div className="flex items-center justify-between border-b border-divider/60 pb-1 px-0.5">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[11px] font-normal text-ink">
            第 <span className="text-primary font-mono font-medium">{roundNumber}</span> 轮
          </span>
        </div>

        {/* 简洁分类下拉选择器 */}
        {isCurrentDrawer ? (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-5 text-[10px] font-normal bg-warm text-ink border border-edge/60 rounded-md px-1.5 focus:outline-none cursor-pointer"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        ) : (
          <span className="text-[10px] font-normal text-ink-soft bg-warm px-1.5 py-0.2 rounded-md">
            {CATEGORY_LABELS[selectedCategory] || '全部'}
          </span>
        )}
      </div>

      {/* 题目展示区（高度紧凑化 min-h-[50px]） */}
      <div className="relative bg-paper/80 rounded-[8px] px-2 py-1.5 border border-edge/60 flex flex-col items-center justify-center min-h-[52px] text-center overflow-hidden">
        {currentWord ? (
          <>
            {/* 倒计时结束：公布答案 */}
            {isTimeUp ? (
              <div className="flex flex-col items-center gap-0.5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-1 text-[9px] text-danger-deep font-normal bg-danger-deep/10 px-1.5 py-0.2 rounded-md">
                  <Clock className="w-2.5 h-2.5" /> 时间到！答案
                </div>
                <span className="text-sm font-medium text-ink tracking-wide">
                  {currentWord.word}
                </span>
              </div>
            ) : (
              /* 正常游戏中 */
              <>
                {isCurrentDrawer ? (
                  /* 出题人视图：看题 + 防窥遮罩 */
                  <>
                    <div className={`transition-all duration-200 ${!isRevealed ? 'filter blur-md select-none opacity-30' : ''}`}>
                      <span className="text-sm font-medium text-ink tracking-wide">
                        {currentWord.word}
                      </span>
                      {currentWord.hint && (
                        <p className="text-[10px] text-ink-soft font-normal mt-0.2 truncate max-w-[200px]">
                          💡 {currentWord.hint}
                        </p>
                      )}
                    </div>

                    {!isRevealed && (
                      <button
                        onClick={onToggleReveal}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 hover:bg-card/50 backdrop-blur-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1 bg-ink text-white px-2 py-0.5 rounded-md text-[10px] font-normal shadow-xs">
                          <Eye className="w-3 h-3 text-gold" />
                          <span>点击查看题目</span>
                        </div>
                      </button>
                    )}
                  </>
                ) : (
                  /* 猜题人视图 */
                  <div className="flex flex-col items-center justify-center text-ink-soft gap-0.5">
                    <span className="text-xs font-normal text-ink">🎨 正在画画中...</span>
                    <span className="text-[10px] font-normal text-ink-soft">
                      看图猜词，倒计时结束后揭晓
                    </span>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* 未抽词状态 */
          <div className="flex items-center gap-1 text-ink-soft py-0.5">
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="text-[11px] font-normal">
              {isCurrentDrawer ? '请点击下方「随机抽词」开始' : '等待画师抽词开始...'}
            </span>
          </div>
        )}
      </div>

      {/* 底部操作条：仅出题人可操作 */}
      {isCurrentDrawer ? (
        <div className="flex items-center gap-1.5">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 h-6 text-xs font-normal rounded-md"
            onClick={() => onDrawWord(selectedCategory)}
            title="重新换一道词题"
          >
            <Shuffle className="w-3 h-3" />
            <span>{currentWord ? '换一题' : '随机抽词'}</span>
          </Button>

          {currentWord && !isTimeUp && (
            <Button
              variant="warm"
              size="sm"
              className="h-6 px-2 text-xs font-normal rounded-md"
              onClick={onToggleReveal}
              title={isRevealed ? '防窥遮罩' : '查看词条'}
            >
              {isRevealed ? <EyeOff className="w-3 h-3 text-ink-soft" /> : <Eye className="w-3 h-3" />}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="h-6 px-2 text-xs font-normal rounded-md"
            onClick={onNextRound}
            title="完成本轮，换下一位出题"
          >
            <span>下轮</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-1 text-[10px] text-ink-soft font-normal">
          <span>👀 猜题人模式</span>
          <span className="font-mono text-primary font-normal">请关注画板答题</span>
        </div>
      )}
    </div>
  )
}
