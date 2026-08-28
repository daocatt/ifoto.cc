import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Share2, X, Sparkles, Lock, Clock } from 'lucide-react'
import { Button } from '../Common/Button'

interface ShareRoomModalProps {
  isOpen: boolean
  roomId: string
  roomName: string
  hasPassword?: boolean
  openStartTime?: string | null
  openEndTime?: string | null
  onClose: () => void
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  roomId,
  roomName,
  hasPassword,
  openStartTime,
  openEndTime,
  onClose
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // 邀请链接：带有 hash 路由直达
  const shareUrl = `${window.location.origin}/#/room/${roomId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card/95 backdrop-blur-md w-full max-w-sm rounded-[10px] border border-edge/80 shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-5 flex flex-col items-center text-center gap-3.5 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-ink-soft hover:text-ink hover:bg-warm rounded-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 头部 */}
        <div className="w-10 h-10 rounded-[8px] bg-tint flex items-center justify-center text-primary border border-primary/20 shadow-xs mb-0.5">
          <Share2 className="w-5 h-5" />
        </div>

        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-normal text-ink flex items-center justify-center gap-1.5">
            <span>邀请好友进入房间</span>
            <Sparkles className="w-3.5 h-3.5 text-gold" />
          </h3>
          <p className="text-xs text-ink-soft font-normal">{roomName}</p>
        </div>

        {/* 状态特征提示 */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
          {hasPassword && (
            <span className="flex items-center gap-1 bg-warm text-ink px-2 py-0.2 rounded-md border border-edge font-normal">
              <Lock className="w-2.5 h-2.5 text-gold" />
              <span>设有入房密码</span>
            </span>
          )}
          {openStartTime && openEndTime && (
            <span className="flex items-center gap-1 bg-warm text-ink px-2 py-0.2 rounded-md border border-edge font-normal font-mono">
              <Clock className="w-2.5 h-2.5 text-primary" />
              <span>开放时段 {openStartTime} ~ {openEndTime}</span>
            </span>
          )}
        </div>

        {/* 二维码展示区域 */}
        <div className="p-3 bg-white rounded-[8px] border border-edge/80 shadow-xs flex items-center justify-center">
          <QRCodeSVG
            value={shareUrl}
            size={160}
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="text-[10px] text-ink-soft font-normal">
          扫码或点击下方链接，受邀玩家登录后将直接进入此房间
        </p>

        {/* 链接复制框 */}
        <div className="w-full flex items-center gap-2 p-1.5 bg-paper/80 rounded-md border border-edge/80">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="text-xs text-ink font-mono bg-transparent flex-1 outline-none px-1.5 truncate select-all font-normal"
          />
          <Button
            size="sm"
            variant={copied ? 'primary' : 'outline'}
            onClick={handleCopy}
            className="shrink-0 rounded-md font-normal text-xs py-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
