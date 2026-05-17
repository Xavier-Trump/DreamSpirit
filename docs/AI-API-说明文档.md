# DreamSpirit AI API 说明文档

本文档说明 DreamSpirit 当前版本的 AI 接入方式、配置优先级、任务队列、Provider 能力和相关 API。当前实现已经从旧版“前端直连大模型 API”升级为**服务端统一调用 AI**。

## 接入原则

- 浏览器端不保存、不暴露真实 API Key。
- 前端触发 AI 动作后，只接收 `jobId` 和任务状态。
- 所有 AI 请求由服务端创建 `Job`，再由 Worker 执行。
- 用户可在设置页保存自己的 AI 配置。
- 设置页配置优先于 `.env.local` 环境变量。
- Provider 实现集中在 `lib/ai/provider.ts`，方便后续替换供应商。

## 配置来源与优先级

### 1. 用户级配置

位置：`/settings`

保存字段：

- Provider
- API Key
- 聊天 / 解析模型
- 图片模型
- 聊天 Endpoint
- 图片 Endpoint

数据库模型：`UserAiConfig`

说明：

- API Key 不会在页面明文回显。
- 留空提交 API Key 时，会保留已有 Key。
- 每个用户可以拥有独立配置。

### 2. 环境变量兜底

位置：`.env.local`

```env
AI_PROVIDER="doubao"
DOUBAO_API_KEY=""
DOUBAO_CHAT_MODEL="ep-20260130043458-8fvmf"
DOUBAO_IMAGE_MODEL="doubao-seedream-4-5-251128"
DOUBAO_ENDPOINT="https://ark.cn-beijing.volces.com/api/v3/chat/completions"
DOUBAO_IMAGE_ENDPOINT="https://ark.cn-beijing.volces.com/api/v3/images/generations"
```

不要把真实 Key 提交到仓库，也不要在 README、前端页面或截图中展示真实 Key。

## 任务队列架构

### 核心数据模型

- `Job`：异步任务。
- `DreamAnalysis`：AI 解析结果。
- `DreamStory`：单条梦境故事。
- `DreamAsset`：生成图片或音频等素材。
- `DreamElement`：AI 提取的人物、地点、物品、动作。
- `SharedDream`：匿名公开梦境。
- `ModerationReview`：共享审核记录。
- `UniverseStory`：公共梦境宇宙故事。

### 任务状态

```text
QUEUED -> RUNNING -> SUCCEEDED
                   -> FAILED
```

失败重试：

- 默认最多尝试 3 次。
- 失败后会重新排队，并按尝试次数延迟执行。
- 超过最大次数后标记为 `FAILED`。

### Worker

入口：`worker/run-jobs.ts`

运行命令：

```bash
npm run worker
```

处理逻辑：

1. 查询可运行的 `QUEUED` 任务。
2. 标记为 `RUNNING`。
3. 调用 `processJob` 执行实际任务。
4. 成功则写入输出并标记 `SUCCEEDED`。
5. 失败则记录错误并按规则重试或标记 `FAILED`。

## AI 任务类型

| JobType | 触发入口 | Provider 方法 | 输出位置 |
| --- | --- | --- | --- |
| `ANALYZE_DREAM` | `POST /api/dreams/:id/analyze` | `analyzeDream` + `extractElements` | `DreamAnalysis`、`DreamElement` |
| `GENERATE_STORY` | `POST /api/dreams/:id/story` | `generateStory` | `DreamStory` |
| `GENERATE_IMAGE` | `POST /api/dreams/:id/image` | `generateImage` | `DreamAsset` |
| `MODERATE_SHARE` | `POST /api/dreams/:id/share` | 本地规则审核 | `SharedDream`、`ModerationReview` |
| `GENERATE_UNIVERSE` | `POST /api/community/universe` | `generateUniverseStory` | `UniverseStory` |
| `TRANSCRIBE` | `POST /api/dreams/:id/transcribe` | 当前为占位实现 | 更新梦境正文 |

说明：当前可用的语音体验主要是浏览器实时听写，服务端录音转写仍是占位提示，后续可以接入真实 ASR 服务。

## Provider 能力

位置：`lib/ai/provider.ts`

### 1. 梦境解析

方法：`aiProvider.analyzeDream`

输入：

- 用户 ID
- 标题
- 正文
- 情绪标签
- 清晰度

输出 JSON：

```json
{
  "symbolism": "象征解读",
  "emotionAnalysis": "情绪分析",
  "stressFactors": ["压力源"],
  "themes": ["主题"],
  "patternSignals": ["模式信号"]
}
```

写入：`DreamAnalysis`

### 2. 元素提取

方法：`aiProvider.extractElements`

输出 JSON：

```json
{
  "characters": ["人物"],
  "locations": ["地点"],
  "objects": ["物品"],
  "actions": ["动作"]
}
```

写入：`DreamElement`

用途：

- 元素图谱节点
- 元素出现频率
- 同一梦境内元素共现关系

### 3. 创意故事生成

方法：`aiProvider.generateStory`

输出：

- 300-500 字短篇故事或诗性散文。

写入：`DreamStory`

### 4. 梦境图片生成

方法：`aiProvider.generateImage`

请求参数：

- 图片模型
- prompt
- `response_format: "url"`
- `size: "1024x1024"`
- `watermark: true`

