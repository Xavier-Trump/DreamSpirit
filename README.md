# DreamSpirit 梦灵

DreamSpirit 是一个 AI 梦境记录、解析、可视化与匿名共享 Web 应用。它从“醒来后快速记下梦境”出发，把文字记录、浏览器语音听写、AI 解析、梦境图片、元素图谱、主题洞察、共享梦境宇宙和导出报告整合到一个本地可运行的完整产品里。

当前仓库以**本地运行**为主要使用方式，不要求部署 Vercel、Neon 或 Supabase。数据默认保存在本机 PostgreSQL 中，AI Key 可以在设置页按账号保存，也可以通过 `.env.local` 作为兜底配置。

## 项目定位

题目计划书要求的是“AI 梦境记录与解析器”：支持文字/语音记录、AI 梦境解析、图片生成、时间轴浏览，并在进阶挑战中扩展梦境元素图谱、主题分析、匿名共享宇宙和梦境日记导出。

当前实现已经覆盖基础要求和主要进阶项，并额外加入：

- 账号注册 / 登录 / 注销
- PostgreSQL + Prisma 持久化存储
- 数据库驱动的异步 Job Queue + Worker
- 用户级 AI API 配置
- 可编辑情绪标签与主题规则
- 匿名共享前的本地规则审核和隐私脱敏
- 体验账号、seed 数据和 Windows 一键启动脚本
- Markdown 导出与浏览器打印 PDF 报告

## 功能完成度

| 计划书要求 | 当前实现 |
| --- | --- |
| 文字输入记录梦境 | TipTap 富文本编辑器，保存富文本 JSON 与纯文本内容 |
| 语音输入 | 浏览器 Web Speech API 实时听写，支持中文普通话、粤语、英文 |
| 基本信息记录 | 梦境时间、情绪标签、清晰度、重复梦境、现实关联、草稿/活跃/归档状态 |
| AI 多维解析 | 象征解读、情绪分析、压力源、主题标签、模式信号 |
| 创意故事生成 | 单条梦境可生成短篇故事或诗性散文，并持久化保存 |
| 梦境图片生成 | 调用图片模型生成代表性图片，保存为 DreamAsset |
| 时间轴浏览 | 支持按日期范围、情绪、清晰度筛选 |
| 元素图谱 | AI 提取人物、地点、物品、动作，前端以 SVG 关系图展示共现关系 |
| 主题分析 | 洞察报告统计高频主题、情绪分布、常见主题对比、压力模式 |
| 匿名共享 | 提交共享前执行本地规则审核、隐私脱敏，通过后进入共享池 |
| 梦境宇宙 | 从 3-5 条公开梦境生成公共梦境宇宙故事 |
| 导出 | 全量 Markdown 导出，打印页可由浏览器保存为 PDF |

## 技术架构

| 层级 | 技术 / 模块 |
| --- | --- |
| 前端 | Next.js App Router、React、TypeScript、lucide-react、TipTap |
| 样式 | 全局 CSS 变量、深色玻璃拟态面板、响应式网格、打印样式 |
| 认证 | Auth.js Credentials，自定义注册接口，bcryptjs 密码哈希 |
| 数据 | PostgreSQL、Prisma、关系模型与 seed 数据 |
| AI | 服务端统一 Provider，默认兼容豆包聊天与图片接口 |
| 异步任务 | `Job` 表 + `worker/run-jobs.ts` 轮询处理 |
| 存储 | 默认本地文件存储，图片 base64 回落保存到 `public/uploads` |
| 安全 | API Key 不在前端明文暴露，共享内容本地审核与脱敏 |

## 核心模块

### 梦境工作台

`/app` 展示总览数据、最近梦境、总记录数、已分析数和重复梦境数。每条梦境卡片可进入详情页继续编辑、分析或导出。

### 记录与编辑

`/dreams/new` 和 `/dreams/[id]` 复用 `DreamForm`：

- 标题、发生时间、富文本梦境内容
- 浏览器语音听写插入正文
- 多选情绪标签和临时自定义标签
- 清晰度 1-5 星
- 重复梦境标记
- 现实关联记录
- 草稿保存与正式保存
- 编辑页 15 秒自动保存草稿

