import React, { useState } from 'react'
import { X, Plus, Trash2, UserPlus } from 'lucide-react'
import { Player } from '../../types/game'
import { Button } from '../Common/Button'

interface ManagePlayersModalProps {
  isOpen: boolean
  players: Player[]
  onClose: () => void
  onUpdatePlayers: (players: Player[]) => void
  onResetAllScores: () => void
}

const AVATAR_OPTIONS = ['👨‍💼', '👩‍🏫', '👧', '👦', '👴', '👵', '🐶', '🐱', '🦄', '🐼', '🐯', '🐰']

export const ManagePlayersModal: React.FC<ManagePlayersModalProps> = ({
  isOpen,
  players,
  onClose,
  onUpdatePlayers,
  onResetAllScores
}) => {
  const [newName, setNewName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('👧')

  if (!isOpen) return null

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    const newPlayer: Player = {
      id: 'p_' + Date.now(),
      name: newName.trim(),
      avatar: selectedAvatar,
      score: 0
    }

    onUpdatePlayers([...players, newPlayer])
    setNewName('')
  }

  const handleDeletePlayer = (id: string) => {
    if (players.length <= 1) return
    onUpdatePlayers(players.filter(p => p.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-xs">
      <div className="bg-card/95 backdrop-blur-md w-full max-w-sm rounded-[10px] border border-edge/80 shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-divider/60 pb-2.5">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-normal text-ink">成员与积分管理</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md bg-warm hover:bg-edge/80 text-ink-soft hover:text-ink flex items-center justify-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 成员列表 */}
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-1.5 rounded-md bg-paper/70 border border-edge/60 gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg shrink-0 select-none">{player.avatar}</span>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => {
                    const newName = e.target.value
                    onUpdatePlayers(
                      players.map((p) => (p.id === player.id ? { ...p, name: newName } : p))
                    )
                  }}
                  placeholder="修改昵称..."
                  className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-edge focus:border-primary px-1 py-0.5 text-xs font-normal text-ink focus:outline-none"
                  title="点击可直接修改名字"
                />
                <span className="text-xs font-mono text-primary font-medium shrink-0">
                  {player.score}分
                </span>
              </div>

              <button
                onClick={() => handleDeletePlayer(player.id)}
                disabled={players.length <= 1}
                className="text-ink-soft hover:text-danger p-1 disabled:opacity-20 cursor-pointer transition-colors"
                title="删除成员"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* 添加新成员表单 */}
        <form onSubmit={handleAddPlayer} className="flex flex-col gap-2 pt-2 border-t border-divider/60">
          {/* 头像选择 */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedAvatar(emoji)}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 transition-transform ${
                  selectedAvatar === emoji ? 'bg-tint scale-105 border border-primary' : 'hover:bg-warm'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="输入新成员昵称..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-paper/80 border border-edge/80 rounded-md px-2.5 py-1 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-primary font-normal"
            />
            <Button type="submit" variant="primary" size="sm" className="rounded-md font-normal text-xs py-1">
              <Plus className="w-3 h-3" /> 添加
            </Button>
          </div>
        </form>

        {/* 底部操作 */}
        <div className="flex items-center justify-between pt-2 border-t border-divider/60">
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-deep hover:bg-danger-deep/10 text-xs font-normal rounded-md"
            onClick={() => {
              if (confirm('确定要将所有家庭成员得分重置为 0 吗？')) {
                onResetAllScores()
              }
            }}
          >
            清空所有积分
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose} className="rounded-md font-normal text-xs">
            完成
          </Button>
        </div>
      </div>
    </div>
  )
}
