import React, { useState } from 'react'
import { Palette, Sparkles, UserCheck, ArrowRight } from 'lucide-react'
import { RoomId, PRESET_ROOMS } from '../../types/game'
import { Button } from '../Common/Button'


interface JoinRoomModalProps {
  isOpen: boolean
  currentRoomId?: RoomId | null
  onJoin: (name: string, avatar: string, roomId: RoomId) => void
}

const AVATARS = ['👧', '👦', '👨‍💼', '👩‍🏫', '👴', '👵', '🐶', '🐱', '🦄', '🐼', '🐯', '🐰', '🦁', '🦊']
const QUICK_NAMES = ['宝宝', '爸爸', '妈妈', '爷爷', '奶奶', '画画高手', '猜题大王']

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  currentRoomId,
  onJoin
}) => {
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('👧')
  const [selectedRoom, setSelectedRoom] = useState<RoomId>(currentRoomId || 'draw')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim() || '新玩家'
    onJoin(trimmed, selectedAvatar, selectedRoom)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card/95 backdrop-blur-md w-full max-w-md rounded-[10px] border border-edge/80 shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* 头部标题 */}
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-10 h-10 rounded-[8px] bg-tint flex items-center justify-center text-primary mb-1 border border-primary/20 shadow-xs">
            <Palette className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-normal text-ink flex items-center gap-1.5">
            <span>进入你画我猜大厅</span>
            <Sparkles className="w-3.5 h-3.5 text-gold" />
          </h2>
          <p className="text-xs text-ink-soft font-normal">
            选择个人身份并挑选开放房间，即可开始跨设备同步畅玩
          </p>
        </div>

        {/* 表单区域 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* 1. 挑选房间（内置两大开放房间） */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-normal text-ink flex items-center justify-between">
              <span>选择游戏房间</span>
              <span className="text-[10px] text-ink-soft bg-warm px-2 py-0.2 rounded-md font-mono font-normal">
                开放 2 个房间
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_ROOMS.map((room) => {
                const isSelected = selectedRoom === room.id
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoom(room.id)}
                    className={`flex flex-col p-2.5 rounded-[8px] border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-tint/80 border-primary shadow-xs ring-1 ring-primary/30'
                        : 'bg-paper/70 border-edge/70 hover:border-edge'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-lg">{room.emoji}</span>
                      {isSelected && (
                        <span className="w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-normal">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-normal text-ink truncate">{room.name}</span>
                    <span className="text-[10px] text-ink-soft mt-0.5 line-clamp-1 font-normal">{room.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. 头像选择 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-normal text-ink flex items-center justify-between">
              <span>挑选你的头像</span>
              <span className="text-[11px] font-mono text-primary font-normal">{selectedAvatar}</span>
            </label>
            <div className="grid grid-cols-7 gap-1 p-2 bg-paper/70 rounded-[8px] border border-edge/60">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-base transition-all cursor-pointer ${
                    selectedAvatar === emoji
                      ? 'bg-tint scale-105 border border-primary/60 shadow-xs'
                      : 'hover:bg-warm/60 active:scale-95'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 昵称输入 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-normal text-ink">
              你的名字 / 称谓
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入你的昵称..."
              className="bg-paper/80 border border-edge/80 rounded-md px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-primary font-normal"
            />

            {/* 快速快捷称呼 */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {QUICK_NAMES.map((qName) => (
                <button
                  key={qName}
                  type="button"
                  onClick={() => setName(qName)}
                  className="text-[10px] bg-warm hover:bg-edge/80 text-ink-soft hover:text-ink px-2 py-0.2 rounded-md transition-colors cursor-pointer font-normal border border-edge/40"
                >
                  {qName}
                </button>
              ))}
            </div>
          </div>

          {/* 提交进入 */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-1 font-normal shadow-xs rounded-md text-xs py-2"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>进入 {selectedRoom} 房间</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
