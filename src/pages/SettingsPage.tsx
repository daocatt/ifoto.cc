import React, { useState } from 'react'
import { ArrowLeft, Lock, Check, AlertCircle, Sparkles, Globe } from 'lucide-react'
import { api, ApiUser, setStoredUser } from '../services/api'
import { VOXEL_AVATAR_LIST } from '../constants/voxelAvatars'
import { VoxelAvatar } from '../components/Common/VoxelAvatar'
import { Button } from '../components/Common/Button'

interface SettingsPageProps {
  currentUser: ApiUser
  onUserUpdated: (user: ApiUser) => void
  onNavigate: (route: string) => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onUserUpdated,
  onNavigate
}) => {
  const [name, setName] = useState(currentUser.name)
  const [avatarKey, setAvatarKey] = useState(currentUser.avatarKey || 'voxel_01')
  const [isStatsPublic, setIsStatsPublic] = useState(currentUser.isStatsPublic !== false)

  // 密码表单
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)

    if (newPassword) {
      if (!oldPassword) {
        setErrorMsg('修改密码时必须输入当前原密码')
        return
      }
      if (newPassword.length < 8) {
        setErrorMsg('新密码长度不能少于 8 位，且须同时包含字母和数字')
        return
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('两次输入的新密码不一致')
        return
      }
    }

    setLoading(true)
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        avatarKey,
        isStatsPublic,
        oldPassword: oldPassword || undefined,
        newPassword: newPassword || undefined
      })

      setStoredUser(res.user)
      onUserUpdated(res.user)
      setSuccessMsg('个人资料已成功保存更新！')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setErrorMsg(err.message || '更新资料失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 max-w-2xl mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
      {/* 返回 */}
      <div>
        <button
          onClick={() => onNavigate('lobby')}
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink font-normal bg-warm hover:bg-edge/80 px-2.5 py-1 rounded-md border border-edge/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回大厅</span>
        </button>
      </div>

      <div className="bg-card/95 backdrop-blur-md rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1 border-b border-edge/60 pb-3">
          <h2 className="text-base font-normal text-ink flex items-center gap-2">
            <span>个人资料与安全设置</span>
            <Sparkles className="w-4 h-4 text-gold" />
          </h2>
          <p className="text-xs text-ink-soft font-normal">
            自定义您的体素艺术人设、修改登录密码与隐私偏好
          </p>
        </div>

        {successMsg && (
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-md flex items-center gap-2 text-xs text-primary font-normal animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-coral/10 border border-coral/20 rounded-md flex items-center gap-2 text-xs text-coral font-normal animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 text-xs">
          {/* 1. 更换体素头像 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-normal text-ink">1. 选择体素艺术头像</label>
              <span className="text-[10px] text-ink-soft font-normal">当前: {avatarKey}</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-paper/70 rounded-[8px] border border-edge/60">
              {VOXEL_AVATAR_LIST.map((avatar) => {
                const isSelected = avatarKey === avatar.id
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setAvatarKey(avatar.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-tint/80 border-primary ring-1 ring-primary/30 scale-105 shadow-xs'
                        : 'bg-card border-edge/60 hover:border-primary/40'
                    }`}
                  >
                    <VoxelAvatar avatarKey={avatar.id} size={32} />
                    <span className="text-[9px] font-normal text-ink-soft truncate max-w-[50px]">{avatar.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. 玩家唯一昵称 */}
          <div className="flex flex-col gap-1">
            <label className="font-normal text-ink flex items-center justify-between">
              <span>2. 玩家昵称</span>
              <span className="text-[10px] text-ink-soft font-normal">全局唯一</span>
            </label>
            <input
              type="text"
              required
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-md bg-paper/80 border border-edge/80 text-ink outline-none focus:border-primary font-normal"
            />
          </div>

          {/* 3. 隐私开关 */}
          <div className="flex items-center justify-between p-2.5 bg-paper/70 rounded-[8px] border border-edge/60">
            <div className="flex flex-col">
              <span className="font-normal text-ink flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>公开历史比赛战绩</span>
              </span>
              <span className="text-[10px] text-ink-soft font-normal">
                开启后其他玩家可以在公开排行榜与个人主页查看您的比赛记录
              </span>
            </div>
            <input
              type="checkbox"
              checked={isStatsPublic}
              onChange={(e) => setIsStatsPublic(e.target.checked)}
              className="w-4 h-4 text-primary rounded cursor-pointer"
            />
          </div>

          {/* 4. 修改密码 (折叠/选填) */}
          <div className="flex flex-col gap-2 p-3 bg-paper/70 rounded-[8px] border border-edge/60">
            <div className="flex items-center gap-1.5 font-normal text-ink">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>修改登录密码 (不修改请留空)</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="当前原密码"
                className="px-3 py-1.5 rounded-md bg-card border border-edge/80 text-ink outline-none focus:border-primary font-normal"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新密码（至少 8 位含字母和数字）"
                className="px-3 py-1.5 rounded-md bg-card border border-edge/80 text-ink outline-none focus:border-primary font-normal"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="确认新密码"
                className="px-3 py-1.5 rounded-md bg-card border border-edge/80 text-ink outline-none focus:border-primary font-normal"
              />
            </div>
          </div>

          {/* 保存按钮 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full py-2.5 rounded-md text-xs font-normal shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {loading ? '正在保存...' : '保存修改'}
          </Button>
        </form>
      </div>
    </div>
  )
}
