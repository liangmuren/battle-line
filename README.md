# Battle Line Online

基于 Reiner Knizia 经典桌游 **Battle Line** 的双人在线对战卡牌游戏。通过自建 WebSocket 中继服务器联机，支持断线重连。

## 游戏规则

两名玩家争夺 9 面旗帜。每回合打出一张牌到旗帜上，组成 3 张卡牌的阵型（有泥泞时需要 4 张）。先夺取 **5 面旗帜**或 **3 面相邻旗帜**的玩家获胜。

### 阵型（从强到弱）

| 阵型 | 英文 | 说明 |
|------|------|------|
| 楔形 | Wedge | 同花色连续三张（straight flush） |
| 方阵 | Phalanx | 三张相同数值（three of a kind） |
| 雁行 | Battalion | 同花色任意三张（flush） |
| 散兵 | Skirmish | 不同花色连续三张（straight） |
| 乌合 | Host | 其他组合，比较总和 |

### 卡牌

**部队牌**：6 种颜色 × 10 种数值 = 60 张

**战术牌**（10 张，每种 1 张）：

| 卡牌 | 类型 | 效果 |
|------|------|------|
| Alexander / Darius | 领袖 | 万能牌，可充当任意颜色任意数值 |
| 骑兵侍从 | 领袖 | 万能牌，任意颜色，值固定为 8 |
| 盾兵卫队 | 领袖 | 万能牌，任意颜色，值为 1/2/3 |
| 迷雾 | 环境 | 取消该旗帜阵型，只比数值总和 |
| 泥泞 | 环境 | 该旗帜需要 4 张卡才能完成 |
| 侦察兵 | 谋略 | 抽 3 张牌，还 2 张到牌堆顶 |
| 调遣 | 谋略 | 移动己方卡牌到另一旗帜或弃掉 |
| 逃兵 | 谋略 | 移除对方未判定旗帜上的一张卡 |
| 叛变 | 谋略 | 偷取对方旗帜上的一张部队卡 |

**战术卡限制**：你使用的战术卡数量不能比对手多超过 1 张。

### 宣称旗帜

在你的回合，如果你能证明对手无论用剩余的哪些牌都无法超过你的阵型，你可以主动宣称该旗帜。

## 技术栈

- **Vite** — 构建工具
- **React 18** — UI 框架
- **Tailwind CSS v4** — 样式
- **WebSocket** — 自建中继服务器联机（`ws` 库）

## 快速开始

### 1. 启动中继服务器

```bash
cd server
npm install
npm start
```

服务器默认监听 `3001` 端口，可通过 `PORT` 环境变量修改。

### 2. 启动客户端

```bash
npm install
npm run dev
```

客户端在本地 Vite 开发环境默认连接 `ws://localhost:3001`。生产环境推荐由 relay 服务同进程托管前端静态资源，客户端会按当前访问域名自动连接同源 WebSocket：

- `http://your-domain` → `ws://your-domain`
- `https://your-domain` → `wss://your-domain`

如果前端和 relay 分开部署，再在项目根目录创建 `.env` 文件指定服务器地址：

```
VITE_WS_URL=wss://your-server
```

### 3. 开始游戏

1. 一方点击 **创建房间**，获得 4 位房间代码
2. 将代码发给朋友
3. 朋友点击 **加入房间**，输入代码即可连接对战

## 构建

```bash
npm run build
npm start
```

`npm start` 会启动 `server/server.js`，同一个 Node 服务会：

1. 托管 `dist/` 前端构建产物
2. 在相同域名和端口上提供 WebSocket relay

## 生产部署

### 通用 Node 部署

构建命令：

```bash
npm run deploy:build
```

启动命令：

```bash
npm start
```

环境变量：

- `PORT`：平台注入的监听端口，默认 `3001`
- `CLIENT_DIST_DIR`：前端构建目录，默认项目根目录下的 `dist`

域名接入时，需要让反向代理或云平台支持 WebSocket upgrade。HTTPS 域名访问时，浏览器会自动使用 `wss://` 连接同域 relay。

### Docker 部署

```bash
docker build -t battle-line .
docker run --rm -p 3001:3001 battle-line
```

访问 `http://localhost:3001` 即可打开游戏并使用同端口 WebSocket relay。

### Render Blueprint

仓库包含 `render.yaml`，可作为 Render Blueprint 创建 Web Service：

- Build Command: `npm run deploy:build`
- Start Command: `npm start`
- 服务创建后可绑定自定义域名

部署完成后，用浏览器访问平台域名或自定义域名；一名玩家创建房间，另一名玩家用房间码加入即可真实对战。

如果使用 GitHub Actions 触发 Render 部署：

1. 在 Render 服务的 Settings 页面复制 Deploy Hook URL
2. 在 GitHub 仓库里添加 Actions secret：`RENDER_DEPLOY_HOOK_URL`
3. 手动运行 `Deploy to Render` workflow
4. 可选填写部署后的域名，workflow 会运行：

```bash
npm run smoke:production -- https://your-domain
```

该 smoke 会校验首页、`/healthz`、WebSocket 创建房间和加入房间。

## 联机说明

- 游戏通过自建 WebSocket 中继服务器转发消息，Host 客户端为权威端
- 支持断线自动重连（指数退避，最长 30 秒），刷新页面后可恢复对局
- 房间 2 小时无活动自动清理
