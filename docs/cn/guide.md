# Thotsakan Mail Engine - 完整技术使用手册 (中文)

## 1. 系统简介
**Thotsakan Mail Engine** 是专为高并发生产环境设计的超轻量级邮件微服务调度引擎，采用 Bun + Hono + SQLite WAL 架构。它支持 14 家主流邮件服务商（AWS SES、Microsoft 365/Graph、Gmail、Resend、Postmark、SendGrid、Brevo、Mailgun 等），内置优先级调度队列、自动故障转移（Smart Failover）、Sentbox 自动清理及在线零停机备份功能。整机运行内存占用低于 40 MB RAM。

---

## 2. 核心网络端口与架构说明 (Network Ports & Roles)

Thotsakan Mail Engine 采用双端口分离架构，兼顾高安全性、高吞吐率与全生态兼容：

| 端口 (Port) | 协议类型 | 服务类别 | 功能与使用场景 (Purpose & Capabilities) |
| :---: | :---: | :---: | :--- |
| **`9547`** | **HTTP / REST** | **控制管理与 API 调度引擎** | • **REST API 接口 (`/v1/emails/send`, `/v1/emails/batch`):** 供现代微服务和前后端通过标准 JSON 负载调用发送邮件。<br>• **可视化交互控制台 (`/`):** 包含新手接入引导（Onboarding Wizard）、10大供应商管理、动态路由策略与黑名单维护。<br>• **交互式 Swagger 接口文档 (`/docs` 与 `/openapi.json`):** 提供符合 OpenAPI 3.0 标准的在线接口测试与规范查询。<br>• **DevOps 与健康探针 (`/healthz`):** 极低开销的容器状态检查，供 Docker 及 Kubernetes 探针使用。<br>• **追踪分析与 Webhook (`/v1/track/*`, `/v1/webhooks/*`):** 邮件已读像素与链接跳转追踪，以及第三方云厂商退信事件接收。 |
| **`9548`** | **SMTP** | **本地 SMTP 中继桥接服务** | • **标准 SMTP 协议服务桥接:** 支持 RFC822 MIME 标准邮件格式接收。<br>• **传统系统与第三方生态集成:** 专为不支持 HTTP API 的传统应用（如 **WordPress、Laravel Mail、Django、企业 ERP、CRM、打印机、扫描仪**）提供无缝对接。<br>• 仅需在客户端将 SMTP 主机配置为 `localhost`（或服务器 IP），端口填 `9548`，API Key 作为密码，邮件即可瞬间进入 Thotsakan 智能优先级调度队列。 |

---

## 3. 3分钟快速接入 AWS SES
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
   curl -X POST http://localhost:9547/v1/accounts \
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
   - 访问网页控制台 `http://localhost:9547/console`
   - 进入 **"One-Click DNS Verify"** 页面，一键检测并复制 DKIM/SPF 记录至域名托管商。

---

## 3. 核心 API 示例

### 3.1 异步极速入队模式 (< 5ms 响应)
```bash
curl -X POST http://localhost:9547/v1/emails/send \
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
curl -X POST http://localhost:9547/v1/emails/send \
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
curl -X POST http://localhost:9547/v1/emails/batch \
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
curl -X POST http://localhost:9547/v1/emails/send \
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
curl -X POST http://localhost:9547/v1/templates \
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
curl -H "X-API-Key: 您的API密钥" http://localhost:9547/v1/templates

# 查询单个模板
curl -H "X-API-Key: 您的API密钥" http://localhost:9547/v1/templates/order_receipt
```

### 4.3 修改现有模板 (`PUT /v1/templates/:code`)
```bash
curl -X PUT http://localhost:9547/v1/templates/order_receipt \
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
curl -X POST http://localhost:9547/v1/templates/order_receipt/preview \
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
curl -X DELETE http://localhost:9547/v1/templates/order_receipt \
  -H "X-API-Key: 您的API密钥"
```

---

## 5. 多发信账户配置与提供商 API 凭证接入指南 (Provider Credentials & Multi-Account Setup)

