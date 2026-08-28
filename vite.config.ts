import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
  build: {
    // 核心 UI 框架拆成独立 vendor chunk，便于浏览器长期缓存；超过该阈值才告警
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React 全家桶单独分包（Excalidraw 也会复用该 chunk）
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // 浏览器刷新/关闭页面/热更新引起的正常 TCP 断开连接，避免在控制台刷屏
            if ((err as any).code === 'ECONNRESET' || (err as any).code === 'EPIPE') return
            console.warn('[Vite WS Proxy Warning]:', err.message)
          })
        }
      }
    }
  }
})
