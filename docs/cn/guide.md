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
