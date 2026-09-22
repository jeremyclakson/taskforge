# TaskForge - 项目关键信息

## 项目概览
- 名称：TaskForge
- 域名：taskforge.bot.cd
- 定位：AI Agent & Human 双轨任务市场，加密货币支付
- 技术栈：Next.js 16 + TypeScript + Tailwind + Prisma + Supabase + Upstash + Vercel

## 目录结构
```
D:\ai platform\agent-task-platform\
├── apps/web/              # Next.js 前端 + API
├── packages/shared/       # 共享类型和 Zod Schema
├── packages/db/           # Prisma 数据库 schema
├── packages/contracts/    # Solidity 智能合约 (Escrow + Token)
├── .github/workflows/     # CI/CD
├── pnpm-workspace.yaml
└── package.json
```

## 关键凭据

### 域名管理 (DNSHE)
- API Key: cfsd_81a9a72bd76ec9de96a301629225b8d2
- API Secret: 4a893ca836b9cb78ee7eeaef31b350a97ab650266cf40576535ba0c926f6adfd
- API Endpoint: https://api005.dnshe.com/index.php?m=domain_hub
- 子域名 ID: 4037928075
- DNS 记录 ID: 474733246420600
- DNS 记录: CNAME taskforge.bot.cd → cname.vercel-dns.com (Active)

### Supabase 数据库
- Host: db.bwfjedjkrvenmiwxgvqt.supabase.co
- Port: 5432
- Database: postgres
- User: postgres
- Password: 569u1saIhWkEu62t
- DATABASE_URL: postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres
- 状态: Schema 已推送成功

### Upstash Redis
- REST URL: https://enough-treefrog-44163.upstash.io
- REST Token: AayDAAIgcDE3ZGNiMzAwN2U3ODk0MWY1YWIyMDMyZTE2Y2JhNmY0NQ
- 状态: 已配置

### 环境变量 (.env.local 已配置)
- NEXTAUTH_SECRET: taskforge-secret-key-2026-please-change-in-production
- NEXTAUTH_URL: http://localhost:3000
- PLATFORM_FEE_BPS: 500 (5%)
- CRON_SECRET: taskforge-cron-secret-2026
- NEXT_PUBLIC_APP_URL: https://taskforge.bot.cd

## 已完成的开发内容

### 1. 核心基础设施
- Monorepo (pnpm + turbo)
- Next.js 16 + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Supabase) - Schema 已推送
- Upstash Redis 集成
- 构建成功，20 个路由编译通过

### 2. 用户系统
- NextAuth.js 认证 (Email + Web3 钱包)
- 多身份: INDIVIDUAL / COMPANY / AGENT_OPERATOR
- 双轨: HUMAN / AGENT / BOTH
- 钱包管理 (多链: Base, Arbitrum, Optimism)

### 3. 任务系统
- TaskSpec 协议 (JSON Schema 标准化)
- 任务发布 / 搜索 / 筛选
- 竞标系统 (Bid)
- 验收与结算
- 里程碑 (Milestone)

### 4. 加密支付
- Solidity Escrow 合约 (AgentTaskEscrow.sol)
- Token 合约 (AgentTaskToken.sol)
- 多链: Base / Arbitrum / Optimism
- USDC / USDT 稳定币
- 链上交易跟踪

### 5. 信用体系
- Human 信用分 (完成任务+评价+准时率+作品集+技能认证)
- Agent 信用分 (执行成功率+沙箱通过率+验证通过率+在线率)
- 五级会员: bronze → silver → gold → platinum → diamond
- 信用重算 Cron 服务

### 6. 广告系统
- 5 种广告位: TASK_TOP / HOME_BANNER / AGENT_RECOMMEND / CATEGORY_TOP / SEARCH_AD
- 竞价模型: CPC / CPM / CPA
- 曝光/点击追踪

### 7. API 路由 (20个)
- /api/auth/[...nextauth]
- /api/tasks, /api/tasks/[id], /api/tasks/[id]/bids
- /api/bids/[id]
- /api/escrow, /api/escrow/fund, /api/escrow/resolve
- /api/wallet, /api/wallet/balances
- /api/transactions
- /api/reputation
- /api/ads/slots, /api/ads/auctions, /api/ads/track
- /api/cron/reputation

### 8. 页面路由
- / (首页)
- /auth/signin (登录)
- /tasks (浏览任务)
- /tasks/new (发布任务)
- /tasks/[id] (任务详情+竞标+Escrow)
- /dashboard (用户仪表盘)
- /profile/wallet (钱包管理)
- /advertiser (广告主后台)

## DNSHE API 文档
- 文档地址: https://my.dnshe.com/knowledgebase/13/DNSHE-Free-Domain-API-User-Guide-V2.0.html
- 端点: https://api005.dnshe.com/index.php?m=domain_hub
- DNS 记录管理: endpoint=dns_records
  - 列表: action=list&subdomain_id=4037928075 (GET)
  - 创建: action=create (POST, JSON body)
  - 更新: action=update (POST)
  - 删除: action=delete (POST)

## 待办事项

### 部署到 Vercel
1. 安装 vercel CLI: `npm i -g vercel`
2. 部署: `vercel deploy` (在 apps/web 目录)
3. 在 Vercel Dashboard 配置环境变量
4. 绑定域名 taskforge.bot.cd
5. 部署智能合约 (可选)

### 后续开发
- 本地开发服务器启动问题 (需调查 Start-Process 启动方式)
- 智能合约部署到 Base Sepolia 测试网
- WalletConnect 配置 (需要 Project ID)
- 邮件服务配置 (NextAuth Email 登录需要 SMTP)
- Supabase RLS (Row Level Security) 配置
- 前端支付流程完善
- 技能市场 UI
- Agent SDK 开发

## 启动开发服务器
```bash
cd D:\ai platform\agent-task-platform\apps\web
pnpm dev
# 访问 http://localhost:3000
```

## 常用命令
```bash
cd D:\ai platform\agent-task-platform
pnpm install          # 安装依赖
pnpm dev              # 启动开发
pnpm build            # 构建
pnpm db:push          # 推送数据库 schema
pnpm db:generate      # 生成 Prisma Client
```

## 用户偏好
- 中文交流
- 服务器: Windows, PowerShell
- 支付: 虚拟货币 (多链稳定币)
- 身份: 全品类，真人+Agent 都可以做任务
- 无服务器约束: 使用 Serverless (Vercel + Supabase + Upstash)