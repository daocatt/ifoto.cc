# 家庭内网 Excalidraw 共享协同 + “你画我猜”计分系统方案

## 🎯 一、项目目标与定位

从零构建一套轻量、好玩的**家庭内网专属实时协作系统**，目标直接部署在 NAS 的 Docker 环境中：
1. **家庭实时协同画板**：基于 Excalidraw + 协作房间（WebSocket 实时同步全家笔迹）。
2. **“你画我猜”游戏与计分辅助**：
   - **画板区域**：一人画、大家实时看。
   - **计分与互动悬浮面板**：支持**手动加减分**（点赞/猜对打赏积分）以及**自动计时/答题加分判定**。
   - **家庭成员积分榜**：实时统计全家每一轮得分情况。
3. **NAS 内网开箱即用**：自带 Caddy 自动生成本地合法 HTTPS 证书，解决浏览器 WebSocket / WebRTC 及加密协作权限限制。

---

## 🏗️ 二、系统架构与容器拓扑

```
                           +-----------------------------------------------+
                           |      局域网设备 (手机 / iPad平板 / 电脑 / 电视)   |
                           +-----------------------+-----------------------+
                                                   | HTTPS / WSS
                                                   v
                           +-----------------------------------------------+
                           |              Caddy 反向代理网关                 |
                           |       - 自动签发内网 SSL 证书 (tls internal)     |
                           |       - 443: 前端主界面                        |
                           |       - 5001: 协同 WebSocket 房间              |
                           +-----------------------+-----------------------+
                                                   |
                     +-----------------------------+-----------------------------+
                     |                                                           |
                     v                                                           v
+------------------------------------------+    +------------------------------------------+
|          Excalidraw 前端 + 计分面板         |    |         Excalidraw 协作室服务            |
|               (excalidraw-web)           |    |            (excalidraw-room)             |
| - 自由白板画图                            |    | - 负责笔迹、图层实时的 WebSocket 多人广播   |
| - 右侧/底部“你画我猜”计分悬浮 HUD           |    +------------------------------------------+
| - 成员头像 + 手动加减分 + 词库出题         |
+------------------------------------------+
```

---

## 🎮 三、“你画我猜 + 计分系统” 详细功能设计

### 1. 游戏互动界面布局
- **主画布 (75% 视口)**：无延迟的 Excalidraw 实时画板，支持多颜色、手写笔感触控。
- **右侧/悬浮互动 HUD 面板**：
  - **题库抽词区 (出题人)**：点击随机抽取题目（如：动物、水果、生活用品、影视），仅当前出题人可见或一键隐藏。
  - **倒计时计时器**：60秒/90秒倒计时，配有时钟提醒音效与超时提示。
  - **家庭计分板 (全家实时)**：
    - 展示家庭成员头像与名字（爸爸、妈妈、宝宝等）。
    - 猜对快捷按钮：点击 `+1分` / `+2分`（附带欢呼撒花动画特效 🎉）。
    - 快速扣分/撤销按钮：`-1分`。
    - 一键重置本局得分 / 保存历史战绩。

### 2. 计分模式支持
- **模式 A：极简手动计分（最实用稳定）**：
  - 谁猜对了，裁判或出题人直接在积分板上给对应家庭成员点 `+1`。
- **模式 B：自动计分辅助（可选）**：
  - 成员在内置简易聊天框输入答案，命中关键词自动判定正确，系统自动给该成员 `+1` 分并结束当前回合。

---

## 📂 四、NAS 部署目录结构

在 NAS 上的 Docker 目录（例如 `/volume1/docker/family-whiteboard`）创建：

```bash
family-whiteboard/
├── docker-compose.yml       # 一体化容器编排文件
├── Caddyfile                # 局域网自动化 HTTPS 与反代配置
└── scoreboard/              # 计分系统前端与题库配置 (如需定制挂载)
```

---

## 📄 五、完整部署配置文件

### 1. `Caddyfile` (Caddy 网关配置)

```caddy
# 请将 board.cc 设置为你想要的内网域名
board.cc {
    # 启用 Caddy 内置的本地证书颁发机构 (全内网自动签发合规 SSL)
    tls internal

    # 反向代理到 Excalidraw 网页端
    reverse_proxy excalidraw-web:80
}

# Excalidraw 协作室的 WebSocket 同步端口
board.cc:5001 {
    tls internal
    reverse_proxy excalidraw-room:5002
}
```

### 2. `docker-compose.yml` (容器编排)

```yaml
version: '3.8'

services:
  # 1. Excalidraw 网页端 (含协作与白板功能)
  excalidraw-web:
    image: excalidraw/excalidraw:latest
    container_name: excalidraw-web
    restart: unless-stopped
    environment:
      # 指向 Caddy 代理的 WebSocket 地址
      - REACT_APP_WS_SERVER_URL=https://board.cc:5001

  # 2. Excalidraw 协同房间服务 (实时笔迹同步)
  excalidraw-room:
    image: excalidraw/excalidraw-room:latest
    container_name: excalidraw-room
    restart: unless-stopped
    ports:
      - "5002:5002"

  # 3. Caddy 自动化 HTTPS 反代网关
  caddy:
    image: caddy:latest
    container_name: caddy-gateway
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "5001:5001"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - excalidraw-web
      - excalidraw-room

volumes:
  caddy_data:
  caddy_config:
```

---

## 🚀 六、NAS 上线操作指南（仅需 3 步）

### 第一步：在 NAS 上启动服务
SSH 进入 NAS 部署目录执行：
```bash
docker compose up -d
```

### 第二步：局域网 DNS 映射（推荐在路由器设置）
- 在路由器后台（如 OpenWrt / iKuai / 小米/华为路由器）或 AdGuard Home 中添加自定义 DNS：
  - `board.cc` $\rightarrow$ `你的 NAS 局域网 IP` (例如 `192.168.1.50`)
- *(单机电脑测试也可直接在电脑 `hosts` 中添加 `192.168.1.50 board.cc`)*。

### 第三步：访问与证书信任
- 在手机 / iPad / 电脑浏览器输入：`https://board.cc`
- 首次进入提示不受信任时，直接在键盘上盲打输入：`thisisunsafe`（无需输入框，直接敲击键盘字母即可跳过）。
- 立即进入画板，点击右上角 **“Live collaboration / 实时协作”** 开启房间，全家手机平板扫码/点击链接即可同时画画、答题与计分！