Thotsakan 支持**同时挂载多家邮件服务商**的多发信账户，覆盖 14 种主流云服务商与协议（AWS SES、Microsoft 365、Google Workspace Gmail、Resend、SendGrid、Postmark、Brevo、Mailgun、MailerSend、ZeptoMail、Scaleway、SparkPost、Mandrill 及通用 Generic SMTP）。每个账户均支持设置独立的**每分钟限速 (Rate Limit Per Minute)** 和**单日最大发信配额 (Daily Quota Limit)**，并自动串联智能故障转移 (Smart Failover)。

所有发信账户均通过以下 API 端点添加：
`POST /v1/accounts` (请求头：`X-API-Key: 您的API密钥`, `Content-Type: application/json`)

---

### 5.1 凭证字段详细说明 (`credentials`)

| 字段名称 | 数据类型 | 描述及适用提供商 |
| :--- | :--- | :--- |
| `apiKey` | String | API 密钥、Secret Token 或 OAuth2 Bearer Token（适用于 AWS SES、Resend、SendGrid、Postmark、Brevo、Mailgun、MS Graph、Gmail 等） |
| `secretKey` | String | AWS Secret Access Key（与 `apiKey` / Access Key ID 配合用于 AWS SES） |
| `region` | String | AWS 区域，例如 `ap-east-1`、`us-east-1`（适用于 AWS SES） |
| `tenantId` | String | Azure 目录 / 租户 ID（用于 Microsoft 365 自主刷新 Token） |
| `clientId` | String | Azure 应用程序 (客户端) ID 或 Google OAuth Client ID |
| `clientSecret` | String | Azure 客户端密码值 (Client Secret) 或 Google OAuth 客户端密钥 |
| `refreshToken` | String | Google OAuth2 刷新令牌 (Refresh Token)（用于 Gmail 自主刷新 Token） |
| `host` | String | SMTP 服务器主机名 / IP（用于通用 SMTP 或 Mailgun 自定义域名） |
| `port` | Number | 连接端口，例如 `587`、`465`、`25`（用于通用 SMTP） |
| `secure` | Boolean | `true` 为 SSL/TLS (端口 465)，`false` 为 STARTTLS (端口 587 / 25) |
| `user` | String | SMTP 用户名（用于通用 SMTP） |
| `pass` | String | SMTP 密码或应用专用密码（用于通用 SMTP） |

---

### 5.2 各邮件提供商配置示例与 Token / API Key 获取指南

---

#### 1. Microsoft 365 / Exchange Online (`providerType: "ms-graph"`)
通过 Microsoft Graph REST API (`https://graph.microsoft.com/v1.0/me/sendMail` 或 `/v1.0/users/{fromEmail}/sendMail`) 直接连接。

