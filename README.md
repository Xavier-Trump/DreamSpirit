<h1 align="center">DreamSpirit · 梦灵</h1>

<p align="center">
  <b>AI 梦境记录、深度解析与匿名共享平台</b>
</p>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5.17-2D3748?style=flat-square&logo=prisma&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue?style=flat-square">
</p>

<p align="center">
  <a href="README.en.md">English</a> ·
  <a href="docs/功能与视觉系统文档.md">功能文档</a> ·
  <a href="docs/AI-API-说明文档.md">AI 文档</a> ·
  <a href="docs/项目说明文档.md">项目说明</a>
</p>

---

## 什么是 DreamSpirit

醒来之后梦境消散得很快——DreamSpirit 帮你把零散的记忆片段沉淀下来。用文字或语音快速记录，剩下的交给 AI：解析符号、分析情绪、生成故事与画面，长期累积后在元素图谱和洞察报告中发现自己反复出现的梦境模式。

当前实现已经从一个简单的记录工具成长为 **Next.js 全栈应用**：账号系统、数据库持久化、异步任务队列、用户级 AI 配置、浏览器语音听写、元素关系图谱、主题洞察、匿名共享审核、梦境宇宙故事串联、以及 Markdown 导出和 PDF 打印，全部在一个本地可运行的项目包里。

```bash
git clone https://github.com/Xavier-Trump/DreamSpirit.git && cd DreamSpirit
npm install && docker compose up -d
npx prisma db push && npm run prisma:seed
npm run dev
```

> 浏览器打开 `http://localhost:3000`，体验账号：`dreamer@dreamspirit.local` / `dreamspirit123`

## 功能一览

### 记录

| 功能 | 详情 |
|---|---|
| 富文本编辑 | TipTap 编辑器，支持格式化、列表、段落 |
| 语音听写 | 浏览器 Web Speech API，支持中文普通话、粤语、英文，不依赖后端 AI Key |
| 结构化字段 | 梦境时间、情绪标签（可多选 + 临时自定义）、清晰度 1-5 星、重复梦境标记、现实关联记录 |
| 草稿保护 | 编辑页面每 15 秒自动保存草稿，不怕浏览器崩溃 |

### AI 解析

| 能力 | 说明 |
|---|---|
| 象征解读 | 解读梦境的象征意义和隐含信息 |
| 情绪分析 | 识别梦境中的情绪状态和情绪来源 |
| 压力源识别 | 提取潜在压力因素 |
| 主题标签 | 自动生成主题标签，辅助后续检索和洞察 |
| 模式信号 | 标记重复出现的梦境模式 |
| 元素提取 | 提取人物、地点、物品、动作四类元素，写入图谱数据库 |

### 创意产出

| 类型 | 说明 |
|---|---|
| 故事生成 | 为单条梦境生成 300-500 字短篇故事或诗性散文 |
| 图片生成 | 调用图片模型生成梦境代表画面，支持 base64 本地回落存储 |

### 观察与分析

| 模块 | 说明 |
|---|---|
| 时间轴 | 按日期分组浏览，支持日期范围、情绪、清晰度组合筛选 |
| 元素图谱 | SVG 交互式关系图：节点大小 = 出现频次，连线粗细 = 共现次数，支持悬停、点击、键盘选择 |
| 洞察报告 | 高频主题排行、情绪分布、常见主题对比（用户可自定规则）、压力模式摘要、记录建议 |

### 社区 & 共享

| 功能 | 说明 |
|---|---|
| 匿名共享 | 提交单条梦境进入共享池前，先执行本地规则审核 |
| 隐私脱敏 | 自动隐藏邮箱、手机号、身份证号、链接、QQ/微信号等 |
| 内容审核 | 违法/暴力/隐私泄露/引流等内容拒绝或标记复核 |
| 梦境宇宙 | 从共享池选取 3-5 条公开梦境，AI 生成 1800-2500 字连贯公共故事 |

### 导出 & 设置

