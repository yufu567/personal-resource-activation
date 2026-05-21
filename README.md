# 个人资源激活系统 · Personal Resource Activation

把囤积的数字资源（GitHub Stars、X 书签、链接、文件、云盘）转化为站内可执行的行动目标和任务闭环。

**收集 → 分析 → 激活 → 复盘**

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 语言 | TypeScript 5.9 (strict) |
| UI | Tailwind CSS 3 + shadcn/ui (New York style) |
| 数据库 | PostgreSQL 17 + Drizzle ORM |
| 缓存 | Redis 7 |
| 验证 | Zod 4 |
| AI | OpenAI / Anthropic / 自定义兼容接口 |
| 测试 | Vitest |
| 容器化 | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，至少填入：
#   AI_PROVIDER=mock    # mock | openai | anthropic
#   DATABASE_URL=...    # 本地开发可留空（默认用内存存储）
#   AUTH_SECRET=...     # 随机字符串

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器
open http://localhost:3000
```

演示账号：`demo@example.com` / `demo123`

## Docker 部署

```bash
# 1. 配置 .env
cp .env.example .env
# 编辑 .env，填入真实的 DATABASE_URL、AUTH_SECRET 等

# 2. 启动
docker compose up -d --build

# 3. 健康检查
curl http://localhost:3000/api/health
```

## 项目结构

```
src/
├── ai/                  # AI 引擎
│   ├── spec/            # AI 规范体系（20 个文件）
│   │   ├── constitution.md      # AI 行为宪法
│   │   ├── domains/             # 7 领域知识
│   │   ├── workflows/           # 5 工作流规范
│   │   └── memory/              # 激活模式记忆
│   ├── openai-provider.ts       # OpenAI 兼容
│   ├── anthropic-provider.ts    # Anthropic Claude
│   ├── mock-provider.ts         # 关键词匹配（开发用）
│   ├── factory.ts               # Provider 工厂
│   ├── pipeline.ts              # 5 步激活流水线
│   └── spec-loader.ts           # Spec 加载引擎
├── app/                 # Next.js App Router
│   ├── (product)/       # 产品页面（需登录）
│   ├── (auth)/          # 登录/注册
│   └── api/             # API 路由
├── auth/                # 认证系统
├── components/          # React 组件
│   └── ui/              # shadcn/ui 组件
├── connectors/          # 外部数据连接器
├── core/                # 领域逻辑
├── db/                  # Drizzle ORM
├── i18n/                # 国际化
├── lib/                 # 工具函数
└── server/              # 服务编排层
```

## AI 架构

### Spec 体系
AI 的行为由 `src/ai/spec/` 下的文件定义，而非硬编码 prompt：
- **constitution.md** — 核心原则和安全边界（不可变）
- **domains/** — 7 个领域的分析视角和激活模式
- **workflows/** — 5 步流水线规范（Intake → Evaluate → Plan → Research → Reflect）
- **memory/patterns.md** — AI 从用户行为中学习到的模式（可迭代）

### 用户自定义 AI
在设置页面（`/settings`）配置：
1. 选择 Provider（OpenAI / Anthropic / Mock）
2. 填入 API Key
3. 可选：自定义 Base URL（支持 DeepSeek、Groq 等兼容接口）
4. 可选：自定义 Model

配置保存在服务端，立即生效。

## 命令

```bash
npm run dev          # 开发服务器 (Turbopack)
npm run build        # 生产构建
npm run start        # 生产启动
npm run test         # 运行测试
npm run test:watch   # 测试监听
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint
npm run format       # Prettier 格式化
npm run db:generate  # 生成 Drizzle migration
npm run db:migrate   # 执行 Drizzle migration
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `APP_URL` | 应用 URL | `http://localhost:3000` |
| `AI_PROVIDER` | AI 提供商 | `mock` |
| `STORE` | 数据存储 | `memory` |
| `DATABASE_URL` | PostgreSQL 连接 | - |
| `REDIS_URL` | Redis 连接 | - |
| `AUTH_SECRET` | 会话加密密钥 | - |
| `TOKEN_ENCRYPTION_KEY` | Token 加密密钥 | - |

## 许可证

MIT
