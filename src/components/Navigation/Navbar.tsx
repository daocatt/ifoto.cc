import { LogOut, Settings, LayoutGrid, Home } from 'lucide-react'
import { ApiUser } from '../../services/api'
import { VoxelAvatar } from '../Common/VoxelAvatar'
import { AppLogo } from '../Common/AppLogo'

interface NavbarProps {
  mode: 'local' | 'online'
  currentUser?: ApiUser | null
  currentRoute: string
  onNavigate: (route: string) => void
  onLogout?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  currentUser,
  currentRoute,
  onNavigate,
  onLogout
}) => {
  return (
    <header className="h-16 px-4 md:px-8 border-b border-edge/60 bg-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between shadow-xs">
      {/* 1. 左侧 Logo 与模式徽章 */}
      <div
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2.5 cursor-pointer select-none group"
      >
        <AppLogo size={34} className="group-hover:scale-105 transition-transform" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-ink tracking-tight">你画我猜</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              mode === 'online'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-warm text-ink-soft border-edge'
            }`}>
              {mode === 'online' ? '线上多房版' : '本地单机版'}
            </span>
          </div>
          <span className="text-[11px] text-ink-soft hidden sm:inline">iFOTO 开源的有趣益智互动</span>
        </div>
      </div>

      {/* 2. 右侧操作区 */}
      <div className="flex items-center gap-2">
        {mode === 'local' ? (
          <div className="flex items-center gap-2">
            {currentRoute === 'local-lobby' ? (
              <button
                onClick={() => onNavigate('home')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-warm text-ink hover:bg-edge/80 border border-edge/60 shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>返回首页</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('local-lobby')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-primary text-white shadow-xs"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>选择房间</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => onNavigate('lobby')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'lobby'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-warm text-ink hover:bg-edge/80'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>游戏大厅</span>
                </button>

                <button
                  onClick={() => onNavigate('profile')}
                  className={`flex items-center gap-2 p-1 pl-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    currentRoute === 'profile'
                      ? 'bg-tint/80 border-primary text-primary shadow-xs'
                      : 'bg-warm border-edge text-ink hover:border-primary/40'
                  }`}
                  title="查看个人主页"
                >
                  <span className="max-w-[80px] truncate">{currentUser.name}</span>
                  <VoxelAvatar avatarKey={currentUser.avatarKey} size={28} />
                </button>

                <button
                  onClick={() => onNavigate('settings')}
                  className={`p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-warm transition-colors cursor-pointer border border-transparent hover:border-edge ${
                    currentRoute === 'settings' ? 'bg-warm text-ink border-edge' : ''
                  }`}
                  title="个人设置"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-xl text-ink-soft hover:text-coral hover:bg-coral/10 transition-colors cursor-pointer"
                    title="退出登录"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-ink bg-warm hover:bg-edge/80 transition-all cursor-pointer border border-edge/60"
                >
                  登录
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all cursor-pointer"
                >
                  注册新账号
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
