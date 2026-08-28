import { LogOut, Settings, LayoutGrid, Home, ShieldCheck } from 'lucide-react'
import { ApiUser } from '../../services/api'
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
            {mode === 'local' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-warm text-ink-soft border-edge">
                本地模式
              </span>
            )}
          </div>
          <span className="text-[11px] text-ink-soft hidden sm:inline">iFOTO 开源的有趣益智互动</span>
        </div>
      </div>

      {/* 2. 右侧操作区 */}
      <div className="flex items-center gap-2">
        {mode === 'local' ? (
          <div className="flex items-center gap-2">
            {currentRoute === 'lobby' ? (
              <button
                onClick={() => onNavigate('home')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-warm text-ink hover:bg-edge/80 border border-edge/60 shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>返回首页</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('lobby')}
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
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentRoute === 'admin'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-warm text-ink hover:bg-edge/80'
                    }`}
                    title="管理后台"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">管理后台</span>
                  </button>
                )}
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'profile'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-warm text-ink hover:bg-edge/80'
                  }`}
                  title="查看个人主页"
                >
                  <span className="max-w-[80px] truncate">主页</span>
                </button>

                <button
                  onClick={() => onNavigate('settings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'settings'
                      ? 'bg-warm text-ink border border-edge'
                      : 'text-ink-soft hover:text-ink hover:bg-warm border border-transparent hover:border-edge'
                  }`}
                  title="个人设置"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>设置</span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer text-ink-soft hover:text-coral hover:bg-coral/10 border border-transparent hover:border-coral/20"
                    title="退出登录"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>退出</span>
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
