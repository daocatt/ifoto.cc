import { useState, useEffect } from 'react'

// 移动端竖屏布局判定：宽度 < 768 或 高度 < 600（覆盖手机横竖屏与 iPad 竖屏）
// 当右侧悬浮面板放不下时，统一回退到手机竖屏 HUD
function isMobileLayout(): boolean {
  return window.innerWidth < 768 || window.innerHeight < 600
}

export function useIsMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== 'undefined' ? isMobileLayout() : false))

  useEffect(() => {
    const update = () => setIsMobile(isMobileLayout())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return isMobile
}