# Thotsakan Mail Engine - 完整技术使用手册 (中文)

## 1. 系统简介
**Thotsakan Mail Engine** 是专为高并发生产环境设计的超轻量级邮件微服务调度引擎，采用 Bun + Hono + SQLite WAL 架构。它支持 14 家主流邮件服务商（AWS SES、Microsoft 365/Graph、Gmail、Resend、Postmark、SendGrid、Brevo、Mailgun 等），内置优先级调度队列、自动故障转移（Smart Failover）、Sentbox 自动清理及在线零停机备份功能。整机运行内存占用低于 40 MB RAM。

---

## 2. 3分钟快速接入 AWS SES
1. **在 AWS 创建 IAM 用户：**
   - 登录 AWS 控制台，新建用户并分配最小权限：
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": ["ses:SendRawEmail", "ses:SendEmail"],
           "Resource": "*"
         }
       ]
     }
     ```
   - 获取 `Access Key ID` 和 `Secret Access Key`。
2. **在 Thotsakan 中注册发信账户：**
   ```bash
   curl -X POST http://localhost:3000/v1/accounts \
     -H "Content-Type: application/json" \
     -H "X-API-Key: 您的API密钥" \
     -d '{
       "name": "AWS SES 生产集群",
       "providerType": "aws-ses",
       "fromEmail": "service@company.com",
       "credentials": {
         "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
         "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
         "region": "ap-east-1"
       }
     }'
   ```
3. **一键验证 DNS 记录：**
   - 访问网页控制台 `http://localhost:3000/console`
   - 进入 **"One-Click DNS Verify"** 页面，一键检测并复制 DKIM/SPF 记录至域名托管商。

---

## 3. 核心 API 示例

### 3.1 异步极速入队模式 (< 5ms 响应)
```bash
curl -X POST http://localhost:3000/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "to": "user@example.com",
    "subject": "欢迎注册系统",
    "html": "<h1>您好！</h1><p>感谢使用我们的产品。</p>",
    "priority": "normal",
    "async": true
  }'
```

### 3.2 同步验证码直发模式 (OTP 抢占队列)
```bash
curl -X POST http://localhost:3000/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "to": "user@example.com",
    "subject": "您的安全验证码: 918234",
    "html": "<p>您的动态验证码为 <b>918234</b></p>",
    "priority": "high",
    "async": false
  }'
```

### 3.3 批量并发投递 (单次请求高达 500 封)
```bash
curl -X POST http://localhost:3000/v1/emails/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "emails": [
      { "to": "user1@domain.com", "subject": "系统通知 1", "html": "<p>内容 1</p>" },
      { "to": "user2@domain.com", "subject": "系统通知 2", "html": "<p>内容 2</p>" }
    ]
  }'
```

### 3.4 动态模板变量邮件投递
```bash
curl -X POST http://localhost:3000/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "to": "customer@example.com",
    "templateCode": "order_receipt",
    "templateData": {
      "customer": "张三",
      "orderId": "ORD-2026",
      "amount": 99.00
    },
    "priority": "normal",
    "async": true
  }'
```

---

## 4. 邮件模板管理 (CRUD 及 MJML 引擎)

### 4.1 创建新模板 (`POST /v1/templates`)
```bash
curl -X POST http://localhost:3000/v1/templates \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "code": "order_receipt",
    "name": "订单收据模板",
    "subjectTemplate": "尊敬的 {{customer}}，您的订单 #{{orderId}} 已确认",
    "htmlContent": "<h1>感谢订购，{{customer}}！</h1><p>总计支付: <b>${{amount}}</b></p>",
    "mjmlContent": "<mjml><mj-body><mj-section><mj-column><mj-text>感谢订购，{{customer}}！</mj-text></mj-column></mj-section></mj-body></mjml>"
  }'
```

### 4.2 查询所有或特定模板 (`GET /v1/templates`)
```bash
# 查询全部模板
curl -H "X-API-Key: 您的API密钥" http://localhost:3000/v1/templates

# 查询单个模板
curl -H "X-API-Key: 您的API密钥" http://localhost:3000/v1/templates/order_receipt
```

