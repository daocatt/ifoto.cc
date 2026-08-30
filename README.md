# ifoto.cc

基于 Excalidraw 的轻量级多人实时协同白板与「你画我猜」派对游戏平台。  
*A lightweight, real-time collaborative whiteboard & Draw & Guess party game powered by Excalidraw.*

---

## 🌟 模式对比 (Local vs Online)

- **本地模式 (`local`)**：无需数据库、免登录开箱即用，适合家庭局域网、NAS 或私密聚会快速开局。
- **线上模式 (`online`)**：基于 PostgreSQL 提供完整的用户账户体系、画作云端存档与房间持久化管理。

---

## 🚀 Docker 快速部署

### 1. 克隆仓库与配置环境

```bash
git clone git@github.com:daocatt/ifoto.cc.git
cd ifoto.cc
cp .env.example .env
```

### 2. 启动服务

#### 选项 A：本地模式（默认，极简无依赖）
```bash
docker compose up -d
```

#### 选项 B：线上模式（启用 PostgreSQL 账户与存档）
编辑 `.env` 文件，取消注释或设置 `COMPOSE_PROFILES=online` 与 `APP_MODE=online`，然后启动：
```bash
docker compose --profile online up -d
```

启动完成后，在浏览器访问 `http://localhost:3000` 即可开始创作与游戏！

---

## 📄 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。
