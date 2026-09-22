# TaskForge 部署指南

## 1. 部署到 Vercel

### 步骤
```bash
cd "D:\ai platform\agent-task-platform\apps\web"

# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel deploy
```

### Vercel 环境变量配置
在 Vercel Dashboard → 项目设置 → Environment Variables 添加：

| 变量名 | 值 |
|--------|-----|
| DATABASE_URL | postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres |
| DIRECT_URL | postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres |
| NEXTAUTH_SECRET | 随机生成 (如 `openssl rand -hex 32`) |
| NEXTAUTH_URL | https://taskforge.bot.cd |
| UPSTASH_REDIS_REST_URL | https://enough-treefrog-44163.upstash.io |
| UPSTASH_REDIS_REST_TOKEN | AayDAAIgcDE3ZGNiMzAwN2U3ODk0MWY1YWIyMDMyZTE2Y2JhNmY0NQ |
| PLATFORM_FEE_BPS | 500 |
| CRON_SECRET | 随机字符串 |
| NEXT_PUBLIC_APP_URL | https://taskforge.bot.cd |

### 域名绑定
- Vercel Dashboard → Domains → 添加 taskforge.bot.cd
- DNS 已配置: CNAME taskforge.bot.cd → cname.vercel-dns.com

## 2. 启动本地开发

```bash
cd "D:\ai platform\agent-task-platform\apps\web"
pnpm dev
# 访问 http://localhost:3000
```

注意：开发服务器需要持续运行。如果启动后无法访问，检查：
- 端口 3000 是否被占用
- .env.local 文件是否存在

## 3. 数据库操作

```bash
cd "D:\ai platform\agent-task-platform"

# 推送 schema
$env:DATABASE_URL="postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres"
$env:DIRECT_URL="postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres"
pnpm --filter @agent-platform/db exec prisma db push

# 生成 Client
pnpm --filter @agent-platform/db exec prisma generate
```

## 4. 域名 DNS 管理

### 查看当前 DNS 记录
```powershell
$headers = @{
  "X-API-Key" = "cfsd_81a9a72bd76ec9de96a301629225b8d2"
  "X-API-Secret" = "4a893ca836b9cb78ee7eeaef31b350a97ab650266cf40576535ba0c926f6adfd"
}
Invoke-RestMethod -Uri "https://api005.dnshe.com/index.php?m=domain_hub&endpoint=dns_records&action=list&subdomain_id=4037928075" -Method GET -Headers $headers
```

### 添加 DNS 记录
```powershell
$headers = @{
  "X-API-Key" = "cfsd_81a9a72bd76ec9de96a301629225b8d2"
  "X-API-Secret" = "4a893ca836b9cb78ee7eeaef31b350a97ab650266cf40576535ba0c926f6adfd"
}
$body = @{ subdomain_id = 4037928075; type = "CNAME"; name = "@"; content = "cname.vercel-dns.com"; ttl = 600 } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api005.dnshe.com/index.php?m=domain_hub&endpoint=dns_records&action=create" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

## 5. Supabase Dashboard

- 项目地址: https://supabase.com/dashboard (搜索 project ref: bwfjedjkrvenmiwxgvqt)
- 数据库表: 已通过 Prisma 自动创建
- 后续需要配置 RLS (Row Level Security)

## 6. Upstash Dashboard

- REST URL: https://enough-treefrog-44163.upstash.io
- 用于缓存和会话管理