### AI 解析与创意输出

梦境详情页提供：

- 解析梦境
- 生成故事
- 生成图片
- 提交匿名共享
- 导出 Markdown
- 打印 / 保存 PDF

解析、故事和图片都通过任务队列处理。前端只拿到 `jobId`，然后轮询 `/api/jobs/:id` 等待任务完成。

### 时间轴

`/timeline` 按日期分组展示梦境，支持：

- 开始日期 / 结束日期筛选
- 情绪筛选
- 清晰度筛选
- 点击记录进入详情页

### 元素图谱

`/elements` 使用已解析梦境中的 `DreamElement` 数据构建图谱：

- 节点代表元素，大小与出现次数相关
- 连线代表同一梦境中的共现关系
- 侧栏显示当前元素、类型、出现次数和关联元素

### 洞察报告

`/insights` 聚合活跃与归档梦境：

- 总记录、重复梦境、现实关联数量
- 高频主题
- 情绪分布
- 用户自定义主题规则对比
- 压力模式摘要
- 记录建议

### 共享梦境社区

`/community` 展示审核通过的匿名梦境。用户可以从共享池中选择 3-5 条梦境，生成公共“梦境宇宙”故事。

共享流程会先做本地规则审核：

- 自动隐藏邮箱、手机号、身份证号、链接、QQ、微信号、长数字等个人信息
- 命中违法、严重暴力、隐私泄露、引流等规则时拒绝或标记复核
- 只有审核通过的内容会进入公开共享池

### 设置中心

`/settings` 包含：

- 账号摘要与注销
- 本机离线 / 联网访问模式说明
- Markdown 下载与打印 PDF
- 用户级 AI API 配置
- 情绪标签与主题规则配置

## 目录结构

```text
app/                Next.js 页面与 API 路由
components/         UI 组件、表单、图谱、语音听写与交互动作
docs/               项目说明、AI 接入、功能与视觉系统文档
lib/                认证、Prisma、AI、任务、洞察、共享审核等服务层
prisma/             Prisma schema 与 seed 数据
public/brand/       品牌与背景图片素材
types/              类型增强
worker/             后台任务处理入口
```

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 准备环境变量

复制 `.env.example` 为 `.env.local`。默认本地配置示例：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dreamspirit?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
DEMO_MODE="false"
DEMO_USER_EMAIL="dreamer@dreamspirit.local"

AI_PROVIDER="doubao"
DOUBAO_API_KEY=""
DOUBAO_CHAT_MODEL="ep-20260130043458-8fvmf"
DOUBAO_IMAGE_MODEL="doubao-seedream-4-5-251128"
DOUBAO_ENDPOINT="https://ark.cn-beijing.volces.com/api/v3/chat/completions"
DOUBAO_IMAGE_ENDPOINT="https://ark.cn-beijing.volces.com/api/v3/images/generations"

