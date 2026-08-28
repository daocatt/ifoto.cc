import 'dotenv/config' // 必须在最顶部，确保 .env 变量在所有模块加载前注入
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { statusRouter } from './server/routes/status.js'
import { authRouter } from './server/routes/auth.js'
import { roomsRouter } from './server/routes/rooms.js'
import { profileRouter } from './server/routes/profile.js'
import { scoresRouter } from './server/routes/scores.js'
import { initWebSocketServer } from './server/websocket.js'
import { runAutoMigrations } from './server/migrate.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = parseInt(process.env.PORT || '3000', 10)
const DIST_DIR = path.join(__dirname, 'dist')

// 1. 初始化 Hono 应用
const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// 2. 挂载 API 路由
app.route('/api', statusRouter)
app.route('/api/auth', authRouter)
app.route('/api/rooms', roomsRouter)
app.route('/api/profile', profileRouter)
app.route('/api/scores', scoresRouter)

// 题库热更新路由
app.get('/api/words', (c) => {
  const isEn = c.req.query('room') === 'english'
  const fileName = isEn ? 'words_en.json' : 'words.json'
  const jsonPath = path.join(__dirname, fileName)
  if (fs.existsSync(jsonPath)) {
    c.header('Content-Type', 'application/json; charset=UTF-8')
    return c.body(fs.readFileSync(jsonPath, 'utf-8'))
  }
  return c.json({ error: 'File not found' }, 404)
})

app.get('/api/words_en', (c) => {
  const jsonPath = path.join(__dirname, 'words_en.json')
  if (fs.existsSync(jsonPath)) {
    c.header('Content-Type', 'application/json; charset=UTF-8')
    return c.body(fs.readFileSync(jsonPath, 'utf-8'))
  }
  return c.json({ error: 'File not found' }, 404)
})

// MIME 映射
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

// 3. 创建 HTTP Server 并桥接 Hono
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`)
  const pathname = urlObj.pathname

  // API 路由交由 Hono 处理
  if (pathname.startsWith('/api')) {
    const webReq = new Request(urlObj.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
      duplex: 'half'
    })

    const honoRes = await app.fetch(webReq)
    res.writeHead(honoRes.status, Object.fromEntries(honoRes.headers.entries()))
    if (honoRes.body) {
      const reader = honoRes.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    }
    return res.end()
  }

  // 静态 SPA 资源托管
  let reqPath = pathname
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html'
  }

  let filePath = path.join(DIST_DIR, reqPath)

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html')
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    })

    fs.createReadStream(filePath).pipe(res)
  })
})

// 4. 挂载 WebSocket 服务
initWebSocketServer(server)

server.listen(PORT, '0.0.0.0', async () => {
  const mode = process.env.APP_MODE === 'online' ? 'online' : 'local'
  console.log(`=======================================================`)
  console.log(`🎨 你画我猜 (Whiteboard Game V2) 服务已启动`)
  console.log(`📡 运行模式: [${mode.toUpperCase()}] | 监听端口: ${PORT}`)
  console.log(`🚀 访问地址: http://localhost:${PORT}`)
  console.log(`=======================================================`)

  if (mode === 'online') {
    await runAutoMigrations()
  }
})
