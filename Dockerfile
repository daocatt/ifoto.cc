# 多阶段生产构建 Dockerfile (使用 1ms 加速源)
FROM docker.1ms.run/library/node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN npm install

# 拷贝源码并构建生产资源
COPY . .
RUN npm run build

# 生产运行阶段 (使用 Node.js 运行 Hono REST API + WebSocket 房间同步服务器)
FROM docker.1ms.run/library/node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN npm install --omit=dev

COPY server.js ./
COPY server/ ./server/
COPY words.json words_en.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD ["node", "server.js"]
