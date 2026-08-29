import React, { useState, useEffect } from 'react'
import { Trophy, Calendar, Sparkles, Lock, Globe, ArrowLeft, Award, Layers } from 'lucide-react'
import { api, ApiUser } from '../services/api'
import { VoxelAvatar } from '../components/Common/VoxelAvatar'
import { Button } from '../components/Common/Button'

interface ProfilePageProps {
  currentUser: ApiUser
  viewUserId?: string | null // 可以是 uid 或 uuid
  onNavigate: (route: string) => void
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  viewUserId,
  onNavigate
}) => {
  const [profileUser, setProfileUser] = useState<ApiUser | null>(null)
  const [stats, setStats] = useState<{ totalGames: number; totalScore: number }>({ totalGames: 0, totalScore: 0 })
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // viewUserId 可以是用户的 uid（如 100001 / "100001"）或者数据库 uuid
  const isMe = !viewUserId || 
    String(viewUserId) === String(currentUser.id) || 
    (currentUser.uid && String(viewUserId) === String(currentUser.uid))

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        if (isMe) {
          const [meRes, scoresRes] = await Promise.all([
            api.getMe(),
            api.getMyScores()
          ])
          setProfileUser(meRes.user)
          const myRecords = scoresRes.records || []
          setRecords(myRecords)
          const totalScore = myRecords.reduce((acc, r) => acc + (r.score || 0), 0)
          setStats({ totalGames: myRecords.length, totalScore })
        } else {
          const res = await api.getUserProfile(viewUserId!)
          setProfileUser(res.user)
          setStats(res.stats || { totalGames: 0, totalScore: 0 })
          setRecords(res.records || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [viewUserId, isMe])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <span className="text-xs text-ink-soft">加载玩家主页中...</span>
      </div>
    )
  }

  const user = profileUser || currentUser

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
      {/* 返回按钮 */}
      <div>
        <button
          onClick={() => onNavigate('lobby')}
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink font-normal bg-warm hover:bg-edge/80 px-2.5 py-1 rounded-md border border-edge/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回大厅</span>
        </button>
      </div>

      {/* 顶部个人名片 */}
      <div className="p-5 sm:p-6 rounded-[10px] bg-card/95 backdrop-blur-md border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left z-10">
          <VoxelAvatar avatarKey={user.avatarKey} size={64} className="border-2 border-tint shadow-xs" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-base font-normal text-ink">{user.name}</h2>
              <span className="text-[10px] font-normal px-2 py-0.2 rounded-md bg-primary/10 text-primary border border-primary/20">
                {user.role === 'admin' ? '超级管理员' : '画画达人'}
              </span>
              {user.uid && (
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded-md bg-warm text-ink-soft border border-edge/60">
                  UID: {user.uid}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-ink-soft font-normal">
              {user.email && isMe && (
                <span>邮箱: {user.email}</span>
              )}
              {user.createdAt && (
                <span className="flex items-center gap-1 font-normal">
                  <Calendar className="w-3 h-3" />
                  <span>加入于 {new Date(user.createdAt).toLocaleDateString()}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                {user.isStatsPublic ? (
                  <span className="text-primary flex items-center gap-1 font-normal">
                    <Globe className="w-3 h-3" />
                    <span>战绩公开</span>
                  </span>
                ) : (
                  <span className="text-ink-soft flex items-center gap-1 font-normal">
                    <Lock className="w-3 h-3" />
                    <span>战绩仅自己可见</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {isMe && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('settings')}
            className="text-xs z-10 rounded-md font-normal"
          >
            编辑个人资料与设置
          </Button>
        )}
      </div>

      {/* 数据概览卡片 */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="p-4 rounded-[10px] bg-card/95 backdrop-blur-md border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[8px] bg-gold/10 flex items-center justify-center text-gold border border-gold/20 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-ink-soft font-normal">历史总累计积分</span>
            <span className="text-lg font-medium text-ink font-mono">{stats.totalScore} 分</span>
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-card/95 backdrop-blur-md border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-ink-soft font-normal">参与比赛总局数</span>
            <span className="text-lg font-medium text-ink font-mono">{stats.totalGames} 局</span>
          </div>
        </div>
      </div>

      {/* 历史对局流水记录表 */}
      <div className="p-5 rounded-[10px] bg-card/95 backdrop-blur-md border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col gap-3.5">
        <div className="flex items-center justify-between border-b border-edge/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-normal text-ink">比赛战绩记录明细</h3>
          </div>
          <span className="text-[10px] text-ink-soft font-mono font-normal">
            {records.length > 0 ? `最近 ${records.length} 场记录` : '暂无对局记录'}
          </span>
        </div>

        {records.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-2 text-ink-soft font-normal">
            <Sparkles className="w-7 h-7 text-edge" />
            <span className="text-xs">还没有产生比赛积分记录，快去大厅开一局吧！</span>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-edge/40">
            {records.map((rec) => (
              <div key={rec.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-tint flex items-center justify-center text-primary text-xs shrink-0 border border-primary/20">
                    {rec.roomId === 'english' ? '🔤' : '🎨'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-normal text-ink">{rec.roomName || rec.roomId}</span>
                    <span className="text-[10px] text-ink-soft font-mono font-normal">
                      {new Date(rec.playedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-soft font-normal">
                    共 {rec.roundCount || 1} 轮
                  </span>
                  <span className="text-xs font-mono font-medium text-primary bg-tint/80 px-2 py-0.5 rounded-md border border-primary/20">
                    +{rec.score} 分
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