| 功能 | 说明 |
|---|---|
| Markdown 导出 | 全量梦境日记下载为 Markdown 文件 |
| 打印 PDF | 专用打印报告页面，浏览器直接保存为 PDF |
| AI 配置 | 用户级独立配置 Provider / Key / 模型 / Endpoint，不暴露在前端 |
| 偏好管理 | 情绪标签和主题规则均可用户自定义增删 |

## 安装与运行

### 前置条件

- **Node.js** ≥ 18
- **Docker Desktop**（推荐）或本地安装 PostgreSQL 17+
- 2 GB 以上空闲磁盘空间（含依赖和种子数据）

### 1. 克隆仓库

```bash
git clone https://github.com/Xavier-Trump/DreamSpirit.git
cd DreamSpirit
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，核心变量如下：

| 变量 | 必须 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串，本地 Docker 无需改动 |
| `AUTH_SECRET` | 是 | 认证加密密钥，本地开发可用示例值 |
| `AUTH_URL` | 是 | 本地运行时填入 `http://localhost:3000` |
| `DOUBAO_API_KEY` | 否 | 可留空，运行后在设置页填写 |
| `DOUBAO_CHAT_MODEL` | 否 | 聊天/解析模型 ID |
| `DOUBAO_IMAGE_MODEL` | 否 | 图片生成模型 ID |
| `DOUBAO_ENDPOINT` | 否 | 聊天接口地址 |
| `DOUBAO_IMAGE_ENDPOINT` | 否 | 图片接口地址 |
| `STORAGE_MODE` | 否 | `local` 本地存储（默认），可选 `s3` |
| `DEMO_MODE` | 否 | `false` 允许正常注册和写入 |

> **优先级：** 用户设置页保存的 AI 配置 > `.env.local` 环境变量。多用户环境下每个人可使用自己的 Key。

### 3. 启动数据库

```bash
docker compose up -d
```

如果不用 Docker，请自行安装 PostgreSQL 并确保 `DATABASE_URL` 指向可用数据库。

### 4. 初始化数据库

```bash
npx prisma db push         # 同步数据库结构
npm run prisma:seed         # 导入体验数据
```

种子数据包含：体验账号、多条梦境记录、AI 解析结果、示例元素、共享梦境和一条梦境宇宙故事。

### 5. 启动服务

```bash
# 终端 1：启动 Web 服务
npm run dev

# 终端 2：启动异步任务 Worker
npm run worker
```

开发模式下 Next.js 支持热更新。生产环境建议先 `npm run build` 再 `npm run start`。

### Windows 一键启动

Windows 用户可以直接双击项目根目录的：

```
start-preview.bat
```

脚本会引导你选择：

- **Quick Start**（日常使用）：复用已有数据库和构建结果，启动最快。
- **Initialize / Repair**（首次运行 / 修复）：同步数据库、导入种子数据、重新构建。
- 本机离线 / 局域网访问 / 隧道模式。

## 项目架构

### 技术栈

| 层 | 技术 |
|---|---|
| 运行时 | Node.js 18+ |
| 前端框架 | Next.js 15 App Router |
| UI 库 | React 19 + TypeScript 5.6 |
| 编辑器 | TipTap 2.x 富文本 |
| 图标 | lucide-react |
| 样式 | CSS 自定义变量，深色玻璃拟态，响应式网格，打印样式 |
| 认证 | Auth.js v5 Credentials + bcryptjs |
| ORM | Prisma 5.17 |
| 数据库 | PostgreSQL |
| 校验 | zod |
| AI 服务 | 统一服务端 Provider，默认兼容豆包（火山方舟）chat / image 接口 |
| 异步任务 | 数据库驱动 Job Queue + Worker 轮询 |
| 文件存储 | 本地文件（默认）/ S3 兼容 |

### 架构总览

