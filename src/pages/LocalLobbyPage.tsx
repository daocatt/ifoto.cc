import React, { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { RoomId, PRESET_ROOMS } from '../types/game'
import { VOXEL_AVATAR_LIST } from '../constants/voxelAvatars'
import { VoxelAvatar } from '../components/Common/VoxelAvatar'
import { Button } from '../components/Common/Button'

interface LocalLobbyPageProps {
  initialName?: string
  initialAvatar?: string
  initialRoom?: RoomId
  onJoin: (name: string, avatar: string, roomId: RoomId) => void
}

const QUICK_NAMES = ['宝宝', '爸爸', '妈妈', '爷爷', '奶奶', '画画大师', '猜词达人', '灵魂画手']

export const LocalLobbyPage: React.FC<LocalLobbyPageProps> = ({
  initialName = '',
  initialAvatar = 'voxel_01',
  initialRoom = 'draw',
  onJoin
}) => {
  const [name, setName] = useState(initialName)
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar)
  const [selectedRoom, setSelectedRoom] = useState<RoomId>(initialRoom)
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')

  const filteredAvatars = VOXEL_AVATAR_LIST.filter(a => {
    if (genderFilter === 'all') return true
    return a.gender === genderFilter
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim() || '新玩家'
    onJoin(trimmed, selectedAvatar, selectedRoom)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-card/95 backdrop-blur-md rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 sm:p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* 头部介绍 - 靠左对齐，轻量细体 */}
        <div className="flex flex-col text-left gap-0.5 border-b border-edge/60 pb-3">
          <h2 className="text-base font-normal text-ink tracking-tight">
            进入游戏
          </h2>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5">
          {/* 1. 挑选游戏房间 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-normal text-ink flex items-center justify-between">
              <span>1. 选择游戏房间</span>
              <span className="text-[10px] text-ink-soft bg-warm px-2 py-0.5 rounded-md font-mono font-normal">
                2 大主题画室
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_ROOMS.map((room) => {
                const isSelected = selectedRoom === room.id
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoom(room.id)}
                    className={`flex items-center gap-3 p-3 rounded-[8px] border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-tint/80 border-primary shadow-xs ring-1 ring-primary/30'
                        : 'bg-paper/70 border-edge/70 hover:border-edge'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{room.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-normal text-ink">{room.name}</span>
                      <span className="text-[11px] font-normal text-ink-soft">{room.desc}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. 挑选头像 - 紧凑两行横向滑动窗口 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-normal text-ink">
                2. 选择头像
              </label>
              <div className="flex items-center gap-1 bg-warm p-0.5 rounded-md border border-edge/60">
                <button
                  type="button"
                  onClick={() => setGenderFilter('all')}
                  className={`text-[10px] px-2 py-0.5 rounded-sm font-normal transition-all cursor-pointer ${
                    genderFilter === 'all' ? 'bg-card text-ink shadow-xs' : 'text-ink-soft'
                  }`}
                >
                  全部
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('male')}
                  className={`text-[10px] px-2 py-0.5 rounded-sm font-normal transition-all cursor-pointer ${
                    genderFilter === 'male' ? 'bg-card text-ink shadow-xs' : 'text-ink-soft'
                  }`}
                >
                  男生
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('female')}
                  className={`text-[10px] px-2 py-0.5 rounded-sm font-normal transition-all cursor-pointer ${
                    genderFilter === 'female' ? 'bg-card text-ink shadow-xs' : 'text-ink-soft'
                  }`}
                >
                  女生
                </button>
              </div>
            </div>

            {/* 精巧紧凑两行横向滑动 */}
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[52px] overflow-x-auto overflow-y-hidden gap-1.5 p-2 bg-paper/70 rounded-[8px] border border-edge/60 scroll-smooth touch-pan-x select-none cursor-grab active:cursor-grabbing">
              {filteredAvatars.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-md border transition-all cursor-pointer relative shrink-0 ${
                      isSelected
                        ? 'bg-tint/80 border-primary ring-1 ring-primary/30 shadow-xs'
                        : 'bg-card border-edge/60 hover:border-primary/40'
                    }`}
                  >
                    <VoxelAvatar avatarKey={avatar.id} size={24} />
                    <span className="text-[9px] font-normal text-ink-soft truncate max-w-[44px] text-center leading-tight">{avatar.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. 填写玩家昵称 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-normal text-ink">3. 玩家昵称</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="user_guest_name"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的昵称（如：画画大王）"
                maxLength={12}
                className="flex-1 px-3 py-2 text-xs rounded-md bg-paper/80 border border-edge/80 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-ink font-normal"
              />
            </div>

            {/* 快速称谓标签 */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] font-normal text-ink-soft flex items-center self-center mr-1">快捷填入:</span>
              {QUICK_NAMES.map((qName) => (
                <button
                  key={qName}
                  type="button"
                  onClick={() => setName(qName)}
                  className="text-[11px] font-normal bg-warm hover:bg-edge/80 text-ink px-2 py-0.5 rounded-md border border-edge/40 cursor-pointer transition-colors"
                >
                  {qName}
                </button>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full py-3 rounded-md text-xs font-normal shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>开启你画我猜</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
