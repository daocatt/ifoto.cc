import React, { useState } from 'react'
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { api, ApiUser, setStoredToken, setStoredUser } from '../services/api'
import { VOXEL_AVATAR_LIST } from '../constants/voxelAvatars'
import { VoxelAvatar } from '../components/Common/VoxelAvatar'
import { Button } from '../components/Common/Button'

interface AuthPageProps {
  type: 'login' | 'register' | 'init-admin'
  allowRegister?: boolean
  onSuccess: (user: ApiUser) => void
  onNavigate: (route: string) => void
}

export const AuthPage: React.FC<AuthPageProps> = ({
  type,
  allowRegister = true,
  onSuccess,
  onNavigate
}) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('voxel_01')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isInitAdmin = type === 'init-admin'
  const isRegister = type === 'register'
  const isLogin = type === 'login'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('请填写完整的邮箱与密码')
      return
    }

    if ((isRegister || isInitAdmin) && !name) {
      setError('请输入您的玩家昵称')
      return
    }

    if ((isRegister || isInitAdmin) && password.length < 8) {
      setError('密码长度不能少于 8 位，且须同时包含字母和数字')
      return
    }

    if ((isRegister || isInitAdmin) && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      if (isInitAdmin) {
        const res = await api.initAdmin({ email, name, password, avatarKey: selectedAvatar })
        setStoredToken(res.token)
        setStoredUser(res.user)
        onSuccess(res.user)
      } else if (isRegister) {
        const res = await api.register({ email, name, password, avatarKey: selectedAvatar })
        setStoredToken(res.token)
        setStoredUser(res.user)
        onSuccess(res.user)
      } else {
        const res = await api.login({ email, password })
        setStoredToken(res.token)
        setStoredUser(res.user)
        onSuccess(res.user)
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-card/95 backdrop-blur-md rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 sm:p-8 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex flex-col items-center text-center gap-1.5 border-b border-edge/60 pb-4">
          <div className="w-10 h-10 rounded-[8px] bg-tint flex items-center justify-center text-primary mb-1 border border-primary/20 shadow-xs">
            {isInitAdmin ? <ShieldCheck className="w-5 h-5 text-gold" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <h2 className="text-base font-normal text-ink">
            {isInitAdmin ? '初始化超级管理员' : isRegister ? '注册你画我猜账号' : '登录游戏大厅'}
          </h2>
          <p className="text-xs text-ink-soft font-normal">
            {isInitAdmin
              ? '首次部署需创建超级管理员账号，请妥善保管密码'
              : isRegister
              ? '注册专属账号，享受自定义房间、积分历史与战绩排行'
              : '欢迎回来，请输入您的登录凭证'}
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-coral/10 border border-coral/20 rounded-md flex items-center gap-2 text-xs text-coral font-normal animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* 注册/初始化时挑选体素头像 */}
          {(isRegister || isInitAdmin) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-normal text-ink flex items-center justify-between">
                <span>选择体素头像</span>
                <span className="text-[10px] text-ink-soft font-normal">24 款可选</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-2 bg-paper/70 rounded-[8px] border border-edge/60">
                {VOXEL_AVATAR_LIST.map((avatar) => {
                  const isSelected = selectedAvatar === avatar.id
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`p-1 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-tint/80 border-primary ring-1 ring-primary/30 scale-105 shadow-xs'
                          : 'bg-card border-edge/60 hover:border-primary/40'
                      }`}
                      title={avatar.name}
                    >
                      <VoxelAvatar avatarKey={avatar.id} size={32} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 邮箱 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-normal text-ink">登录邮箱</label>
            <div className="relative flex items-center">
              <Mail className="w-3.5 h-3.5 text-ink-soft absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-paper/80 border border-edge/80 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-ink font-normal"
              />
            </div>
          </div>

          {/* 玩家昵称 (注册/初始化) */}
          {(isRegister || isInitAdmin) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-normal text-ink flex items-center justify-between">
                <span>玩家昵称</span>
                <span className="text-[10px] text-ink-soft font-normal">全局唯一</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-3.5 h-3.5 text-ink-soft absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入您的唯一昵称"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-paper/80 border border-edge/80 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-ink font-normal"
                />
              </div>
            </div>
          )}

          {/* 密码 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-normal text-ink flex items-center justify-between">
              <span>密码</span>
              {(isRegister || isInitAdmin) && (
                <span className="text-[10px] text-ink-soft font-mono font-normal">至少 8 位含字母和数字</span>
              )}
            </label>
            <div className="relative flex items-center">
              <Lock className="w-3.5 h-3.5 text-ink-soft absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-paper/80 border border-edge/80 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-ink font-normal"
              />
            </div>
          </div>

          {/* 确认密码 */}
          {(isRegister || isInitAdmin) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-normal text-ink">确认密码</label>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-ink-soft absolute left-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-paper/80 border border-edge/80 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-ink font-normal"
                />
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full py-2.5 rounded-md text-xs font-normal shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span>处理中...</span>
            ) : (
              <>
                <span>{isInitAdmin ? '完成超管初始化' : isRegister ? '立即注册' : '登录大厅'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </form>

        {/* 底部跳转切换 */}
        {!isInitAdmin && (
          <div className="text-center text-xs text-ink-soft border-t border-edge/40 pt-3 flex items-center justify-center gap-2 font-normal">
            {isLogin ? (
              <>
                <span>还没有账号？</span>
                {allowRegister ? (
                  <button
                    onClick={() => onNavigate('register')}
                    className="text-primary font-normal hover:underline cursor-pointer"
                  >
                    立即注册
                  </button>
                ) : (
                  <span className="text-ink-soft font-normal">（当前未开放公开注册）</span>
                )}
              </>
            ) : (
              <>
                <span>已有账号？</span>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-primary font-normal hover:underline cursor-pointer"
                >
                  立即登录
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