```mermaid
graph TB
    subgraph Browser["浏览器"]
        UI["Next.js App Router<br/>React 19 + TypeScript"]
        Voice["Web Speech API<br/>语音听写"]
    end

    subgraph NextJS["Next.js 服务端"]
        API["API Routes<br/>auth / dreams / jobs / insights / community"]
        Lib["Service Layer<br/>dreams / ai-config / insights / community / share-moderation"]
        AI["AI Provider<br/>统一 LLM / Image 适配"]
    end

    subgraph Worker["Worker 进程"]
        Poll["Job Queue Polling"]
        Proc["Job Processors<br/>analyze / story / image / moderate / universe"]
    end

    subgraph Data["持久化层"]
        PG["PostgreSQL<br/>Dream / Analysis / Element / Job / Story"]
        FS["File Storage<br/>本地 / S3"]
    end

    UI --> API
    Voice --> UI
    API --> Lib
    Lib --> AI
    Lib --> PG
    API -->|"创建 Job"| PG
    Poll -->|"拉取 Job"| PG
    Proc --> AI
    Proc --> PG
    Proc --> FS
    UI -->|"轮询 GET /api/jobs/:id"| API
```

### 任务队列流程

```mermaid
sequenceDiagram
    actor U as 用户
    participant FE as 前端页面
    participant API as /api/dreams/:id/analyze
    participant DB as PostgreSQL
    participant W as Worker
    participant AI as AI Provider

    U->>FE: 点击「解析梦境」
    FE->>API: POST /api/dreams/:id/analyze
    API->>DB: INSERT Job (status=QUEUED)
    API-->>FE: { jobId, status: "queued" }

    loop 轮询
        FE->>API: GET /api/jobs/:id
        API->>DB: SELECT Job status
        API-->>FE: { status: "queued" | "running" }
    end

    W->>DB: SELECT QUEUED jobs
    W->>DB: UPDATE Job (status=RUNNING)
    W->>AI: chat/completions
    AI-->>W: 象征解读 / 情绪 / 元素
    W->>DB: INSERT DreamAnalysis + DreamElement
    W->>DB: UPDATE Job (status=SUCCEEDED)

    FE->>API: GET /api/jobs/:id
    API->>DB: SELECT Job
    API-->>FE: { status: "succeeded", output }
    FE-->>U: 刷新展示解析结果
```

### 页面信息架构

```mermaid
graph LR
    Start["/ 入口"] -->|"已登录"| App["/app 总览"]
    Start -->|"未登录"| SignIn["/sign-in 登录"]
    SignIn --> SignUp["/sign-up 注册"]

    App --> New["/dreams/new<br/>新建梦境"]
    App --> Detail["/dreams/[id]<br/>详情 / 编辑 / AI 动作"]
    App --> Timeline["/timeline<br/>时间轴筛选"]
    App --> Elements["/elements<br/>元素图谱"]
    App --> Insights["/insights<br/>洞察报告"]
    App --> Community["/community<br/>共享社区"]
    App --> Settings["/settings<br/>设置中心"]
    Detail --> Print["/exports/print<br/>打印报告"]
```

### 架构原则

1. **前端不直连大模型。** 浏览器只请求本项目 API，不解密也不保存真实 API Key。
2. **AI 调用走服务端任务队列。** 解析、故事、图片、共享审核、宇宙故事全部以 `Job` 入队，Worker 异步执行并持久化结果。
3. **数据完全持久化。** 梦境、解析、故事、图片、元素、共享状态、审核记录和任务状态都保存在 PostgreSQL 中。
4. **用户级 AI 配置。** 每个用户可以在设置页保存自己的 AI API Key 和模型配置，环境变量作为全局兜底。
5. **本地优先。** 默认在本机运行，数据存放在本机数据库，不依赖任何云服务。

### 目录结构

```text
app/              App Router 页面与 API 路由
│  api/           REST API 端点（auth, dreams, jobs, insights, community, settings）
│  sign-in/       登录页
│  sign-up/       注册页
│  start/         入口页
components/       UI 组件（表单、图谱、语音听写、共享审核等）
│  auth/          认证相关组件
docs/             项目文档
lib/              服务层
│  ai/            AI Provider 实现
│  jobs/          任务处理器
│  ai-config.ts   AI 配置读写
│  auth.ts        认证配置
│  community.ts   社区与共享
│  dreams.ts      梦境 CRUD
│  insights.ts    洞察聚合
│  prisma.ts      Prisma 客户端
│  share-moderation.ts  共享审核与脱敏
│  storage.ts     文件存储
│  utils.ts       工具函数
prisma/           Prisma Schema 与 Seed 数据
public/           静态资源与品牌素材
types/            TypeScript 类型扩展
worker/           后台任务处理入口
```

