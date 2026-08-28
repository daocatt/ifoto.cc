# iFOTO 你画我猜 UI 设计规范与视觉体系

本文档定义了本项目核心 UI 组件、浮岛挂载卡片（HUD Island）、全站页面表单与弹窗的外框质感与排版规范。

---

## 1. 核心设计语言：Excalidraw 原生浮岛质感 (Island Frame)

为了与 Excalidraw 画板的现代极简主义融为一体，全站所有悬浮卡片、对话框和表单 Box 必须遵循以下设计规约：

### 1.1 外框容器标准 (Box Container)
- **圆角规范**：外层容器统一使用精致圆角 **`rounded-[10px]`** 或 **`rounded-xl`**（严禁使用粗笨的大圆角 `rounded-2xl` / `rounded-3xl`）。
- **细描边边框**：统一使用轻描边 **`border border-edge/80`**（或深色边框 `border-[#e3e2de]`）。
- **淡雅悬浮阴影**：统一使用 Excalidraw 级超轻微柔和阴影 **`shadow-[0_1px_4px_rgba(0,0,0,0.08)]`**（严禁使用厚重的 `shadow-2xl` / `shadow-lg`）。
- **背景与毛玻璃**：统一使用燕麦暖白与半透明磨砂 **`bg-card/95 backdrop-blur-md`**。

```tsx
// 标准浮岛卡片容器类名组合
className="bg-card/95 backdrop-blur-md p-3 rounded-[10px] border border-edge/80 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
```

### 1.2 内部微组件圆角 (Sub-components)
- **按钮 (Buttons)**：统一使用 **`rounded-md`** / **`rounded-[6px]`**，高度紧凑 `h-7` 或 `h-8`。
- **输入框 (Input Fields)**：统一使用 **`rounded-md`**，高度紧凑 `h-8 px-2.5`。
- **内层小模块/题目区**：统一使用 **`rounded-[8px]`**，浅色底 `bg-paper/80 border border-edge/60`。

---

## 2. 文字排版与字重体系 (Refined Typography)

- **去粗黑化 (Unbolded)**：全站文字群与标题**严禁滥用大面积 `font-bold` 或 `font-black`**。
- **标题与普通文本**：优先采用 **`font-normal`（常规细体）** 或 **`font-medium`**，配合层次分明的墨炭色阶：
  - 主文字：`text-ink`（#1b1813）
  - 次级辅助字：`text-ink-soft`（#6d6b64）
  - 弱化说明字：`text-ink-faint`（#b8b7b2）
- **数字与计量**：统一使用等宽字体 **`font-mono font-medium text-ink`**。

---

## 3. Excalidraw 原生工具栏主题色定制 (Toolbar Brand Theme)

- **工具激活状态**：顶部工具栏与左侧属性面板中选中的工具图标，统一应用品牌松石绿微透底色：
  - 选中高亮底：`rgba(0, 122, 102, 0.15)`
  - 图标与描边色：`#007a66`（`var(--color-primary)`）
  - 悬停浅底：`rgba(0, 122, 102, 0.06)`
  - 微圆角：`rounded-[8px]` / `rounded-[6px]`

---

## 4. 适用组件与页面清单

1. **游戏画板 HUD 悬挂区**：
   - 顶部主控/倒计时卡片：`ScoreboardPanel.tsx`、`TimerControl.tsx`
   - 题词抽词卡片：`WordDrawerModal.tsx`
   - 积分榜玩家列表卡片：`ScoreboardPanel.tsx`、`PlayerScoreCard.tsx`
   - 快捷互动发言面板：`QuickChatDrawer.tsx`
2. **全站页面表单与 Box UI**：
   - 本地/在线选房卡片：`LocalLobbyPage.tsx`、`OnlineLobbyPage.tsx`
   - 登录/注册表单卡片：`AuthPages.tsx`
   - 个人中心与设置卡片：`ProfilePage.tsx`、`SettingsPage.tsx`
   - 房间分享与管理弹窗：`ShareRoomModal.tsx`、`JoinRoomModal.tsx`、`ManagePlayersModal.tsx`