### 4.3 修改现有模板 (`PUT /v1/templates/:code`)
```bash
curl -X PUT http://localhost:3000/v1/templates/order_receipt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "name": "订单收据模板 (升级版)",
    "subjectTemplate": "官方收据: 订单 #{{orderId}}",
    "htmlContent": "<h1>尊敬的 {{customer}}</h1><p>您的订单 #{{orderId}} 已经发货。金额: ${{amount}}</p>"
  }'
```

### 4.4 模板实时渲染预览 (`POST /v1/templates/:code/preview`)
```bash
curl -X POST http://localhost:3000/v1/templates/order_receipt/preview \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "data": {
      "customer": "张三",
      "orderId": "ORD-2026",
      "amount": 99.00
    }
  }'
```

### 4.5 删除模板 (`DELETE /v1/templates/:code`)
```bash
curl -X DELETE http://localhost:3000/v1/templates/order_receipt \
  -H "X-API-Key: 您的API密钥"
```

---

## 5. 多发信账户配置与速率配额限制 (Multi-Provider Accounts & Rate Limiting)

Thotsakan 支持**同时挂载多家邮件服务商**的多发信账户，每个账户可针对**每分钟限速 (Rate Limit Per Minute)** 和**单日最大发信配额 (Daily Quota Limit)** 进行独立硬限制，并自动串联 Failover 故障转移。

### 5.1 接入主力发信账户 (例如 AWS SES: 每分钟 300 封，单日 50,000 封)
```bash
curl -X POST http://localhost:3000/v1/accounts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "name": "AWS SES 生产主力",
    "providerType": "aws-ses",
    "fromEmail": "service@company.com",
    "fromName": "企业通知系统",
    "rateLimitPerMinute": 300,
    "dailyQuotaLimit": 50000,
    "credentials": {
      "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
      "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "region": "ap-east-1"
    }
  }'
```

### 5.2 接入备用发信账户 (例如 Resend 或 M365) 并绑定降级通道
```bash
curl -X POST http://localhost:3000/v1/accounts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "name": "Resend 备用通道",
    "providerType": "resend",
    "fromEmail": "service@company.com",
    "rateLimitPerMinute": 60,
    "dailyQuotaLimit": 10000,
    "credentials": {
      "apiKey": "re_123456789_abcdef"
    }
  }'
```

### 5.3 查询与动态调整配额限速 (`PUT /v1/accounts/:id`)
```bash
# 查询全部已挂载账户
curl -H "X-API-Key: 您的API密钥" http://localhost:3000/v1/accounts

# 调整限速阈值及绑定 Fallback
curl -X PUT http://localhost:3000/v1/accounts/acc_123456 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "rateLimitPerMinute": 600,
    "dailyQuotaLimit": 100000,
    "fallbackAccountId": "acc_standby_789"
  }'
```

---

## 6. 实时投递指标、队列监控与报告 (Real-Time Metrics & Reports)

系统内置毫秒级指标监控，可随时掌握成功率、堆积积压量与失败日志：

### 6.1 聚合发送指标概览 (`GET /v1/metrics/overview`)
```bash
curl -H "X-API-Key: 您的API密钥" http://localhost:3000/v1/metrics/overview
```
**返回数据样例 (JSON):**
```json
{
  "ok": true,
  "metrics": {
    "total": 89200,
    "sent": 88750,
    "pending": 25,
    "processing": 8,
    "failed": 32,
    "suppressed": 385
  }
}
```
- `total`: 系统接收的总邮件任务数
- `sent`: 成功投递并确认的邮件量
- `pending`: 在 SQLite WAL 优先级队列中等待的积压量
- `processing`: 正在被调度器调用云端 API 发送中的任务
- `failed`: 重试耗尽失败并转入死信告警的任务
- `suppressed`: 拦截的黑名单/硬退信/垃圾投诉地址

### 6.2 投递日志精准检索 (`GET /v1/emails/logs`)
```bash
# 检索最近 20 封发送失败的任务
curl -H "X-API-Key: 您的API密钥" "http://localhost:3000/v1/emails/logs?status=FAILED&limit=20"

# 按收件人邮箱精准查单
curl -H "X-API-Key: 您的API密钥" "http://localhost:3000/v1/emails/logs?recipient=customer@domain.com"
```

### 6.3 Prometheus / Grafana 指标拉取 (`GET /metrics/prometheus`)
```bash
curl http://localhost:3000/metrics/prometheus
```


