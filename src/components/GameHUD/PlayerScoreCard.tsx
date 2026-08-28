import React, { useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Star } from 'lucide-react'
import { Player } from '../../types/game'
import { VoxelAvatar } from '../Common/VoxelAvatar'

interface PlayerScoreCardProps {
  player: Player
  onAddScore: (id: string, delta: number, event: React.MouseEvent) => void
  isDrawer?: boolean
  isCurrentUserDrawer?: boolean
  compact?: boolean
  chatBubbleText?: string
}

/**
 * 气泡锚点组件：通过 React Portal 将气泡渲染到 document.body，
 * 使用 getBoundingClientRect() 动态计算真实屏幕坐标，
 * 彻底脱离任何 overflow:hidden / overflow:auto 容器的裁剪约束。
 */
const AnchoredBubble: React.FC<{
  anchorRef: React.RefObject<HTMLDivElement | null>
  text: string
}> = ({ anchorRef, text }) => {
  const [rect, setRect] = React.useState<DOMRect | null>(null)

  // 挂载时立即测量，并在后续每帧同步位置（处理滚动/resize）
  React.useLayoutEffect(() => {
    const measure = () => {
      if (anchorRef.current) {
        setRect(anchorRef.current.getBoundingClientRect())
      }
    }
    measure()
    // 监听窗口滚动和尺寸变化
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [anchorRef])

  if (!rect) return null

  // 气泡定位：水平居中对齐头像，竖直在头像顶部上方 8px 处
  const bubbleStyle: React.CSSProperties = {
    position: 'fixed',
    left: rect.left + rect.width / 2,
    top: rect.top - 8,
    transform: 'translate(-50%, -100%)',
    zIndex: 9999,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  }

  return createPortal(
    <div style={bubbleStyle} className="animate-in fade-in zoom-in-90 slide-in-from-bottom-1 duration-150">
      <div className="relative bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xl border border-white/20">
        <span>{text}</span>
        {/* 向下的小三角，指向头像 */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1.5 h-1.5 bg-ink rotate-45 border-r border-b border-white/20" />
      </div>
    </div>,
    document.body
  )
}

export const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  player,
  onAddScore,
  isDrawer = false,
  isCurrentUserDrawer = false,
  compact = false,
  chatBubbleText
}) => {
  const canScore = isCurrentUserDrawer && !isDrawer
  // 头像 DOM 节点作为气泡锚点
  const avatarRef = useRef<HTMLDivElement>(null)

  // 1. 双列模式（一行两个，Table 格子）
  if (compact) {
    return (
      <div
        className={`relative flex items-center gap-1.5 transition-colors select-none p-1.5 px-2 ${
          isDrawer
            ? 'bg-tint/90 text-ink'
            : 'bg-card/95 text-ink hover:bg-paper/80'
        }`}
      >
        {chatBubbleText && (
          <AnchoredBubble anchorRef={avatarRef} text={chatBubbleText} />
        )}

        {/* 头像 */}
        <div className="relative shrink-0" ref={avatarRef}>
          <VoxelAvatar
            avatarKey={player.avatar}
            size={24}
            className={isDrawer ? 'ring-1 ring-primary/40' : 'border border-edge/60'}
          />
          {isDrawer && (
            <span
              className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-primary text-white rounded-full flex items-center justify-center shadow-xs border border-white z-10"
              title="当前出题画师"
            >
              <Star className="w-2 h-2 fill-white text-white" />
            </span>
          )}
        </div>

        {/* 右侧两行信息：上行名字，下行分数与+按钮 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          {/* 第一行：名字（占满整行） */}
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="font-normal text-ink text-[11px] truncate leading-tight flex-1"
              title={player.name}
            >
              {player.name}
            </span>
            {isDrawer && (
              <span className="text-[8px] bg-primary/90 text-white px-1 py-0.2 rounded-md font-normal tracking-tight shrink-0 scale-90">
                出题
              </span>
            )}
          </div>

          {/* 第二行：分数纯数字 与 "+" 加分按钮在同一行 */}
          <div className="flex items-center justify-between gap-1 leading-none">
            <span className="font-mono font-medium text-primary text-[11px]">
              {player.score}
            </span>

            {canScore && (
              <button
                onClick={(e) => onAddScore(player.id, 1, e)}
                className="w-4 h-4 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-primary/20"
                title="猜对加1分"
              >
                <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
              </button>
            )}

            {isDrawer && (
              <span className="text-[8px] text-primary/80 font-normal">
                出题中
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 2. 单列模式（常规 Table 列表行）
  return (
    <div
      className={`relative flex items-center justify-between transition-colors select-none p-2 px-2.5 ${
        isDrawer
          ? 'bg-tint/90 text-ink'
          : 'bg-card/95 text-ink hover:bg-paper/80'
      }`}
    >
      {chatBubbleText && (
        <AnchoredBubble anchorRef={avatarRef} text={chatBubbleText} />
      )}

      {/* 玩家头像与名字 */}
      <div className="flex items-center gap-2 min-w-0 pr-1">
        <div className="relative shrink-0" ref={avatarRef}>
          <VoxelAvatar
            avatarKey={player.avatar}
            size={28}
            className={isDrawer ? 'ring-1 ring-primary/40' : 'border border-edge/60'}
          />

          {isDrawer && (
            <span
              className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-primary text-white rounded-full flex items-center justify-center shadow-xs border border-white z-10"
              title="当前出题画师"
            >
              <Star className="w-2 h-2 fill-white text-white" />
            </span>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <span
              className="font-normal text-ink text-xs truncate max-w-[80px] leading-tight"
              title={player.name}
            >
              {player.name}
            </span>
            {isDrawer && (
              <span className="text-[9px] bg-primary/90 text-white px-1 py-0.2 rounded-md font-normal tracking-tight shrink-0 scale-90">
                出题
              </span>
            )}
          </div>
          <span className="font-mono font-medium text-primary text-[11px] leading-tight">
            {player.score}
          </span>
        </div>
      </div>

      {/* 快捷计分 / 出题状态 */}
      <div className="flex items-center gap-1 shrink-0">
        {isDrawer ? (
          <span className="text-[9px] text-primary font-normal px-1.5 py-0.2 rounded-md bg-card border border-primary/20">
            出题中
          </span>
        ) : canScore ? (
          <button
            onClick={(e) => onAddScore(player.id, 1, e)}
            className="h-5 px-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-normal rounded-md border border-primary/30 flex items-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-xs"
            title="猜对加1分"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>+1</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
