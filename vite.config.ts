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
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3000',
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
