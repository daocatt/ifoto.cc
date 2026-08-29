import React, { useState } from 'react'
import { MessageSquarePlus, ChevronUp, ChevronDown } from 'lucide-react'
import { PRESET_QUICK_CHATS } from '../../types/game'

interface QuickChatDrawerProps {
  onSendChat: (text: string) => void
  disabled?: boolean
}

export const QuickChatDrawer: React.FC<QuickChatDrawerProps> = ({
  onSendChat,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [lastSentText, setLastSentText] = useState<string | null>(null)

  const handleSend = (text: string) => {
    onSendChat(text)
    setLastSentText(text)
    setTimeout(() => setLastSentText(null), 1500)
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1 select-none">
      {/* 展开的选择面板 */}
      {isOpen && (
        <div className="bg-card/95 backdrop-blur-md p-2 rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col gap-1.5 w-72 max-md:w-60 max-w-[calc(100vw-2rem)] mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-divider/60">
            <span className="text-[11px] font-normal text-ink flex items-center gap-1">
              <span>💬 快捷互动弹幕</span>
            </span>
            <span className="text-[9px] text-ink-soft font-normal">点击即发头像气泡</span>
          </div>

          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-0.5">
            {PRESET_QUICK_CHATS.map((text, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(text)}
                disabled={disabled}
                className="text-left text-[11px] font-normal p-1.5 rounded-md bg-warm hover:bg-edge/80 active:scale-95 text-ink transition-all cursor-pointer truncate border border-edge/40"
                title={text}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 底部触发按钮（移动端更紧凑） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-card/95 hover:bg-card backdrop-blur-md px-3 max-md:px-2 py-1.5 max-md:py-1 rounded-md border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-ink transition-all cursor-pointer active:scale-95 text-xs font-normal"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 max-md:w-3 max-md:h-3 text-primary shrink-0" />
        <span className="font-normal">{lastSentText ? `已发送: ${lastSentText.slice(0, 6)}...` : '快捷发言'}</span>
        {isOpen ? <ChevronDown className="w-3 h-3 text-ink-soft" /> : <ChevronUp className="w-3 h-3 text-ink-soft" />}
      </button>
    </div>
  )
}
