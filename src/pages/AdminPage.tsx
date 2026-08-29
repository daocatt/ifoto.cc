import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Settings2,
  Users,
  DoorOpen,
  Search,
  Trash2,
  UserX,
  UserCheck,
  Lock,
  Unlock,
  Pencil,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react'
import { api, ApiUser, AdminUser, AdminRoom, SystemSettings } from '../services/api'
import { Button } from '../components/Common/Button'
import { VoxelAvatar } from '../components/Common/VoxelAvatar'
import { VOXEL_AVATAR_LIST } from '../constants/voxelAvatars'

type Tab = 'settings' | 'users' | 'rooms'

interface EditRoomState {
  room: AdminRoom
  name: string
  type: 'draw' | 'english'
  isOpen: boolean
  isPublic: boolean
  password: string
}

interface AdminPageProps {
  currentUser: ApiUser
}

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const [tab, setTab] = useState<Tab>('settings')
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 用户管理
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [userPageSize] = useState(10)
  const [userSearch, setUserSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)

  // 房间管理
  const [rooms, setRooms] = useState<AdminRoom[]>([])
  const [roomTotal, setRoomTotal] = useState(0)
  const [roomPage, setRoomPage] = useState(1)
  const [roomPageSize] = useState(10)
  const [roomSearch, setRoomSearch] = useState('')
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [editRoom, setEditRoom] = useState<EditRoomState | null>(null)

  // 编辑用户资料弹窗
  const [editUser, setEditUser] = useState<{
    user: AdminUser
    name: string
    avatarKey: string
    role: 'admin' | 'user'
    password: string
    enabled: boolean
  } | null>(null)

  const flash = (msg: string | null) => { setNotice(msg); setError(null) }
  const flashErr = (msg: string) => { setError(msg); setNotice(null) }

  useEffect(() => { api.getAdminSettings().then(r => setSettings(r.settings)).catch(e => flashErr(e.message)) }, [])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const r = await api.getAdminUsers({ page: userPage, pageSize: userPageSize, search: userSearch })
      setUsers(r.items)
      setUserTotal(r.total)
    } catch (e: any) { flashErr(e.message) } finally { setUsersLoading(false) }
  }

  const loadRooms = async () => {
    setRoomsLoading(true)
    try {
      const r = await api.getAdminRooms({ page: roomPage, pageSize: roomPageSize, search: roomSearch })
      setRooms(r.items)
      setRoomTotal(r.total)
    } catch (e: any) { flashErr(e.message) } finally { setRoomsLoading(false) }
  }

  useEffect(() => { loadUsers() }, [userPage]) // eslint-disable-line
  useEffect(() => { loadRooms() }, [roomPage]) // eslint-disable-line

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const r = await api.saveAdminSettings(settings)
      setSettings(r.settings)
      flash('设置已保存')
    } catch (e: any) { flashErr(e.message) } finally { setSaving(false) }
  }

  const saveUserEdit = async () => {
    if (!editUser) return
    try {
      const updateData: any = {
        name: editUser.name.trim(),
        avatarKey: editUser.avatarKey,
        role: editUser.role,
        enabled: editUser.enabled
      }
      if (editUser.password && editUser.password.trim()) {
        updateData.password = editUser.password.trim()
      }
      await api.updateAdminUser(editUser.user.id, updateData)
      flash('用户资料已更新')
      setEditUser(null)
      loadUsers()
    } catch (e: any) {
      flashErr(e.message)
    }
  }

  const toggleUserEnabled = async (u: AdminUser) => {
    const next = !u.enabled
    if (!window.confirm(next ? `启用账号 ${u.name}？` : `禁用账号 ${u.name}？禁用后其登录立即失效且无法登录。`)) return
    try {
      await api.updateAdminUser(u.id, { enabled: next })
      flash(next ? '账号已启用' : '账号已禁用')
      loadUsers()
    } catch (e: any) { flashErr(e.message) }
  }

  const toggleUserRole = async (u: AdminUser) => {
    const next = u.role === 'admin' ? 'user' : 'admin'
    if (!window.confirm(next === 'admin' ? `将 ${u.name} 设为管理员？` : `取消 ${u.name} 的管理员权限？`)) return
    try {
      await api.updateAdminUser(u.id, { role: next })
      flash('角色已更新')
      loadUsers()
    } catch (e: any) { flashErr(e.message) }
  }

  const deleteUser = async (u: AdminUser) => {
    if (!window.confirm(`确定删除用户 ${u.name}？其房间与战绩等关联数据将一并删除，且不可恢复。`)) return
    try {
      await api.deleteAdminUser(u.id)
      flash('用户已删除')
      loadUsers()
    } catch (e: any) { flashErr(e.message) }
  }

  const toggleRoomDisabled = async (r: AdminRoom) => {
    const next = !r.adminDisabled
    if (!window.confirm(next ? `禁用房间 ${r.name}？玩家将无法进入，房主也无法编辑。` : `启用房间 ${r.name}？`)) return
    try {
      await api.updateAdminRoom(r.id, { adminDisabled: next })
      flash(next ? '房间已禁用' : '房间已启用')
      loadRooms()
    } catch (e: any) { flashErr(e.message) }
  }

  const deleteRoom = async (r: AdminRoom) => {
    if (!window.confirm(`确定删除房间 ${r.name}？`)) return
    try {
      await api.deleteAdminRoom(r.id)
      flash('房间已删除')
      loadRooms()
    } catch (e: any) { flashErr(e.message) }
  }

  const saveRoomEdit = async () => {
    if (!editRoom) return
    try {
      await api.updateAdminRoom(editRoom.room.id, {
        name: editRoom.name,
        type: editRoom.type,
        isOpen: editRoom.isOpen,
        isPublic: editRoom.isPublic,
        password: editRoom.password || undefined
      })
      setEditRoom(null)
      flash('房间已更新')
      loadRooms()
    } catch (e: any) { flashErr(e.message) }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'settings', label: '基本设置', icon: <Settings2 className="w-4 h-4" /> },
    { key: 'users', label: '用户管理', icon: <Users className="w-4 h-4" /> },
    { key: 'rooms', label: '房间管理', icon: <DoorOpen className="w-4 h-4" /> }
  ]

  const tabBtn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer'

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-ink">管理后台</h2>
          <p className="text-xs text-ink-soft font-normal">超级管理员专属 · 系统设置与数据管理</p>
        </div>
      </div>

      {/* 提示条 */}
      {(notice || error) && (
        <div className={`p-2.5 rounded-md text-xs font-normal flex items-center gap-2 border ${error ? 'bg-coral/10 border-coral/20 text-coral' : 'bg-primary/5 border-primary/20 text-primary'}`}>
          {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      )}

      {/* 选项卡 */}
      <div className="flex items-center gap-1 p-1 bg-warm/60 border border-edge/70 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`${tabBtn} ${tab === t.key ? 'bg-primary text-white shadow-xs' : 'text-ink-soft hover:text-ink'}`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── 基本设置 ── */}
      {tab === 'settings' && settings && (
        <div className="flex flex-col gap-3 max-w-xl">
          <div className="p-4 rounded-[10px] bg-card border border-edge/80 flex flex-col gap-4">
            <ToggleRow
              label="允许用户注册"
              desc="开启后访客可自助注册新账号"
              checked={settings.allowRegister}
              onChange={v => setSettings({ ...settings, allowRegister: v })}
            />
            <ToggleRow
              label="允许用户创建房间"
              desc="开启后用户可创建专属房间；关闭不影响已有房间"
              checked={settings.allowUserCreateRoom}
              onChange={v => setSettings({ ...settings, allowUserCreateRoom: v })}
            />
            <ToggleRow
              label="启用系统房间"
              desc="内置的「你画我猜」与「英语猜猜看」房间是否在公开列表展示并允许进入"
              checked={settings.systemRoomsEnabled}
              onChange={v => setSettings({ ...settings, systemRoomsEnabled: v })}
            />
            <div className="flex justify-end pt-2 border-t border-edge/60">
              <Button variant="primary" size="sm" pill={false} disabled={saving} onClick={saveSettings} className="rounded-md">
                {saving ? '保存中...' : '保存设置'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 用户管理 ── */}
      {tab === 'users' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setUserPage(1); loadUsers() } }}
                placeholder="搜索昵称或邮箱..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-card border border-edge/80 focus:border-primary outline-none text-ink font-normal"
              />
            </div>
            <Button variant="outline" size="sm" pill={false} onClick={() => { setUserPage(1); loadUsers() }} className="rounded-md">
              <Search className="w-3.5 h-3.5" /> 搜索
            </Button>
            <span className="text-[10px] text-ink-soft font-mono font-normal">共 {userTotal} 人</span>
          </div>

          <div className="rounded-[10px] border border-edge/80 bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-ink-soft bg-warm/50 border-b border-edge/70">
                  <th className="px-3 py-2 font-normal">用户</th>
                  <th className="px-3 py-2 font-normal">角色</th>
                  <th className="px-3 py-2 font-normal">状态</th>
                  <th className="px-3 py-2 font-normal text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-ink-soft"><Loader2 className="w-5 h-5 mx-auto animate-spin text-primary" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-ink-soft">暂无用户</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="border-b border-edge/40 hover:bg-warm/30">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <VoxelAvatar avatarKey={u.avatarKey} size={30} />
                        <div className="flex flex-col">
                          <span className="text-ink font-normal">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-ink-soft font-mono">{u.email} · UID {u.uid}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border ${u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-warm text-ink-soft border-edge/60'}`}>
                        {u.role === 'admin' ? '管理员' : '用户'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border ${u.enabled ? 'bg-primary/10 text-primary border-primary/20' : 'bg-coral/10 text-coral border-coral/20'}`}>
                        {u.enabled ? '正常' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.id === currentUser.id ? (
                          <span className="text-[11px] text-ink-soft italic px-2 py-1">当前账号</span>
                        ) : u.role === 'admin' && currentUser.superAdmin !== true ? (
                          <span className="text-[11px] text-ink-soft italic px-2 py-1">同级管理员</span>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" pill={false} className="rounded-md" title={u.enabled ? '禁用' : '启用'} onClick={() => toggleUserEnabled(u)}>
                              {u.enabled ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">{u.enabled ? '禁用' : '启用'}</span>
                            </Button>
                            {currentUser.superAdmin === true && (
                              <Button variant="outline" size="sm" pill={false} className="rounded-md" title={u.role === 'admin' ? '取消管理员' : '设为管理员'} onClick={() => toggleUserRole(u)}>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{u.role === 'admin' ? '取消管理' : '设为管理'}</span>
                              </Button>
                            )}
                            <Button variant="danger" size="sm" pill={false} className="rounded-md" title="删除用户" onClick={() => deleteUser(u)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userTotal > userPageSize && (
            <Pagination page={userPage} totalPages={Math.ceil(userTotal / userPageSize)} onChange={setUserPage} />
          )}
        </div>
      )}

      {/* ── 房间管理 ── */}
      {tab === 'rooms' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={roomSearch}
                onChange={e => setRoomSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setRoomPage(1); loadRooms() } }}
                placeholder="搜索房间名或房主..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-card border border-edge/80 focus:border-primary outline-none text-ink font-normal"
              />
            </div>
            <Button variant="outline" size="sm" pill={false} onClick={() => { setRoomPage(1); loadRooms() }} className="rounded-md">
              <Search className="w-3.5 h-3.5" /> 搜索
            </Button>
            <span className="text-[10px] text-ink-soft font-mono font-normal">共 {roomTotal} 间</span>
          </div>

          <div className="rounded-[10px] border border-edge/80 bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-ink-soft bg-warm/50 border-b border-edge/70">
                  <th className="px-3 py-2 font-normal">房间</th>
                  <th className="px-3 py-2 font-normal">房主</th>
                  <th className="px-3 py-2 font-normal">状态</th>
                  <th className="px-3 py-2 font-normal text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {roomsLoading ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-ink-soft"><Loader2 className="w-5 h-5 mx-auto animate-spin text-primary" /></td></tr>
                ) : rooms.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-ink-soft">暂无房间</td></tr>
                ) : rooms.map(r => (
                  <tr key={r.id} className="border-b border-edge/40 hover:bg-warm/30">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-ink font-normal">{r.name}</span>
                        <span className="text-[10px] text-ink-soft font-mono">{r.id} · {r.type === 'english' ? '英语' : '你画我猜'}{r.hasPassword ? ' · 加密' : ''}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-ink font-normal">{r.ownerName || '未知'}</span>
                        <span className="text-[10px] text-ink-soft font-mono">{r.ownerEmail || ''}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border ${r.adminDisabled ? 'bg-coral/10 text-coral border-coral/20' : r.isOpen ? 'bg-primary/10 text-primary border-primary/20' : 'bg-warm text-ink-soft border-edge/60'}`}>
                          {r.adminDisabled ? '已禁用' : r.isOpen ? '开放中' : '已关闭'}
                        </span>
                        {!r.isPublic && <span className="text-[10px] text-ink-soft px-1.5 py-0.5 rounded-md border border-edge/60">私有</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" pill={false} className="rounded-md" title={r.adminDisabled ? '启用' : '禁用'} onClick={() => toggleRoomDisabled(r)}>
                          {r.adminDisabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{r.adminDisabled ? '启用' : '禁用'}</span>
                        </Button>
                        <Button variant="outline" size="sm" pill={false} className="rounded-md" title="编辑房间" onClick={() => setEditRoom({ room: r, name: r.name.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u, ''), type: r.type, isOpen: r.isOpen, isPublic: r.isPublic, password: string })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="danger" size="sm" pill={false} className="rounded-md" title="删除房间" onClick={() => deleteRoom(r)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {roomTotal > roomPageSize && (
            <Pagination page={roomPage} totalPages={Math.ceil(roomTotal / roomPageSize)} onChange={setRoomPage} />
          )}
        </div>
      )}

      {/* 编辑用户资料弹窗 */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-[10px] border border-edge shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-5 flex flex-col gap-3.5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-edge/60 pb-2.5">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary" /> 编辑用户资料 · {editUser.user.name}
              </h3>
              <button onClick={() => setEditUser(null)} className="text-xs text-ink-soft hover:text-ink font-normal cursor-pointer">关闭</button>
            </div>

            {/* 1. 头像选择 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-normal text-ink flex items-center justify-between">
                <span>更换头像</span>
                <span className="text-[10px] text-ink-soft font-mono">当前: {editUser.avatarKey}</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-2 bg-paper/70 rounded-[8px] border border-edge/60">
                {VOXEL_AVATAR_LIST.map((avatar) => {
                  const isSelected = editUser.avatarKey === avatar.id
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setEditUser({ ...editUser, avatarKey: avatar.id })}
                      className={`p-1 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-tint/80 border-primary ring-1 ring-primary/30 scale-105 shadow-xs'
                          : 'bg-card border-edge/60 hover:border-primary/40'
                      }`}
                      title={avatar.name}
                    >
                      <VoxelAvatar avatarKey={avatar.id} size={28} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. 昵称 */}
            <label className="flex flex-col gap-1 text-xs font-normal text-ink">
              <span>玩家昵称</span>
              <input
                value={editUser.name}
                maxLength={16}
                onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                className="px-3 py-2 rounded-md bg-paper/80 border border-edge/80 text-ink outline-none focus:border-primary font-normal"
              />
            </label>

            {/* 3. 邮箱 (只读展示) */}
            <label className="flex flex-col gap-1 text-xs font-normal text-ink">
              <span>注册邮箱 (不可更改)</span>
              <input
                disabled
                value={editUser.user.email}
                className="px-3 py-2 rounded-md bg-warm/50 border border-edge/60 text-ink-soft font-mono cursor-not-allowed text-xs"
              />
            </label>

            {/* 4. 重置密码 */}
            <label className="flex flex-col gap-1 text-xs font-normal text-ink">
              <span className="flex items-center justify-between">
                <span>重置登录密码</span>
                <span className="text-[10px] text-ink-soft">不修改请留空 (至少8位)</span>
              </span>
              <input
                type="password"
                value={editUser.password}
                placeholder="输入新密码将直接覆盖原有密码"
                onChange={e => setEditUser({ ...editUser, password: e.target.value as any })}
                className="px-3 py-2 rounded-md bg-paper/80 border border-edge/80 text-ink outline-none focus:border-primary font-normal"
              />
            </label>

            {/* 5. 权限与状态 */}
            {editUser.user.id !== currentUser?.id && (
              <>
                <div className="flex items-center justify-between p-2.5 bg-paper/70 rounded-[8px] border border-edge/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-normal text-ink">超级管理员权限</span>
                    <span className="text-[10px] text-ink-soft">开启后拥有后台管理权限</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editUser.role === 'admin'}
                    onChange={e => setEditUser({ ...editUser, role: e.target.checked ? 'admin' : 'user' })}
                    className="w-4 h-4 text-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-paper/70 rounded-[8px] border border-edge/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-normal text-ink">账号启用状态</span>
                    <span className="text-[10px] text-ink-soft">禁用后立即登出且禁止登录</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editUser.enabled}
                    onChange={e => setEditUser({ ...editUser, enabled: e.target.checked })}
                    className="w-4 h-4 text-primary cursor-pointer"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge/60">
              <Button variant="outline" size="sm" pill={false} onClick={() => setEditUser(null)} className="rounded-md">取消</Button>
              <Button variant="primary" size="sm" pill={false} onClick={saveUserEdit} className="rounded-md">保存修改</Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑房间弹窗 */}
      {editRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-[10px] border border-edge shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-5 flex flex-col gap-3.5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-edge/60 pb-2.5">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary" /> 编辑房间
              </h3>
              <button onClick={() => setEditRoom(null)} className="text-xs text-ink-soft hover:text-ink font-normal cursor-pointer">关闭</button>
            </div>
            <label className="flex flex-col gap-1 text-xs font-normal text-ink">
              房间名称
              <input value={editRoom.name} onChange={e => setEditRoom({ ...editRoom, name: e.target.value })} className="px-3 py-2 rounded-md bg-paper/80 border border-edge/80 text-ink outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-normal text-ink">
              玩法类型
              <select value={editRoom.type} onChange={e => setEditRoom({ ...editRoom, type: e.target.value as any })} className="px-3 py-2 rounded-md bg-paper/80 border border-edge/80 text-ink outline-none focus:border-primary">
                <option value="draw">你画我猜</option>
                <option value="english">英语猜猜看</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-normal text-ink">
              入房密码 (留空保持不变)
              <input value={editRoom.password} onChange={e => setEditRoom({ ...editRoom, password: e.target.value })} placeholder="输入新密码可修改" className="px-3 py-2 rounded-md bg-paper/80 border border-edge/80 text-ink outline-none focus:border-primary font-mono" />
            </label>
            <div className="flex items-center justify-between p-2.5 bg-paper/70 rounded-[8px] border border-edge/60">
              <span className="text-xs font-normal text-ink">房间开放开关</span>
              <input type="checkbox" checked={editRoom.isOpen} onChange={e => setEditRoom({ ...editRoom, isOpen: e.target.checked })} className="w-4 h-4 text-primary cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-2.5 bg-paper/70 rounded-[8px] border border-edge/60">
              <span className="text-xs font-normal text-ink">在大厅公开展示</span>
              <input type="checkbox" checked={editRoom.isPublic} onChange={e => setEditRoom({ ...editRoom, isPublic: e.target.checked })} className="w-4 h-4 text-primary cursor-pointer" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge/60">
              <Button variant="outline" size="sm" pill={false} onClick={() => setEditRoom(null)} className="rounded-md">取消</Button>
              <Button variant="primary" size="sm" pill={false} onClick={saveRoomEdit} className="rounded-md">保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-xs font-normal text-ink">{label}</span>
        <span className="text-[10px] text-ink-soft font-normal">{desc}</span>
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5 text-primary rounded cursor-pointer shrink-0" />
    </div>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      <Button variant="outline" size="sm" pill={false} disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-md">上一页</Button>
      <span className="text-ink-soft font-mono font-normal">{page} / {totalPages}</span>
      <Button variant="outline" size="sm" pill={false} disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-md">下一页</Button>
    </div>
  )
}

export default AdminPage