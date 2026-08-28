# Agent Rules & Standards

## 1. Git Operations
- **Do not push to HTTPS remotes**: If the GitHub repository remote URL uses `https://` instead of `git@` SSH format (e.g. `https://github.com/...`), the agent must NOT attempt to run `git push`. Since HTTPS push requires credentials that cannot be entered in a non-interactive shell, it will fail. Advise the user to push the commits manually.

## 2. Zip Packaging Rules for Docker Deployment
当用户要求打包部署 zip 文件时，必须严格遵守以下打包白名单与黑名单规则：

### ❌ 严禁打包的内容（打包黑名单）：
- **严禁打包任何预编译/构建产物**：如 `dist/`、`.next/`、`.output/`、`build/`、`out/` 等。因为 Dockerfile 会在容器内执行源码构建（Multi-stage build），打入宿主机预编译产物不仅会导致体积膨胀数十倍，还会引发宿主机与 Linux 容器环境差异冲突。
- **严禁打包依赖目录**：`node_modules/`、`.pnpm-store/`、`vendor/` 等。
- **严禁打包本地系统/缓存文件**：`.git/`、`.DS_Store`、`*.log`、`*.tsbuildinfo`、`.turbo/`、`.cache/`。
- **严禁打包已有的旧 zip 文件**：如 `*.zip`。

### ✅ 必须打包的内容（打包白名单）：
- **核心源码目录**：`src/`、`public/`、`components/`、`hooks/`、`types/`、`styles/`、`constants/` 等应用源码。
- **构建配置文件**：`package.json`、`pnpm-lock.yaml` / `package-lock.json`、`tsconfig.json`、`vite.config.ts` / `next.config.js`、`tailwind.config.js`、`postcss.config.js`、`index.html`。
- **容器与服务端配置**：`Dockerfile`、`docker-compose.yml`、`server.js` / 服务端入口、环境变量示例 `.env.example`。
- **数据与静态配置**：项目所需的 `words.json`、`schema.prisma`、`drizzle.config.ts` 等运行时数据或迁移配置。

### 📦 标准打包命令范例：
```bash
# 在项目子目录内先清理旧 zip，再精准打包源码：
rm -f ../project.zip
zip -r ../project.zip \
  src public \
  index.html vite.config.ts tsconfig.json tsconfig.node.json \
  package.json Dockerfile docker-compose.yml server.js words.json \
  -x "dist/*" -x "node_modules/*" -x "*.log" -x "*.DS_Store" -x "*.zip"
```
