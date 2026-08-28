import React from 'react'
import { ArrowLeft, Pencil, Users, Globe, Zap, Github } from 'lucide-react'

interface HelpPageProps {
  onNavigate: (route: string) => void
}

export const HelpPage: React.FC<HelpPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 返回 */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink font-normal bg-warm hover:bg-edge/80 px-2.5 py-1 rounded-md border border-edge/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回</span>
        </button>
      </div>

      {/* 主标题卡片 */}
      <div className="bg-card/95 backdrop-blur-md rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2 border-b border-edge/60 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🎨</span>
            <h1 className="text-xl font-black text-ink tracking-tight">iFOTO</h1>
          </div>
          <p className="text-sm text-ink font-normal leading-relaxed">
            基于 Excalidraw 的轻量级多人实时协同白板与「你画我猜」派对游戏平台。
          </p>
          <p className="text-xs text-ink-soft font-normal leading-relaxed">
            A lightweight, real-time collaborative whiteboard &amp; Draw &amp; Guess party game powered by Excalidraw.
          </p>
        </div>

        {/* 功能亮点 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 bg-paper/70 rounded-[8px] border border-edge/60">
            <div className="w-8 h-8 rounded-[6px] bg-tint flex items-center justify-center shrink-0 border border-primary/20">
              <Pencil className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-ink">实时协同白板</span>
              <span className="text-[11px] text-ink-soft font-normal leading-relaxed">
                基于 Excalidraw 引擎，多人同步绘图，笔迹实时同步无延迟
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-paper/70 rounded-[8px] border border-edge/60">
            <div className="w-8 h-8 rounded-[6px] bg-tint flex items-center justify-center shrink-0 border border-primary/20">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-ink">你画我猜派对</span>
              <span className="text-[11px] text-ink-soft font-normal leading-relaxed">
                多人实时游戏房间，内置中英双语题库，支持自定义房间与积分系统
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-paper/70 rounded-[8px] border border-edge/60">
            <div className="w-8 h-8 rounded-[6px] bg-tint flex items-center justify-center shrink-0 border border-primary/20">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-ink">双模式支持</span>
              <span className="text-[11px] text-ink-soft font-normal leading-relaxed">
                本地模式（免登录快速游戏）与线上模式（账号体系、个人主页、战绩排行）
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-paper/70 rounded-[8px] border border-edge/60">
            <div className="w-8 h-8 rounded-[6px] bg-tint flex items-center justify-center shrink-0 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-ink">轻量易部署</span>
              <span className="text-[11px] text-ink-soft font-normal leading-relaxed">
                单容器 Docker 部署，PostgreSQL 可选，支持私有化自托管
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 技术栈 */}
      <div className="bg-card/95 backdrop-blur-md rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5 flex flex-col gap-3">
        <h2 className="text-xs font-bold text-ink">技术栈 Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {['Excalidraw', 'React', 'Hono', 'PostgreSQL', 'Drizzle ORM', 'WebSocket', 'Vite', 'TailwindCSS', 'Docker'].map(tech => (
            <span
              key={tech}
              className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-md bg-warm border border-edge/60 text-ink-soft"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* 底部 */}
      <div className="flex items-center justify-between text-[11px] text-ink-soft font-normal px-1">
        <span>iFOTO © 2026 · Open Source</span>
        <a
          href="https://github.com/daocatt/ifoto.cc"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          <span>daocatt/ifoto.cc</span>
        </a>
      </div>
    </div>
  )
}