### API 总览

#### 账号

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/auth/register` | 注册新账号 |
| `DELETE` | `/api/account` | 注销账号 |
| `GET` / `PUT` | `/api/settings/ai-config` | AI 配置读写 |
| `GET` / `PUT` | `/api/settings/dream-preferences` | 情绪标签与主题规则 |

#### 梦境

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` / `GET` | `/api/dreams` | 创建 / 列表 |
| `GET` / `PATCH` / `DELETE` | `/api/dreams/:id` | 详情 / 更新 / 删除 |
| `GET` | `/api/dreams/export` | 全量 Markdown 导出 |

#### AI 任务（均返回 `{ jobId, status }`）

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/dreams/:id/analyze` | 解析梦境 |
| `POST` | `/api/dreams/:id/story` | 生成故事 |
| `POST` | `/api/dreams/:id/image` | 生成图片 |
| `POST` | `/api/dreams/:id/share` | 提交匿名共享 |
| `POST` | `/api/dreams/:id/transcribe` | 转写（当前占位） |
| `GET` | `/api/jobs/:id` | 查询任务状态 |

#### 洞察 & 社区

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/insights/summary` | 洞察报告数据 |
| `GET` | `/api/community/dreams` | 公开共享池 |
| `POST` | `/api/community/universe` | 生成梦境宇宙 |

### API 总览

| 类型 | 输入 | 输出 |
|---|---|---|
| `ANALYZE_DREAM` | 梦境标题、正文、情绪、清晰度 | 象征解读、情绪分析、压力源、主题、元素 |
| `GENERATE_STORY` | 梦境全文 | 300-500 字短篇故事 |
| `GENERATE_IMAGE` | AI prompt | 图片 URL 或 base64 |
| `MODERATE_SHARE` | 梦境原文 | 脱敏文本 + 审核结果 |
| `GENERATE_UNIVERSE` | 3-5 条公开梦境 | 1800-2500 字公共故事 |
| `TRANSCRIBE` | 音频 | 当前为占位实现 |

任务失败默认重试 3 次，超限后标记 `FAILED`。

## 使用模式

| 模式 | 访问方式 | 适用场景 |
|---|---|---|
| **本机离线** | `http://localhost:3000` | 日常使用，数据仅在本机，无需网络 |
| **局域网** | `http://<你的局域网IP>:3000` | 同一 Wi-Fi 下其他设备访问 |
| **隧道** | 通过 Cloudflare Tunnel / ngrok 等工具 | 临时远程访问 |

> 局域网模式下如无法访问，需在 Windows 防火墙中放行 Node.js 或端口 `3000`。

## 视觉系统

DreamSpirit 采用**深色梦境工作台**风格：

- 深蓝黑背景（`#08141d`）营造夜色和梦境氛围。
- 橙色主强调（`#ff8c42`）用于主要按钮和关键行动。
- 青色辅助强调（`#6dd3ce`）用于链接、图谱和导航。
- 半透明深色表面、18px 模糊、柔和边框、大圆角。
- 移动端自动切换单列布局，打印页有独立样式。

详见 [功能与视觉系统文档](docs/功能与视觉系统文档.md)。

## 文档

| 文档 | 内容 |
|---|---|
| [项目说明文档](docs/项目说明文档.md) | 项目概述、评分点映射、数据流、创新点、演示建议 |
| [功能与视觉系统文档](docs/功能与视觉系统文档.md) | 页面结构、功能流程、交互状态、色彩与布局系统 |
| [AI API 说明文档](docs/AI-API-说明文档.md) | Provider 配置、任务队列、审核机制、API 汇总 |

## 参与贡献

```bash
git clone https://github.com/Xavier-Trump/DreamSpirit.git
cd DreamSpirit
npm install
npm run dev
```

欢迎提交 Issue 和 Pull Request。

## 开源许可

[MIT](LICENSE)

---

DreamSpirit 是独立的第三方开源项目，与任何商业 AI 服务商无关。仅供个人学习、研究和自我探索使用。使用 AI 功能时，请遵守相应服务商的 API 使用条款。
