# CLAUDE.md

## 项目背景

**个人资源激活系统 (Personal Resource Activation)** — 帮用户把囤积的数字资源（GitHub Stars、X 书签、链接、文件、云盘）转化为站内可执行的行动目标和任务闭环。

当前处于 **快速产品验证 (MVP)** 阶段，面向中国用户。

## 技术栈

Next.js 16 (Turbopack) + TypeScript 5.9 + Tailwind CSS 3 + shadcn/ui + PostgreSQL 17 + Drizzle ORM + Redis 7 + Zod 4 + Vitest

## 命令

```bash
npm run dev          # 开发服务器 (Turbopack)
npm run build        # 生产构建
npm run test         # 运行测试 (vitest run)
npm run typecheck    # TypeScript 类型检查 (tsc --noEmit)

# 测试运行需要指定 node 路径 (Windows 环境)：
F:/node/node F:/x/node_modules/typescript/bin/tsc --noEmit
F:/node/node F:/x/node_modules/vitest/vitest.mjs run
```

## 项目结构

```
src/
├── ai/spec/           # AI 规范体系 (20 个 markdown 文件)
│   ├── constitution.md
│   ├── domains/       # 7 领域知识
│   ├── workflows/     # 5 工作流规范
│   └── memory/patterns.md
├── ai/                # AI Provider (openai/anthropic/mock)
├── app/(product)/     # 产品页面 (resources/goals/reviews/connectors/settings)
├── app/(auth)/        # 登录/注册页面
├── app/api/           # API 路由
├── auth/              # 认证系统 (bcrypt + JWT httpOnly cookies)
├── components/ui/     # shadcn/ui 组件
├── connectors/        # 外部数据源 (GitHub Star API 已对接)
├── core/              # 领域逻辑
├── db/                # Drizzle ORM schema + PostgresResourceStore
├── i18n/              # 中英国际化
└── server/            # 服务编排层
```

## 架构约定

- **Ports & Adapters**: PostgresResourceStore + InMemoryResourceStore 都实现相同接口，STORE 环境变量切换
- **AI 约束**: AI 行为由 `src/ai/spec/` 下的 markdown 文件定义，非代码硬编码，可编辑可迭代
- **Pipeline**: 5 步激活流水线 Intake → Evaluate → Plan → Research → Reflect
- **权限边界**: permissionScope 始终为 "internal"

## 环境变量

- `STORE=memory|postgres` — 数据存储后端
- `AI_PROVIDER=mock|openai|anthropic` — AI 提供商
- `DATABASE_URL` — PostgreSQL 连接（docker compose 提供）
- `AUTH_SECRET` — 会话加密密钥

## 当前进度

```
✅ 阶段 0:  前端现代化
✅ 阶段 1:  PostgreSQL 持久化 + 清理
✅ 阶段 2:  AI 核心 (Spec + Pipeline + 用户自定义 API)
✅ 阶段 3:  认证系统 + GitHub Stars Connector
⬜ 待推送: 代码已 commit，SSH key 已生成，等推送到 GitHub
⬜ 待验证: Docker Compose 部署
```

## 下次继续事项

1. 推送代码到 GitHub (SSH key 已配置)
2. 部署并验证 Docker Compose
3. 后续可做的: 错误监控(Sentry)、日志系统、备份策略、E2E 测试