输出：

- 图片 URL，或 base64 回退。

写入：`DreamAsset`

如果供应商返回 base64，系统会保存到本地公开目录并生成 `/uploads/...` URL。

### 5. 共享梦境宇宙

方法：`aiProvider.generateUniverseStory`

输入：

- 3-5 条审核通过的共享梦境
- 标题
- 公开正文
- 情绪标签

输出：

- 1800-2500 字连贯公共梦境故事。

写入：`UniverseStory`

## 本地共享审核

共享审核当前优先采用本地规则，位置：`lib/share-moderation.ts`。

### 自动脱敏

会隐藏：

- 邮箱
- 中国大陆手机号
- 身份证号
- 链接
- QQ
- 微信号
- 长数字账号或证件号

### 拒绝规则

会拒绝明显涉及以下内容的共享：

- 违法色情内容
- 严重性暴力内容
- 违法交易
- 侵犯他人隐私
- 危险违法内容
- 暴力危害内容
- 内容过短或不可读
- 大量重复字符或无效标点

### 复核规则

会标记待复核或风险说明：

- 自伤或危机表达
- 暴力或伤害表达
- 毒品相关表达
- 敏感个人信息表达
- 成人或性相关表达
- 营销或引流内容
- 联系方式意图

### 审核结果

审核会返回：

```json
{
  "approved": true,
  "decision": "APPROVED",
  "sharedStatus": "APPROVED",
  "title": "脱敏后的标题",
  "content": "脱敏后的内容",
  "excerpt": "摘要",
  "riskFlags": [],
  "notes": "审核说明"
}
```

结果写入：

- `SharedDream`
- `ModerationReview`

只有 `APPROVED` 的共享梦境会进入 `/community` 公开池。

## 前端调用链路

### 梦境解析

```text
详情页点击“解析梦境”
  -> POST /api/dreams/:id/analyze
  -> 服务端创建 Job
  -> 前端轮询 GET /api/jobs/:id
  -> Worker 调用 analyzeDream 和 extractElements
  -> 写入 DreamAnalysis 和 DreamElement
  -> 任务成功后刷新详情页
```

### 故事生成

```text
详情页点击“生成故事”
  -> POST /api/dreams/:id/story
  -> 创建 GENERATE_STORY Job
  -> Worker 调用 generateStory
  -> 写入 DreamStory
  -> 前端刷新详情页
```

### 图片生成

```text
详情页点击“生成图片”
  -> POST /api/dreams/:id/image
  -> 创建 GENERATE_IMAGE Job
  -> Worker 调用 generateImage
  -> 写入 DreamAsset
  -> 前端刷新详情页显示图片
```

### 匿名共享

```text
详情页点击“提交匿名共享”
  -> POST /api/dreams/:id/share
  -> 创建 MODERATE_SHARE Job
  -> Worker 执行本地审核与脱敏
  -> 写入 SharedDream 和 ModerationReview
  -> 审核通过后进入共享池
```

### 梦境宇宙

```text
社区页选择 3-5 条公开梦境
  -> POST /api/community/universe
  -> 创建 GENERATE_UNIVERSE Job
  -> Worker 调用 generateUniverseStory
  -> 写入 UniverseStory
  -> 社区页显示最近生成故事
```

## API 汇总

### AI 配置

- `GET /api/settings/ai-config`
- `PUT /api/settings/ai-config`

### 梦境任务

- `POST /api/dreams/:id/analyze`
- `POST /api/dreams/:id/story`
- `POST /api/dreams/:id/image`
- `POST /api/dreams/:id/share`
- `POST /api/dreams/:id/transcribe`

任务创建成功返回：

```json
{
  "jobId": "ckxxxx",
  "status": "queued"
}
```

### 任务查询

- `GET /api/jobs/:id`

返回状态：

```json
{
  "id": "ckxxxx",
  "type": "ANALYZE_DREAM",
  "status": "succeeded",
  "output": {}
}
```

### 洞察与社区

- `GET /api/insights/summary`
- `GET /api/community/dreams`
- `POST /api/community/universe`

## 前端降级策略

### 未配置 AI Key

可继续使用：

- 注册 / 登录
- 记录和编辑梦境
- 浏览器语音听写
- 时间轴筛选
- Markdown 导出
- 打印 PDF
- 共享本地规则审核

不可用：

- AI 解析
- 创意故事生成
- 梦境图片生成
- 公共梦境宇宙生成

页面会显示配置提示并引导到 `/settings`。

### Worker 未启动

前端可以创建任务，但任务会停留在 `queued`。需要启动：

```bash
npm run worker
```

### 服务端录音转写

`TRANSCRIBE` 当前是占位实现，会提示使用实时语音听写。真实 ASR 可以在 `handleTranscribe` 中接入。

## 后续扩展建议

- 增加多 Provider 适配层，例如 OpenAI、通义、智谱等。
- 为 AI 任务加入用户配额、限流和成本统计。
- 将审核策略扩展为“本地规则 + 模型复核 + 人工复核”。
- 接入真实服务端 ASR。
- 为 Worker 增加监控面板和失败任务重试入口。

## 文档版本

- 当前文档版本：v2.0
- 对应实现：Next.js 全栈版
- 最后更新：2026-05-17
