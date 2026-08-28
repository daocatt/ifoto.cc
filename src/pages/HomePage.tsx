import React from 'react'
import { AudioLines, ArrowRight, Play, Palette, Users, Globe, Trophy } from 'lucide-react'
import { Button } from '../components/Common/Button'

interface HomePageProps {
  onStart: () => void
}

export const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-dot-pattern">
      {/* 背景动态光晕 */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full flex flex-col items-center gap-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* 顶部标签 */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tint/80 border border-primary/20 text-primary text-xs font-bold shadow-xs">
          <AudioLines className="w-4 h-4 text-primary" />
          <span>多人实时涂鸦猜词 就在 iFOTO</span>
        </div>

        {/* 大大标题 */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-ink tracking-tight flex items-center gap-3">
            <span>你画我猜</span>
            <span className="text-primary text-3xl sm:text-5xl">🎨</span>
          </h1>
          <p className="text-base sm:text-lg text-ink-soft max-w-md font-medium">
            与家人好友实时画板互动派对！内置千道精心挑选的纯名词与中英双语题库。
          </p>
        </div>

        {/* 核心特性预览 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-card border border-edge/60 shadow-xs">
            <Palette className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs font-bold text-ink">双语题库</span>
            <span className="text-[10px] text-ink-soft">1100+ 纯名词</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-card border border-edge/60 shadow-xs">
            <Users className="w-5 h-5 text-gold mb-1" />
            <span className="text-xs font-bold text-ink">多人对战</span>
            <span className="text-[10px] text-ink-soft">实时同屏抢答</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-card border border-edge/60 shadow-xs">
            <Globe className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs font-bold text-ink">房间管理</span>
            <span className="text-[10px] text-ink-soft">专属链接与码</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-card border border-edge/60 shadow-xs">
            <Trophy className="w-5 h-5 text-coral mb-1" />
            <span className="text-xs font-bold text-ink">战绩历史</span>
            <span className="text-[10px] text-ink-soft">积分段位记录</span>
          </div>
        </div>

        {/* 立即开启主操作按钮 */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            variant="primary"
            onClick={onStart}
            className="text-base sm:text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all font-black flex items-center gap-3 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>立即开启</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