##### 📌 Azure Entra ID 应用注册与权限配置步骤：
1. 登录 **[Azure 门户 (Azure Portal)](https://portal.azure.com/)** -> 进入 **Microsoft Entra ID** -> 选择 **应用注册 (App registrations)** -> 点击 **+ 新注册 (+ New registration)**。
2. 输入应用名称（如 `Thotsakan-Mail-Service`）-> 支持的账户类型选择 `仅此组织目录中的账户 (Single tenant)` -> 点击 **注册**。
3. 在应用的“概述 (Overview)”页面中，复制以下关键参数：
   - **应用程序 (客户端) ID (Application client ID)**
   - **目录 (租户) ID (Directory tenant ID)**
4. 配置邮件发送权限 (API Permissions)：
   - 进入 **API 权限 (API permissions)** -> 点击 **+ 添加权限** -> 选择 **Microsoft Graph**。
   - 选择 **应用程序权限 (Application permissions)**（后台 Daemon 服务必须使用此权限）。
   - 搜索并勾选：`Mail.Send`。
   - 点击 **添加权限**。
   - **非常重要：** 点击 **代表 [您的组织名称] 授予管理员许可 (Grant admin consent)** 按钮进行最终授权。
5. 创建客户端密码 (Client Secret)：
   - 进入 **证书和密码 (Certificates & secrets)** -> 点击 **客户端密码 (Client secrets)** 标签 -> 点击 **+ 新客户端密码**。
   - 输入说明（如 `Thotsakan Key`）并选择有效期限（建议选择 `24 个月`）。
   - 点击 **添加**，并**立即复制“值 (Value)”一栏的字符串**（该密钥仅显示一次，离开页面后将无法再次查看）。

##### 🛠️ 通过 cURL 手动获取临时 Bearer Token（用于测试）：
```bash
curl -X POST https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=<CLIENT_ID>" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "grant_type=client_credentials"
```
*(返回的 `access_token` 有效期为 3,600 秒 / 1 小时)*

##### 🚀 请求 Payload 示例：
* **模式 A（推荐 - 自主刷新 Autonomous Token Refresh，永久无忧）：**
```json
{
  "name": "Microsoft 365 生产主力 (自动轮转)",
  "providerType": "ms-graph",
  "fromEmail": "notification@yourcompany.onmicrosoft.com",
  "fromName": "企业通知系统",
  "rateLimitPerMinute": 30,
  "dailyQuotaLimit": 10000,
  "credentials": {
    "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "clientId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "clientSecret": "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
  },
  "secretExpiresAt": "2028-09-20T00:00:00Z"
}
```
* **模式 B（临时 Bearer Token，需手动维护 1 小时过期）：**
```json
{
  "name": "Microsoft 365 临时 Token",
  "providerType": "ms-graph",
  "fromEmail": "notification@yourcompany.onmicrosoft.com",
  "credentials": {
    "apiKey": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6..."
  }
}
```

---

#### 2. Google Workspace / Gmail API (`providerType: "gmail"`)
通过 Gmail REST API v1 (`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`) 采用 MIME RFC 2822 base64url 格式发送。

##### 📌 OAuth2 Client ID 与 Refresh Token 获取步骤：
1. 登录 **[Google Cloud 控制台](https://console.cloud.google.com/)** -> 新建项目（例如 `Thotsakan-Mailer`）。
2. 进入 **API 和服务** -> **库** -> 搜索 `Gmail API` 并点击 **启用**。
3. 进入 **API 和服务** -> **OAuth 同意屏幕 (OAuth consent screen)**：
   - 用户类型选择 `内部 (Internal)`（仅限企业 Workspace 组织成员）或 `外部 (External)`。
   - 添加范围 (Scopes)：`https://www.googleapis.com/auth/gmail.send`。
4. 进入 **凭据 (Credentials)** -> **+ 创建凭据** -> 选择 **OAuth 客户端 ID**：
   - 应用类型选择：`Web 应用程序 (Web application)`。
   - 添加已获授权的重定向 URI：`https://developers.google.com/oauthplayground`（用于一次性换取 Refresh Token）。
   - 保存并复制 **客户端 ID (Client ID)** 与 **客户端密钥 (Client Secret)**。
5. 获取 `refresh_token`：
   - 打开 **[Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)** -> 点击右上角齿轮图标 (Settings) -> 勾选 **Use your own OAuth credentials** 并填入 Client ID 与 Client Secret。
   - 在 Step 1 输入 Scope：`https://www.googleapis.com/auth/gmail.send` -> 点击 **Authorize APIs**。
   - 登录发信 Google 账号并授权 -> 点击 **Exchange authorization code for tokens** -> 复制 **Refresh token**。

##### 🚀 请求 Payload 示例：
* **自主刷新模式（推荐）：**
```json
{
  "name": "Google Workspace 企业发信",
  "providerType": "gmail",
  "fromEmail": "sender@yourcompany.com",
  "fromName": "客服中心",
  "rateLimitPerMinute": 60,
  "dailyQuotaLimit": 2000,
  "credentials": {
    "clientId": "xxxx.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-xxxx",
    "refreshToken": "1//04xxxx"
  }
}
```

---

#### 3. Amazon AWS SES (`providerType: "aws-ses"`)
基于 Amazon Simple Email Service (SES) AWS Signature v4 API 连接。

##### 📌 IAM 用户与 Access Key 创建步骤：
1. 登录 **[AWS 管理控制台](https://console.aws.amazon.com/)** -> 进入 **IAM (身份与访问管理)**。
2. 点击 **用户 (Users)** -> **创建用户 (Create user)**（例如 `thotsakan-ses-sender`）。
3. 权限设置选择 **直接附加策略 (Attach policies directly)** -> 创建策略并粘贴 JSON：
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
4. 用户创建完成后，进入 **安全凭证 (Security credentials)** 标签 -> 在 **访问密钥 (Access keys)** 区域点击 **创建访问密钥**。
5. 用途选择 `在 AWS 外部运行的应用程序` -> 复制 **访问密钥 ID (Access Key ID)** 和 **私有访问密钥 (Secret Access Key)**。
6. 进入 **Amazon SES 控制台** -> **已验证身份 (Verified identities)** -> 点击 **创建身份** 验证您的发信域名或邮箱。

##### 🚀 请求 Payload 示例：
```json
{
  "name": "AWS SES 生产主力",
  "providerType": "aws-ses",
  "fromEmail": "noreply@company.com",
  "fromName": "公司业务系统",
  "rateLimitPerMinute": 300,
  "dailyQuotaLimit": 50000,
  "credentials": {
    "apiKey": "AKIAIOSFODNN7EXAMPLE",
    "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "ap-east-1"
  }
}
```

---

#### 4. Resend (`providerType: "resend"`)
##### 📌 API Key 获取步骤：
1. 登录 **[Resend 控制台](https://resend.com/overview)** -> 进入 **API Keys** -> 点击 **Create API Key**。
2. 命名密钥 -> 权限设置：`Full access` 或 `Sending access`（可指定域名）。
3. 复制以 `re_...` 开头的 API Key。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "Resend 备用通道",
  "providerType": "resend",
  "fromEmail": "noreply@company.com",
  "rateLimitPerMinute": 60,
  "dailyQuotaLimit": 10000,
  "credentials": {
    "apiKey": "re_123456789_abcdef"
  }
}
```

---

#### 5. SendGrid (`providerType: "sendgrid"`)
##### 📌 API Key 获取步骤：
1. 登录 **[SendGrid 控制台](https://app.sendgrid.com/)** -> 进入 **Settings** -> **API Keys** -> 点击 **Create API Key**。
2. 输入密钥名称 -> 权限选择 `Restricted Access` -> 将 `Mail Send` 设为 `Full Access`。
3. 点击 **Create & View** -> 复制以 `SG....` 开头的 API Key。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "SendGrid 主力发信",
  "providerType": "sendgrid",
  "fromEmail": "noreply@company.com",
  "rateLimitPerMinute": 200,
  "dailyQuotaLimit": 25000,
  "credentials": {
    "apiKey": "SG.xxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
  }
}
```

---

#### 6. Postmark (`providerType: "postmark"`)
##### 📌 Server API Token 获取步骤：
1. 登录 **[Postmark 控制台](https://account.postmarkapp.com/)** -> 选择您的服务器 (Server)。
2. 进入 **API Tokens** 标签 -> 复制 **Server API Token**。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "Postmark 事务邮件",
  "providerType": "postmark",
  "fromEmail": "noreply@company.com",
  "rateLimitPerMinute": 300,
  "dailyQuotaLimit": 50000,
  "credentials": {
    "apiKey": "25f18c64-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

---

#### 7. Brevo / Sendinblue (`providerType: "brevo"`)
##### 📌 API Key 获取步骤：
1. 登录 **[Brevo 控制台](https://app.brevo.com/)** -> 点击右上角个人账户 -> 选择 **SMTP & API**。
2. 进入 **API keys** 标签 -> 点击 **Generate a new API key**。
3. 输入密钥名称 -> 复制以 `xkeysib-...` 开头的 API Key。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "Brevo 提供商",
  "providerType": "brevo",
  "fromEmail": "noreply@company.com",
  "rateLimitPerMinute": 60,
  "dailyQuotaLimit": 9000,
  "credentials": {
    "apiKey": "xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

---

#### 8. Mailgun (`providerType: "mailgun"`)
##### 📌 Private API Key 获取步骤：
1. 登录 **[Mailgun 控制台](https://app.mailgun.com/)** -> 点击右上角账户 -> 选择 **API Security**。
2. 在 **Mailgun API keys** 区域 -> 复制或生成 **Primary API key**（以 `key-...` 开头）。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "Mailgun 节点",
  "providerType": "mailgun",
  "fromEmail": "noreply@company.com",
  "rateLimitPerMinute": 100,
  "dailyQuotaLimit": 10000,
  "credentials": {
    "apiKey": "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "host": "mg.yourdomain.com"
  }
}
```

---

#### 9. MailerSend (`providerType: "mailersend"`)
##### 📌 API Token 获取步骤：
1. 登录 **[MailerSend 控制台](https://www.mailersend.com/)** -> 进入 **API Tokens** -> 点击 **Create Token**。
2. 权限选择 `Email: Full access` -> 复制以 `mlsn....` 开头的 Token。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "MailerSend 通道",
  "providerType": "mailersend",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "mlsn.xxxxxxxxxxxxxxxxxxxx"
  }
}
```

---

#### 10. ZeptoMail (`providerType: "zeptomail"`)
##### 📌 Send Mail Token 获取步骤：
1. 登录 **[ZeptoMail (Zoho) 控制台](https://zeptomail.zoho.com/)** -> 选择您的 Mail Agent。
2. 进入 **Setup Info** 标签 -> 在 **Send Mail Token** 区域复制 **Zoho-enczapikey**。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "ZeptoMail Agent",
  "providerType": "zeptomail",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "PHtE6r0xxxxxx"
  }
}
```

---

#### 11. Scaleway (`providerType: "scaleway"`)
##### 📌 API Secret Key 获取步骤：
1. 登录 **[Scaleway 控制台](https://console.scaleway.com/)** -> 进入 IAM -> **API Keys** -> 点击 **Generate API Key**。
2. 复制生成的 **Secret Key**。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "Scaleway 事务邮件",
  "providerType": "scaleway",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

---

#### 12. SparkPost (`providerType: "sparkpost"`)
##### 📌 API Key 获取步骤：
1. 登录 **[SparkPost 控制台](https://app.sparkpost.com/)** -> 进入 **Configuration** -> **API Keys**。
2. 点击 **Create API Key** -> 赋予 `Transmissions: Read/Write` 权限 -> 复制 Key。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "SparkPost 集群",
  "providerType": "sparkpost",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

---

#### 13. Mandrill / Mailchimp Transactional (`providerType: "mandrill"`)
##### 📌 API Key 获取步骤：
1. 登录 **[Mailchimp Transactional 控制台](https://mandrillapp.com/)** -> 进入 **Settings** -> **API Keys**。
2. 点击 **+ New API Key** -> 复制以 `md-...` 开头的 Key。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "Mandrill 节点",
  "providerType": "mandrill",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "md-xxxxxxxxxxxxxxxxxxxx"
  }
}
```

---

#### 14. Generic SMTP Relay (`providerType: "generic-smtp"`)
用于对接企业本地 Postfix、Exim、Zimbra 或私有 SMTP 中继网关。
##### 📌 所需 SMTP 参数：
- 服务器主机名 / IP 与端口（`587` 对应 STARTTLS，`465` 对应 SSL）。
- SMTP 认证用户名与密码。
##### 🚀 请求 Payload 示例：
```json
{
  "name": "企业私有 Postfix SMTP",
  "providerType": "generic-smtp",
  "fromEmail": "noreply@corp.local",
  "rateLimitPerMinute": 60,
  "dailyQuotaLimit": 10000,
  "credentials": {
    "host": "mail.corp.local",
    "port": 587,
    "secure": false,
    "user": "smtp-user",
    "pass": "smtp-secret-password"
  }
}
```

---

### 5.3 查询与动态调整配额限速 (`PUT /v1/accounts/:id`)
```bash
# 查询全部已挂载账户
curl -H "X-API-Key: 您的API密钥" http://localhost:9547/v1/accounts

# 调整限速阈值为 600封/分、100,000封/天，并绑定降级备用通道
curl -X PUT http://localhost:9547/v1/accounts/acc_123456 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "rateLimitPerMinute": 600,
    "dailyQuotaLimit": 100000,
    "fallbackAccountId": "acc_standby_789"
  }'
```

---

### 5.4 针对 Microsoft 365 与 Google Workspace 的 DNS 解析配置 (SPF, DKIM, DMARC)

为保障 100% 进信率 (Inbox Rate) 并杜绝被拒信或列入垃圾邮件，请在域名 DNS 服务商（如 Cloudflare、阿里云 DNS、DNSPod、GoDaddy）添加以下记录：

#### 1. Microsoft 365 (Exchange Online)
- **SPF 记录 (TXT):**
  - 主机记录: `@`
  - 记录值: `v=spf1 include:spf.protection.outlook.com -all`
- **DKIM 记录 (CNAME x2):**
  - 记录 1: 主机记录: `selector1._domainkey` -> 指向: `selector1-yourdomain-com._domainkey.yourtenant.onmicrosoft.com`
  - 记录 2: 主机记录: `selector2._domainkey` -> 指向: `selector2-yourdomain-com._domainkey.yourtenant.onmicrosoft.com`
- **DMARC 记录 (TXT):**
  - 主机记录: `_dmarc`
  - 记录值: `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@yourdomain.com`

#### 2. Google Workspace (Gmail)
- **SPF 记录 (TXT):**
  - 主机记录: `@`
  - 记录值: `v=spf1 include:_spf.google.com ~all`
- **DKIM 记录 (TXT):**
  - 主机记录: `google._domainkey`
  - 记录值: `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg...`（在 Google Admin 管理后台中生成）
- **DMARC 记录 (TXT):**
  - 主机记录: `_dmarc`
  - 记录值: `v=DMARC1; p=reject; rua=mailto:dmarc-reports@yourdomain.com`

> **💡 提示：** 配置完成后，可直接打开 Web 控制台 GUI (`http://localhost:9547/`)，进入 **"DNS Verify"** 标签页一键实时诊断 SPF 与 DKIM 解析状态。

---

## 6. 实时投递指标、队列监控与报告 (Real-Time Metrics & Reports)

系统内置毫秒级指标监控，可随时掌握成功率、堆积积压量与失败日志：

### 6.1 聚合发送指标概览 (`GET /v1/metrics/overview`)
```bash
curl -H "X-API-Key: 您的API密钥" http://localhost:9547/v1/metrics/overview
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
curl -H "X-API-Key: 您的API密钥" "http://localhost:9547/v1/emails/logs?status=FAILED&limit=20"

# 按收件人邮箱精准查单
curl -H "X-API-Key: 您的API密钥" "http://localhost:9547/v1/emails/logs?recipient=customer@domain.com"
```

### 6.3 Prometheus / Grafana 指标拉取 (`GET /metrics/prometheus`)
```bash
curl http://localhost:9547/metrics/prometheus
```

---

## 7. 无头控制 API (Headless Control API - 完整程序化管理)

Web 控制台上的所有功能均可通过 REST API 100% 程序化调用控制：

### 7.1 测试发信通道连通性 (`POST /v1/accounts/:id/test`)
```bash
curl -X POST http://localhost:9547/v1/accounts/acc_1742440000_abc/test \
  -H "X-API-Key: 您的API密钥"
```

### 7.2 更新路由规则 (`PUT /v1/rules/:id`)
```bash
curl -X PUT http://localhost:9547/v1/rules/rule_1742440000_xyz \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 您的API密钥" \
  -d '{
    "priority": 20,
    "isActive": true
  }'
```

### 7.3 单邮箱抑制状态查询 (`GET /v1/suppression/check/:email`)
```bash
curl -H "X-API-Key: 您的API密钥" http://localhost:9547/v1/suppression/check/customer@example.com
```

### 7.4 重试所有失败任务 (`POST /v1/queue/retry-failed`)
```bash
curl -X POST http://localhost:9547/v1/queue/retry-failed \
  -H "X-API-Key: 您的API密钥"
```

### 7.5 清理死信任务 (`POST /v1/queue/purge-dead`)
```bash
curl -X POST http://localhost:9547/v1/queue/purge-dead \
  -H "X-API-Key: 您的API密钥"
```

---

## 9. 通过 GitHub Container Registry (GHCR) 一键启动

使用单行命令在 VPS 或本地立即运行 Thotsakan：
```bash
docker run -d --name thotsakan \
  -p 9547:9547 \
  -p 9548:9548 \
  -v $(pwd)/data:/app/data \
  ghcr.io/thabot/thotsakan-mail:latest
```
运行后访问 Web 控制台：`http://localhost:9547`，访问交互式 Swagger 文档：`http://localhost:9547/docs`。

