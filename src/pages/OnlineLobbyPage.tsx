import React, { useState, useEffect } from 'react'
import {
  Play,
  Lock,
  Globe,
  Clock,
  Share2,
  Settings2,
  Search,
  AlertCircle,
  History,
  Loader2
} from 'lucide-react'
import { api, ApiUser, ApiRoom, getLastPlayedRoom, setLastPlayedRoom, ScoreSummary } from '../services/api'
import { VoxelAvatar } from '../components/Common/VoxelAvatar'
import { Button } from '../components/Common/Button'
import { ShareRoomModal } from '../components/GameHUD/ShareRoomModal'

interface OnlineLobbyPageProps {
  currentUser: ApiUser
  onJoinRoom: (roomId: string, roomName?: string) => void
  onNavigate?: (route: string) => void
}

export const OnlineLobbyPage: React.FC<OnlineLobbyPageProps> = ({
  currentUser,
  onJoinRoom
}) => {
  const [publicRooms, setPublicRooms] = useState<ApiRoom[]>([])
  const [myRoom, setMyRoom] = useState<ApiRoom | null>(null)
  const [summary, setSummary] = useState<ScoreSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 专属房间编辑/创建状态
  const [isEditingMyRoom, setIsEditingMyRoom] = useState(false)
  const [roomEmojiInput, setRoomEmojiInput] = useState('🎨')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [roomNameInput, setRoomNameInput] = useState('')
  const [roomTypeInput, setRoomTypeInput] = useState<'draw' | 'english'>('draw')
  const [roomPasswordInput, setRoomPasswordInput] = useState('')
  const [roomIsOpen, setRoomIsOpen] = useState(true)
  const [roomOpenStartTime, setRoomOpenStartTime] = useState('')
  const [roomOpenEndTime, setRoomOpenEndTime] = useState('')
  const [roomIsPublic, setRoomIsPublic] = useState(true)
  const [savingRoom, setSavingRoom] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)

  // 分享二维码弹窗
  const [shareModalRoom, setShareModalRoom] = useState<ApiRoom | null>(null)

  // 密码输入弹窗
  const [pwdModalRoom, setPwdModalRoom] = useState<ApiRoom | null>(null)
  const [pwdInput, setPwdInput] = useState('')
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  const lastPlayedId = getLastPlayedRoom()

  const loadData = async () => {
    setLoading(true)
    try {
      const [roomsRes, myRoomRes, summaryRes] = await Promise.all([
        api.getPublicRooms(),
        api.getMyRoom(),
        api.getScoreSummary()
      ])
      setPublicRooms(roomsRes.rooms || [])
      setMyRoom(myRoomRes.room || null)
      setSummary(summaryRes.summary || null)

      if (myRoomRes.room) {
        const emojiMatch = myRoomRes.room.name.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
        if (emojiMatch) {
          setRoomEmojiInput(emojiMatch[0]);
          setRoomNameInput(myRoomRes.room.name.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u, ''));
        } else {
          setRoomEmojiInput(myRoomRes.room.type === 'english' ? '🔤' : '🎨');
          setRoomNameInput(myRoomRes.room.name);
        }
        setRoomTypeInput(myRoomRes.room.type)
        setRoomIsOpen(myRoomRes.room.isOpen)
        setRoomOpenStartTime(myRoomRes.room.openStartTime || '')
        setRoomOpenEndTime(myRoomRes.room.openEndTime || '')
        setRoomIsPublic(myRoomRes.room.isPublic !== false)
      } else {
        setRoomNameInput(`${currentUser.name} 的画画派对`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveMyRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setRoomError(null)
    if (!roomNameInput.trim()) {
      setRoomError('请输入房间名称')
      return
    }

    setSavingRoom(true)
    try {
      const fullName = roomEmojiInput ? `${roomEmojiInput} ${roomNameInput.trim()}` : roomNameInput.trim();
      const res = await api.saveMyRoom({
        name: fullName,
        type: roomTypeInput,
        password: roomPasswordInput || undefined,
        isOpen: roomIsOpen,
        openStartTime: roomOpenStartTime || null,
        openEndTime: roomOpenEndTime || null,
        isPublic: roomIsPublic
      })
      setMyRoom(res.room)
      setIsEditingMyRoom(false)
      loadData()
    } catch (err: any) {
      setRoomError(err.message || '保存房间失败')
    } finally {
      setSavingRoom(false)
    }
  }

  const handleEnterRoom = async (room: ApiRoom) => {
    // 检查是否开放
    if (room.isOpen === false || room.effectiveIsOpen === false) {
      alert('该房间当前未在开放时间内，或已被房主暂时关闭')
      return
    }

    // 检查是否需要密码
    if (room.hasPassword) {
      setPwdModalRoom(room)
      setPwdInput('')
      setPwdError(null)
      return
    }

    setLastPlayedRoom(room.id)
    onJoinRoom(room.id, room.name)
  }

  const handleVerifyPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwdModalRoom) return
    setPwdError(null)
    setPwdLoading(true)

    try {
      const res = await api.verifyRoomPassword(pwdModalRoom.id, pwdInput)
      if (res.valid) {
        const target = pwdModalRoom
        setPwdModalRoom(null)
        setLastPlayedRoom(target.id)
        onJoinRoom(target.id, target.name)
      }
    } catch (err: any) {
      setPwdError(err.message || '密码验证失败')
    } finally {
      setPwdLoading(false)
    }
  }

  const filteredRooms = publicRooms.filter(r => {
    if (!searchQuery.trim()) return true
    return r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.ownerName && r.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs text-ink-soft font-bold">正在加载房间大厅...</span>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
      {/* 顶部欢迎横幅 */}
      <div className="p-4 sm:p-5 rounded-[10px] bg-card/95 backdrop-blur-md border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <VoxelAvatar avatarKey={currentUser.avatarKey} size={48} className="border border-edge/60" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-normal text-ink">{currentUser.name}</h2>
              <span className="text-[10px] font-normal px-2 py-0.2 rounded-md bg-primary/10 text-primary border border-primary/20">
                {currentUser.role === 'admin' ? '超级管理员' : '玩家'}
              </span>
            </div>
            {summary && (
              <div className="flex items-center gap-4 mt-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-primary font-mono">{summary.totalGames}</span>
                  <span className="text-[10px] text-ink-soft font-normal">对局</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-primary font-mono">{summary.totalScore}</span>
                  <span className="text-[10px] text-ink-soft font-normal">总得分</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-gold font-mono">{summary.bestScore}</span>
                  <span className="text-[10px] text-ink-soft font-normal">最高分</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-ink font-mono">{summary.lowestScore}</span>
                  <span className="text-[10px] text-ink-soft font-normal">最低分</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {lastPlayedId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onJoinRoom(lastPlayedId)}
              className="flex-1 sm:flex-none text-xs font-normal gap-1.5 rounded-md"
            >
              <History className="w-3.5 h-3.5 text-primary" />
              <span>上次玩过的房间</span>
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEditingMyRoom(true)}
            className="flex-1 sm:flex-none text-xs font-normal gap-1.5 shadow-xs rounded-md"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{myRoom ? '管理我的专属房间' : '创建我的房间'}</span>
          </Button>
        </div>
      </div>

      {/* 我的专属画室卡片 */}
      {myRoom && (
        <div className="p-4 sm:p-4.5 rounded-[12px] bg-card/95 backdrop-blur-md border border-primary/25 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group">
          {/* 左侧装饰小光晕 */}
          <div className="absolute -left-12 -top-12 w-28 h-28 rounded-full bg-primary/10 blur-xl pointer-events-none" />

          <div className="flex items-center gap-3.5 z-10 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-[10px] bg-tint flex items-center justify-center text-primary text-2xl shrink-0 border border-primary/20 shadow-xs">
              {(() => {
                const emojiMatch = myRoom.name.match(/^(\p{Emoji_Presentation}|\p{Emoji}️)/u);
                if (emojiMatch) return emojiMatch[0];
                return myRoom.type === 'english' ? '🔤' : '🎨';
              })()}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-ink truncate">
                  {myRoom.name.replace(/^(\p{Emoji_Presentation}|\p{Emoji}️)\s*/u, '')}
                </span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  我的专属画室
                </span>
                {myRoom.hasPassword && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gold font-normal bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
                    <Lock className="w-3 h-3" />
                    <span>密码房</span>
                  </span>
                )}
                {myRoom.isPublic === false && (
                  <span className="text-[10px] text-ink-soft font-normal bg-warm px-2 py-0.5 rounded-full border border-edge/60">
                    隐藏于大厅
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-ink-soft mt-1 font-normal flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${myRoom.isOpen ? 'bg-primary animate-pulse' : 'bg-coral'}`} />
                  <span className={myRoom.isOpen ? 'text-primary font-medium' : 'text-coral'}>
                    {myRoom.isOpen ? '营业开放中' : '休息中 (已关闭)'}
                  </span>
                </span>
                <span className="text-edge">•</span>
                <span>{myRoom.type === 'english' ? '英语猜猜看' : '你画我猜'}</span>
                {myRoom.openStartTime && myRoom.openEndTime && (
                  <>
                    <span className="text-edge">•</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-soft bg-warm/80 px-1.5 py-0.2 rounded border border-edge/40">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>{myRoom.openStartTime} ~ {myRoom.openEndTime}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto z-10 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareModalRoom(myRoom)}
              className="flex-1 md:flex-none text-xs font-normal gap-1.5 rounded-md"
              title="获取分享链接与二维码"
            >
              <Share2 className="w-3.5 h-3.5 text-primary" />
              <span>分享</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingMyRoom(true)}
              className="flex-1 md:flex-none text-xs font-normal gap-1.5 rounded-md"
              title="配置房间规则、密码与开放时间"
            >
              <Settings2 className="w-3.5 h-3.5 text-ink-soft" />
              <span>设置</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleEnterRoom(myRoom)}
              className="flex-1 md:flex-none text-xs font-medium gap-1.5 shadow-xs rounded-md px-3.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>进入画室</span>
            </Button>
          </div>
        </div>
      )}

      {/* 公开房间大厅列表 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-normal text-ink">公开房间列表</h3>
            <span className="text-[10px] text-ink-soft bg-warm px-2 py-0.2 rounded-md font-mono font-normal">
              共 {filteredRooms.length} 间
            </span>
          </div>

          {/* 搜索过滤框 */}
          <div className="relative flex items-center w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-ink-soft absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索房间或房主..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-card border border-edge/80 focus:border-primary outline-none text-ink font-normal"
            />
          </div>
        </div>

        {/* 房间网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRooms.map((room) => {
            const isClosed = room.isOpen === false || room.effectiveIsOpen === false
            return (
              <div
                key={room.id}
                className={`p-3.5 rounded-[10px] border transition-all flex flex-col justify-between gap-3 relative overflow-hidden bg-card/95 shadow-[0_1px_4px_rgba(0,0,0,0.08)] ${
                  isClosed
                    ? 'opacity-70 border-edge/60'
                    : 'border-edge/80 hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[8px] bg-tint flex items-center justify-center text-primary text-lg shrink-0 border border-primary/20">
                      {(() => {
                        const emojiMatch = room.name.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
                        if (emojiMatch) return emojiMatch[0];
                        return room.type === 'english' ? '🔤' : '🎨';
                      })()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-normal text-ink line-clamp-1">{room.name.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u, '')}</span>
                        {room.hasPassword && (
                          <span title="该房间有密码">
                            <Lock className="w-3 h-3 text-gold shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-ink-soft mt-0.5 font-normal">
                        <span>{room.type === 'english' ? '英语猜猜看' : '你画我猜'}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-normal px-1.5 py-0.2 rounded-md shrink-0 ${
                    isClosed
                      ? 'bg-coral/10 text-coral border border-coral/20'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {isClosed ? '休息中' : '开放中'}
                  </span>
                </div>

                {/* 开放时间提示 */}
                {room.openStartTime && room.openEndTime && (
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-soft bg-warm/80 px-2 py-0.5 rounded-md font-mono font-normal">
                    <Clock className="w-3 h-3 text-primary shrink-0" />
                    <span>定时开放: {room.openStartTime} ~ {room.openEndTime}</span>
                  </div>
                )}

                {/* 底部操作 */}
                <div className="flex items-center justify-between pt-1 border-t border-edge/40">
                  <span className="text-[10px] text-ink-soft font-mono font-normal">
                    {room.isSystem ? 'ifoto' : `ID: ${room.id}`}
                  </span>
                  <Button
                    variant={isClosed ? 'outline' : 'primary'}
                    size="sm"
                    disabled={isClosed}
                    onClick={() => handleEnterRoom(room)}
                    className="text-xs px-3 py-0.5 gap-1 rounded-md font-normal"
                  >
                    {isClosed ? (
                      <span>非开放时间</span>
                    ) : (
                      <>
                        <span>进入</span>
                        <Play className="w-3 h-3 fill-current" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 创建/管理我的房间抽屉弹窗 */}
      {isEditingMyRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-[10px] border border-edge shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-5 flex flex-col gap-3.5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-edge/60 pb-2.5">
              <h3 className="text-xs font-normal text-ink flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <span>{myRoom ? '配置我的专属房间' : '创建专属房间'}</span>
              </h3>
              <button
                onClick={() => setIsEditingMyRoom(false)}
                className="text-xs text-ink-soft hover:text-ink font-normal cursor-pointer"
              >
                关闭
              </button>
            </div>

            {roomError && (
              <div className="p-2.5 bg-coral/10 border border-coral/20 rounded-md flex items-center gap-2 text-xs text-coral font-normal">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{roomError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMyRoom} className="flex flex-col gap-3.5 text-xs">
              {/* 房间图标与名称 */}
              <div className="flex flex-col gap-1">
                <label className="font-normal text-ink">房间图标与名称</label>
                <div className="flex items-center gap-2 relative">
                  {/* Emoji 选择按钮 */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-9 h-9 rounded-md border border-edge/80 bg-paper/80 hover:bg-edge/40 flex items-center justify-center text-lg transition-colors cursor-pointer shrink-0 shadow-xs"
                      title="选择房间图标"
                    >
                      {roomEmojiInput}
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute left-0 top-11 z-50 p-2 bg-card/95 backdrop-blur-md rounded-[10px] border border-edge/80 shadow-[0_4px_16px_rgba(0,0,0,0.12)] w-56 grid grid-cols-6 gap-1 animate-in fade-in zoom-in-95">
                        {['🎨', '🖌️', '🎭', '🎪', '🎠', '🌈', '🦄', '🐼', '🐙', '🦊', '🐱', '🐶', '🎮', '🕹️', '⭐', '🔥', '💫', '🍀', '🌸', '🌻', '🍎', '🍓', '🍰', '☕', '🎵', '🎶', '🏆', '🎯', '🚀', '🌙'].map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => {
                              setRoomEmojiInput(e);
                              setShowEmojiPicker(false);
                            }}
                            className={`w-7 h-7 rounded flex items-center justify-center text-base hover:bg-tint transition-all cursor-pointer ${roomEmojiInput === e ? 'bg-tint ring-1 ring-primary/40' : ''}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    placeholder="例如：小明的一起画画派对"
                    className="flex-1 px-3 py-2 rounded-md bg-paper/80 border border-edge/80 text-ink outline-none focus:border-primary font-normal"
                  />
                </div>
              </div>

              {/* 房间类型 */}
              <div className="flex flex-col gap-1">
                <label className="font-normal text-ink">题库玩法模式</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoomTypeInput('draw')}
                    className={`p-2.5 rounded-[8px] border text-left flex items-center gap-2 cursor-pointer ${
                      roomTypeInput === 'draw'
                        ? 'bg-tint/80 border-primary shadow-xs font-normal text-primary'
                        : 'bg-paper/70 border-edge/70 text-ink'
                    }`}
                  >
                    <span className="text-lg">🎨</span>
                    <div>
                      <div className="font-normal">你画我猜</div>
                      <div className="text-[10px] text-ink-soft font-normal">1140+ 中文纯名词大题库</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoomTypeInput('english')}
                    className={`p-2.5 rounded-[8px] border text-left flex items-center gap-2 cursor-pointer ${
                      roomTypeInput === 'english'
                        ? 'bg-tint/80 border-primary shadow-xs font-normal text-primary'
                        : 'bg-paper/70 border-edge/70 text-ink'
                    }`}
                  >
                    <span className="text-lg">🔤</span>
                    <div>
                      <div className="font-normal">英语猜猜看</div>
                      <div className="text-[10px] text-ink-soft font-normal">500+ K12具象好画英文</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 简单密码 */}
              <div className="flex flex-col gap-1">
                <label className="font-normal text-ink flex items-center justify-between">
                  <span>房间密码 (选填)</span>
                  <span className="text-[10px] text-ink-soft font-normal">不填则所有人无需密码直接进入</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={roomPasswordInput}
                  onChange={(e) => setRoomPasswordInput(e.target.value)}
                  placeholder={myRoom?.hasPassword ? '留空保持原有密码，输入新值可修改' : '设置简单进房密码（如 1234）'}
                  className="px-3 py-2 rounded-md bg-paper/80 border border-edge/80 text-ink outline-none focus:border-primary font-mono text-xs"
                />
              </div>

              {/* 定时开放时段 */}
              <div className="flex flex-col gap-1 p-2.5 bg-paper/70 rounded-[8px] border border-edge/60">
                <label className="font-normal text-ink flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>每日定时开放时段 (选填)</span>
                </label>
                <p className="text-[10px] text-ink-soft font-normal">
                  到达非开放时间将自动锁定并清空在线玩家；不填则全天24小时开放。
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-soft text-[10px] font-normal">从</span>
                    <input
                      type="time"
                      value={roomOpenStartTime}
                      onChange={(e) => setRoomOpenStartTime(e.target.value)}
                      className="px-2 py-1 rounded-md bg-card border border-edge/80 text-ink font-mono text-xs outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-soft text-[10px] font-normal">至</span>
                    <input
                      type="time"
                      value={roomOpenEndTime}
                      onChange={(e) => setRoomOpenEndTime(e.target.value)}
                      className="px-2 py-1 rounded-md bg-card border border-edge/80 text-ink font-mono text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 开关与大厅展示 */}
              <div className="flex items-center justify-between p-2.5 bg-paper/70 rounded-[8px] border border-edge/60">
                <div className="flex flex-col">
                  <span className="font-normal text-ink">房间开放开关</span>
                  <span className="text-[10px] text-ink-soft font-normal">关闭后所有玩家暂时无法进入</span>
                </div>
                <input
                  type="checkbox"
                  checked={roomIsOpen}
                  onChange={(e) => setRoomIsOpen(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-paper/70 rounded-[8px] border border-edge/60">
                <div className="flex flex-col">
                  <span className="font-normal text-ink">在大厅公开展示</span>
                  <span className="text-[10px] text-ink-soft font-normal">关闭后仅能通过专属链接/二维码进入</span>
                </div>
                <input
                  type="checkbox"
                  checked={roomIsPublic}
                  onChange={(e) => setRoomIsPublic(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingMyRoom(false)}
                  className="rounded-md font-normal"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={savingRoom}
                  className="rounded-md font-normal"
                >
                  {savingRoom ? '保存中...' : '确认并保存'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 进房密码输入弹窗 */}
      {pwdModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-[10px] border border-edge shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-5 flex flex-col gap-3.5 animate-in zoom-in-95 text-center">
            <div className="w-10 h-10 rounded-[8px] bg-gold/10 flex items-center justify-center text-gold mx-auto border border-gold/20 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-0.5">
              <h3 className="text-xs font-normal text-ink">该房间设有入房密码</h3>
              <p className="text-xs text-ink-soft font-normal">{pwdModalRoom.name}</p>
            </div>

            {pwdError && (
              <div className="p-2 bg-coral/10 border border-coral/20 rounded-md text-xs text-coral font-normal">
                {pwdError}
              </div>
            )}

            <form onSubmit={handleVerifyPasswordSubmit} className="flex flex-col gap-2.5">
              <input
                type="password"
                required
                autoFocus
                value={pwdInput}
                onChange={(e) => setPwdInput(e.target.value)}
                placeholder="请输入入房密码"
                className="px-3 py-2 text-xs rounded-md bg-paper/80 border border-edge/80 text-ink text-center outline-none focus:border-primary font-mono text-sm"
              />

              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPwdModalRoom(null)}
                  className="flex-1 rounded-md font-normal"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={pwdLoading}
                  className="flex-1 rounded-md font-normal"
                >
                  {pwdLoading ? '验证中...' : '验证并进入'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 分享二维码弹窗 */}
      {shareModalRoom && (
        <ShareRoomModal
          isOpen={true}
          roomId={shareModalRoom.id}
          roomName={shareModalRoom.name}
          hasPassword={shareModalRoom.hasPassword}
          openStartTime={shareModalRoom.openStartTime}
          openEndTime={shareModalRoom.openEndTime}
          onClose={() => setShareModalRoom(null)}
        />
      )}
    </div>
  )
}