STORAGE_MODE="local"
LOCAL_UPLOAD_DIR="./tmp/uploads"
```

说明：

- `DATABASE_URL` 指向本地 PostgreSQL。
- `AUTH_SECRET` 本地开发可先使用示例值，公开访问前必须换成随机长密钥。
- `DEMO_MODE=false` 表示正常本地开发，可以注册、编辑、删除和触发任务。
- `DOUBAO_API_KEY` 可以留空；进入应用后也可以在“设置”页填写 API Key、模型名和 Endpoint。
- 用户设置页保存的 AI 配置优先级高于环境变量。

### 3. 启动 PostgreSQL

推荐使用 Docker：

```bash
docker compose up -d
```

如果不用 Docker，也可以自行安装 PostgreSQL，并保证 `.env.local` 的 `DATABASE_URL` 指向可用数据库。

### 4. 初始化数据库

```bash
npx prisma db push
npm run prisma:seed
```

Seed 会创建：

- 1 个体验账号
- 多条梦境记录
- AI 解析、故事、元素与样例图片
- 审核通过的共享梦境
- 1 条梦境宇宙样例故事

体验账号：

```text
dreamer@dreamspirit.local
dreamspirit123
```

### 5. 启动 Web 与 Worker

开发时启动 Web：

```bash
npm run dev
```

稳定运行时启动 Web：

```bash
npm run build
npm run start
```

打开：

```text
http://localhost:3000
```

另开一个终端启动 Worker：

```bash
npm run worker
```

Worker 用于处理 AI 解析、故事生成、图片生成、共享审核、宇宙故事等异步任务。语音听写使用浏览器内置 Web Speech API，不依赖本项目 AI Key，也不需要 Worker。

## Windows 一键启动

Windows 用户可以双击：

```text
start-preview.bat
```

使用前请先安装：

- Node.js，需要包含 `npm`
- Docker Desktop，或本机 PostgreSQL

脚本会提供：

- `Quick start`：日常使用推荐，复用已有数据库和构建结果，启动更快。
- `Initialize / repair`：首次运行、换电脑、删除数据库、更新代码或打不开时使用，会同步数据库、写入 seed 并重新构建。

脚本还会让你选择：

- 本机离线：仅当前电脑访问。
- 局域网 / 隧道：允许同一 Wi-Fi 或临时公网隧道访问运行项目的这台电脑。

## 使用模式

### 本机离线模式

- 数据保存在运行者自己的本地 PostgreSQL / Docker volume。
- 账号、梦境、时间轴、导出、浏览器语音听写、共享本地规则审核都可以本地使用。
- AI 解析、故事生成、图片生成需要在设置页或 `.env.local` 配置 API Key。

### 局域网模式

同一 Wi-Fi 内其他设备访问运行项目的电脑：

```text
http://你的局域网IP:3000
```

如果其他设备打不开，通常需要在 Windows 防火墙中允许 Node.js 或端口 `3000`。

手动启动局域网访问：

```bash
npm run build
npm run start -- -H 0.0.0.0
```

### 隧道模式

需要临时远程访问时，可以使用 Cloudflare Tunnel、ngrok 等隧道工具，把本机 `http://localhost:3000` 暴露成临时公网 HTTPS 链接。

注意：

- 电脑、项目和数据库必须保持运行。
- 隧道访问的数据仍写入本机数据库。
- 临时公网链接不要随意公开。

## 核心 API

### 账号与设置

- `POST /api/auth/register`
- `GET/PUT /api/settings/ai-config`
- `GET/PUT /api/settings/dream-preferences`
- `DELETE /api/account`

### 梦境

- `POST/GET /api/dreams`
- `GET/PATCH/DELETE /api/dreams/:id`
- `GET /api/dreams/export`

### AI 与任务

- `POST /api/dreams/:id/transcribe`
- `POST /api/dreams/:id/analyze`
- `POST /api/dreams/:id/story`
- `POST /api/dreams/:id/image`
- `POST /api/dreams/:id/share`
- `GET /api/jobs/:id`

AI、审核、生成类接口会返回异步任务：

```json
{
  "jobId": "ckxxxx",
  "status": "queued"
}
```

### 社区与洞察

- `GET /api/insights/summary`
- `GET /api/community/dreams`
- `POST /api/community/universe`

## 文档

- `docs/项目说明文档.md`：面向提交和答辩的项目说明、评分点映射与演示脚本。
- `docs/功能与视觉系统文档.md`：页面、功能流程、视觉系统与响应式说明。
- `docs/AI-API-说明文档.md`：AI 配置、任务队列、Provider、接口与限制说明。

## 配图建议

后续完善提交材料时，建议补充以下截图或图片：

- `【图片占位】` 首页 / 梦境总览截图。
- `【图片占位】` 新建梦境页面，重点展示富文本编辑和语音听写。
- `【图片占位】` 梦境详情页，重点展示 AI 解析、故事和图片生成结果。
- `【图片占位】` 时间轴筛选截图。
- `【图片占位】` 元素图谱截图。
- `【图片占位】` 洞察报告截图。
- `【图片占位】` 共享梦境社区与梦境宇宙截图。
- `【图片占位】` 设置页 AI 配置与主题规则截图。

## 已验证

- `npx prisma generate`
- `npm run build`

## 后续可扩展

- 接入真实服务端 ASR，让录音文件也能在后台转写。
- 为 AI 任务增加配额、限流与监控。
- 增加更多 AI Provider 适配层。
- 为共享审核加入人工复核后台或二次模型判定。
