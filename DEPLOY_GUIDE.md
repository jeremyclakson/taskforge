# TaskForge 部署指南

## 1. 部署到 Zeabur

### GitHub 仓库
- 地址：https://github.com/jeremyclakson/taskforge
- 状态：已推送 ✅

### Zeabur 部署步骤
1. 登录 https://zeabur.com
2. 点击 **New Project** → **Deploy from GitHub**
3. 选择 `taskforge` 仓库
4. 关键设置：
   - **Root Directory**：`apps/web`
   - **Build Command**：`pnpm install && pnpm --filter @agent-platform/web build`
   - **Start Command**：`pnpm --filter @agent-platform/web start`
5. 配置环境变量（见下表）
6. 点击 **Deploy**

### 环境变量配置

| 变量名 | 值 |
|--------|-----|
| DATABASE_URL | postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres |
| DIRECT_URL | postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres |
| NEXTAUTH_SECRET | taskforge-secret-2026-production |
| NEXTAUTH_URL | https://taskforge.bot.cd |
| UPSTASH_REDIS_REST_URL | https://enough-treefrog-44163.upstash.io |
| UPSTASH_REDIS_REST_TOKEN | AayDAAIgcDE3ZGNiMzAwN2U3ODk0MWY1YWIyMDMyZTE2Y2JhNmY0NQ |
| PLATFORM_FEE_BPS | 500 |
| CRON_SECRET | taskforge-cron-2026 |
| NEXT_PUBLIC_APP_URL | https://taskforge.bot.cd |

### 域名绑定
- Zeabur 项目设置 → Domain → 添加 `taskforge.bot.cd`
- DNS 已配置：CNAME taskforge.bot.cd → cname.vercel-dns.com

## 2. 启动本地开发

```bash
cd "D:\ai platform\agent-task-platform\apps\web"
pnpm dev
# 访问 http://localhost:3000
```

## 3. 数据库操作

```bash
cd "D:\ai platform\agent-task-platform"

# 推送 schema
$env:DATABASE_URL="postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres"
$env:DIRECT_URL="postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres"
pnpm --filter @agent-platform/db exec prisma db push
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

## 5. 更新代码到 GitHub

```bash
cd "D:\ai platform\agent-task-platform"
git add -A
git commit -m "描述变更"
git push
```

## 6. 关键凭据汇总

| 服务 | 凭据 |
|------|------|
| Supabase | postgresql://postgres:569u1saIhWkEu62t@db.bwfjedjkrvenmiwxgvqt.supabase.co:5432/postgres |
| Upstash | https://enough-treefrog-44163.upstash.io / AayDAAIgcDE3ZGNiMzAwN2U3ODk0MWY1YWIyMDMyZTE2Y2JhNmY0NQ |
| DNSHE | cfsd_81a9a72bd76ec9de96a301629225b8d2 / 4a893ca836b9cb78ee7eeaef31b350a97ab650266cf40576535ba0c926f6adfd |
| GitHub | jeremyclakson/taskforge |
| 域名 | taskforge.bot.cd |