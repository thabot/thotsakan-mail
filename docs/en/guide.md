# Thotsakan Mail Engine - Complete Documentation (English)

## 1. Introduction
**Thotsakan Mail Engine** is a high-throughput, multi-provider transactional email microservice built on Bun, Hono, and SQLite WAL Mode. Designed to reduce enterprise email costs by over 90%, it seamlessly routes, priority-queues, and automatically fails over across 14 major cloud and SaaS email providers (AWS SES, Microsoft Graph/M365, Gmail, Resend, Postmark, SendGrid, Brevo, Mailgun, etc.) while maintaining a microscopic memory footprint under 40 MB RAM.

---

## 2. Network Ports & Architecture (Port Roles)

Thotsakan Mail Engine divides its network responsibilities across two dedicated ports for security, performance, and compatibility:

| Port | Protocol | Service Type | Purpose & Capabilities |
| :---: | :---: | :---: | :--- |
| **`9547`** | **HTTP / REST** | **Management & API Engine** | • **REST API Endpoint (`/v1/emails/send`, `/v1/emails/batch`):** Modern microservices send transactional emails via JSON payloads.<br>• **Interactive Web Console (`/`):** Dashboard for onboarding, managing 10+ outbound providers, rules, and suppression lists.<br>• **Interactive Swagger Docs (`/docs` & `/openapi.json`):** OpenAPI 3.0 specification & interactive testing sandbox.<br>• **DevOps & Monitoring (`/healthz`):** Zero-overhead health check for Docker, Kubernetes, and load balancers.<br>• **Open & Click Tracking (`/v1/track/*`):** Transparent tracking pixel & link redirection proxy.<br>• **Webhook Ingestion (`/v1/webhooks/*`):** Ingest bounce and complaint notifications from external email providers. |
| **`9548`** | **SMTP** | **Inbound SMTP Relay Bridge** | • **Local SMTP Server Bridge:** Accepts standard RFC822 MIME emails over SMTP protocol.<br>• **Legacy & Third-Party System Integration:** Allows apps without native HTTP API support (e.g., **WordPress, Laravel, Django, ERP, CRM, Printers, Scanners**) to connect.<br>• Simply configure Host: `localhost` (or server IP), Port: `9548`, with your API Key as password. The engine automatically parses and ingests messages into the priority failover queue. |

---

## 3. Quick AWS SES Setup in 3 Minutes
1. **Create AWS IAM User:**
   - Go to AWS IAM Console -> Users -> Create User
   - Attach minimal permissions policy:
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
   - Generate `Access Key ID` and `Secret Access Key`.
2. **Register Account in Thotsakan:**
   ```bash
   curl -X POST http://localhost:9547/v1/accounts \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{
       "name": "AWS SES Production",
       "providerType": "aws-ses",
       "fromEmail": "notifications@example.com",
       "credentials": {
         "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
         "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
         "region": "us-east-1"
       }
     }'
   ```
3. **Verify DNS in 1 Click:**
   - Open Web Console at `http://localhost:9547/console`
   - Switch to **"One-Click DNS Verify"** tab and verify your sender domain.
   - Copy SPF and DKIM tokens to Cloudflare or Route53.

---

## 3. API Dispatch Examples

### 3.1 Fast Asynchronous Enqueue (< 5ms)
```bash
curl -X POST http://localhost:9547/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "customer@example.com",
    "subject": "Order Confirmed #90123",
    "html": "<h1>Order Received</h1><p>Thank you for your purchase!</p>",
    "priority": "normal",
    "async": true
  }'
```

### 3.2 High-Priority Synchronous Send (OTP)
```bash
curl -X POST http://localhost:9547/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "user@example.com",
    "subject": "Your Security OTP Code",
    "html": "<p>Your OTP code is <b>748291</b></p>",
    "priority": "high",
    "async": false
  }'
```

### 3.3 Bulk Batch Dispatch (Up to 500 emails)
```bash
curl -X POST http://localhost:9547/v1/emails/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "emails": [
      { "to": "user1@domain.com", "subject": "Notice #1", "html": "<p>Content 1</p>" },
      { "to": "user2@domain.com", "subject": "Notice #2", "html": "<p>Content 2</p>" }
    ]
  }'
```

### 3.4 Dispatch with Template & Dynamic Variables
```bash
curl -X POST http://localhost:9547/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "customer@example.com",
    "templateCode": "invoice_receipt",
    "templateData": {
      "customer": "Sarah Connor",
      "invoiceId": "INV-5502",
      "amount": 299.00
    },
    "priority": "normal",
    "async": true
  }'
```

---

## 4. Email Template Management (CRUD & MJML Engine)

### 4.1 Create Template (`POST /v1/templates`)
```bash
curl -X POST http://localhost:9547/v1/templates \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "code": "invoice_receipt",
    "name": "Invoice Template",
    "subjectTemplate": "Invoice #{{invoiceId}} for {{customer}}",
    "htmlContent": "<h1>Hello {{customer}}</h1><p>Amount due: <b>${{amount}}</b></p>",
    "mjmlContent": "<mjml><mj-body><mj-section><mj-column><mj-text>Hello {{customer}}</mj-text></mj-column></mj-section></mj-body></mjml>"
  }'
```

### 4.2 List or Retrieve Template (`GET /v1/templates`)
```bash
# List all templates
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/templates

# Retrieve single template
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/templates/invoice_receipt
```

### 4.3 Update Template (`PUT /v1/templates/:code`)
```bash
curl -X PUT http://localhost:9547/v1/templates/invoice_receipt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "Updated Invoice Template",
    "subjectTemplate": "Official Invoice #{{invoiceId}} for {{customer}}",
    "htmlContent": "<h1>Invoice #{{invoiceId}}</h1><p>Total amount: ${{amount}}</p>"
  }'
```

### 4.4 Render Template Preview (`POST /v1/templates/:code/preview`)
```bash
curl -X POST http://localhost:9547/v1/templates/invoice_receipt/preview \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "data": {
      "customer": "Sarah Connor",
      "invoiceId": "INV-5502",
      "amount": 299.00
    }
  }'
```

### 4.5 Delete Template (`DELETE /v1/templates/:code`)
```bash
curl -X DELETE http://localhost:9547/v1/templates/invoice_receipt \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 5. Sender Account Configuration & Provider API Credentials Setup

Thotsakan supports connecting **multiple sender accounts concurrently** across 14 leading cloud providers and protocols (AWS SES, Microsoft 365, Google Workspace Gmail, Resend, SendGrid, Postmark, Brevo, Mailgun, MailerSend, ZeptoMail, Scaleway, SparkPost, Mandrill, and Generic SMTP). Each account enforces independent **Rate Limit Per Minute** and **Daily Quota Limit**, along with automatic Smart Failover fallback chaining.

All provider accounts are registered via the API Endpoint:
`POST /v1/accounts` (Headers: `X-API-Key: YOUR_API_KEY`, `Content-Type: application/json`)

---

### 5.1 Provider Credentials Field Reference (`credentials`)

| Field Name | Type | Description & Applicable Providers |
| :--- | :--- | :--- |
| `apiKey` | String | API Key, Secret Token, or OAuth2 Bearer Token (used in AWS SES, Resend, SendGrid, Postmark, Brevo, Mailgun, MS Graph, Gmail, etc.) |
| `secretKey` | String | AWS Secret Access Key (paired with `apiKey` / Access Key ID for AWS SES) |
| `region` | String | AWS Region, e.g., `us-east-1`, `ap-southeast-1`, `eu-west-1` (for AWS SES) |
| `tenantId` | String | Azure Directory / Tenant ID (for Microsoft 365 Autonomous Token Refresh) |
| `clientId` | String | Azure Application (Client) ID or Google OAuth Client ID |
| `clientSecret` | String | Azure Client Secret Value or Google OAuth Client Secret |
| `refreshToken` | String | Google OAuth2 Refresh Token (for Gmail Autonomous Token Refresh) |
| `host` | String | SMTP Server Hostname / IP (for Generic SMTP, Mailgun custom domains) |
| `port` | Number | Connection Port, e.g., `587`, `465`, `25` (for Generic SMTP) |
| `secure` | Boolean | `true` for implicit SSL/TLS (Port 465) or `false` for STARTTLS (Port 587 / 25) |
| `user` | String | SMTP Username (for Generic SMTP) |
| `pass` | String | SMTP Password or App Password (for Generic SMTP) |

---

### 5.2 Provider Configuration & Step-by-Step Token Acquisition Guides

---

#### 1. Microsoft 365 / Exchange Online (`providerType: "ms-graph"`)
Connects directly via Microsoft Graph REST API (`https://graph.microsoft.com/v1.0/me/sendMail` or `/v1.0/users/{fromEmail}/sendMail`).

##### 📌 Step-by-step Azure Entra ID App Registration & Permissions:
1. Sign in to the **[Azure Portal](https://portal.azure.com/)** -> Navigate to **Microsoft Entra ID** -> **App registrations** -> Click **+ New registration**.
2. Enter an application name (e.g., `Thotsakan-Mail-Engine`) -> Set Supported account types to `Accounts in this organizational directory only (Single tenant)` -> Click **Register**.
3. In the application **Overview** page, copy the following values:
   - **Application (client) ID**
   - **Directory (tenant) ID**
4. Configure API Permissions:
   - Go to **API permissions** -> Click **+ Add a permission** -> Select **Microsoft Graph**.
   - Select **Application permissions** (required for background daemon service).
   - Search for and select: `Mail.Send`.
   - Click **Add permissions**.
   - **CRITICAL STEP:** Click **Grant admin consent for [Your Organization]** to approve the permission.
5. Create a Client Secret:
   - Go to **Certificates & secrets** -> **Client secrets** tab -> Click **+ New client secret**.
   - Enter a description (e.g., `Thotsakan Engine Key`) and select an expiration period (recommended: `24 months`).
   - Click **Add** and immediately copy the string in the **Value** column (it is only shown once).

##### 🛠️ How to acquire a temporary Bearer Token manually via cURL (for testing):
```bash
curl -X POST https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=<CLIENT_ID>" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "grant_type=client_credentials"
```
*(Returns an `access_token` valid for 3,600 seconds / 1 hour).*

##### 🚀 Example JSON Payloads:
* **Autonomous Token Refresh (Recommended - auto-rotates tokens before expiry):**
```json
{
  "name": "Microsoft 365 Production (Autonomous Refresh)",
  "providerType": "ms-graph",
  "fromEmail": "notification@yourcompany.onmicrosoft.com",
  "fromName": "Corporate Dispatch",
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
* **Static Bearer Token (Manual 1-hour token):**
```json
{
  "name": "Microsoft 365 Manual Bearer",
  "providerType": "ms-graph",
  "fromEmail": "notification@yourcompany.onmicrosoft.com",
  "credentials": {
    "apiKey": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6..."
  }
}
```

---

#### 2. Google Workspace / Gmail API (`providerType: "gmail"`)
Connects via Gmail REST API v1 (`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`) using MIME RFC 2822 base64url encoding.

##### 📌 Step-by-step OAuth2 Client ID & Refresh Token Setup:
1. Sign in to the **[Google Cloud Console](https://console.cloud.google.com/)** -> Create a new project (e.g., `Thotsakan-Mail-Service`).
2. Go to **APIs & Services** -> **Library** -> Search for `Gmail API` and click **Enable**.
3. Go to **APIs & Services** -> **OAuth consent screen**:
   - Choose User Type: `Internal` (for Google Workspace enterprise users) or `External`.
   - Add Scope: `https://www.googleapis.com/auth/gmail.send`.
4. Go to **Credentials** -> **+ Create Credentials** -> Select **OAuth client ID**:
   - Application type: `Web application`.
   - Add Authorized redirect URI: `https://developers.google.com/oauthplayground` (used for one-time code exchange).
   - Save and copy your **Client ID** and **Client Secret**.
5. Obtain the `refresh_token`:
   - Open **[Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)** -> Click the gear icon (Settings) in the top right -> Check **Use your own OAuth credentials** and enter your Client ID and Client Secret.
   - In Step 1 (Input scopes), enter: `https://www.googleapis.com/auth/gmail.send` -> Click **Authorize APIs**.
   - Sign in with the sender Google account and grant permissions -> Click **Exchange authorization code for tokens** -> Copy the **Refresh token**.

##### 🚀 Example JSON Payload:
* **Autonomous Token Refresh (Recommended):**
```json
{
  "name": "Google Workspace Primary Mailer",
  "providerType": "gmail",
  "fromEmail": "sender@yourcompany.com",
  "fromName": "Support Team",
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
Connects via Amazon Simple Email Service (SES) AWS Signature v4 API.

##### 📌 Step-by-step IAM User & Access Key Setup:
1. Sign in to the **[AWS Management Console](https://console.aws.amazon.com/)** -> Go to **IAM (Identity and Access Management)**.
2. Under **Users**, click **Create user** (e.g., `thotsakan-ses-sender`).
3. Select **Attach policies directly** -> Click **Create policy** -> Switch to JSON:
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
4. After creating the user, go to the **Security credentials** tab -> Under **Access keys**, click **Create access key**.
5. Choose use case `Application running outside AWS` -> Copy the **Access Key ID** and **Secret Access Key**.
6. Open the **Amazon SES Console** -> Go to **Verified identities** -> Click **Create identity** to verify your sender Domain or Email Address.

##### 🚀 Example JSON Payload:
```json
{
  "name": "AWS SES Production",
  "providerType": "aws-ses",
  "fromEmail": "noreply@company.com",
  "fromName": "Company System",
  "rateLimitPerMinute": 300,
  "dailyQuotaLimit": 50000,
  "credentials": {
    "apiKey": "AKIAIOSFODNN7EXAMPLE",
    "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1"
  }
}
```

---

#### 4. Resend (`providerType: "resend"`)
##### 📌 How to obtain API Key:
1. Sign in to **[Resend Dashboard](https://resend.com/overview)** -> Navigate to **API Keys** -> Click **Create API Key**.
2. Name your key -> Set Permission: `Full access` or `Sending access` (optionally restricted to a verified domain).
3. Copy the API Key starting with `re_...`.
##### 🚀 Example JSON Payload:
```json
{
  "name": "Resend Standby",
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
##### 📌 How to obtain API Key:
1. Sign in to **[SendGrid Dashboard](https://app.sendgrid.com/)** -> Go to **Settings** -> **API Keys** -> Click **Create API Key**.
2. Set API Key Name -> Select `Restricted Access` -> Enable `Mail Send` permission to `Full Access`.
3. Click **Create & View** -> Copy the generated API Key starting with `SG....`.
##### 🚀 Example JSON Payload:
```json
{
  "name": "SendGrid Primary",
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
##### 📌 How to obtain Server API Token:
1. Sign in to **[Postmark Console](https://account.postmarkapp.com/)** -> Select your Server (e.g., `Transactional Server`).
2. Navigate to the **API Tokens** tab -> Copy the **Server API Token**.
##### 🚀 Example JSON Payload:
```json
{
  "name": "Postmark Transactional",
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
##### 📌 How to obtain API Key:
1. Sign in to **[Brevo Dashboard](https://app.brevo.com/)** -> Click your profile name (top right) -> Select **SMTP & API**.
2. Under the **API keys** tab -> Click **Generate a new API key**.
3. Name your key -> Copy the API Key starting with `xkeysib-...`.
##### 🚀 Example JSON Payload:
```json
{
  "name": "Brevo Dispatcher",
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
##### 📌 How to obtain Private API Key:
1. Sign in to **[Mailgun Dashboard](https://app.mailgun.com/)** -> Click profile menu -> Select **API Security**.
2. Under **Mailgun API keys** -> Copy or generate your **Primary API key** (starts with `key-...`).
##### 🚀 Example JSON Payload:
```json
{
  "name": "Mailgun Relay",
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
##### 📌 How to obtain API Token:
1. Sign in to **[MailerSend Dashboard](https://www.mailersend.com/)** -> Navigate to **API Tokens** -> Click **Create Token**.
2. Select permission `Email: Full access` -> Copy the Token (starts with `mlsn....`).
##### 🚀 Example JSON Payload:
```json
{
  "name": "MailerSend Secondary",
  "providerType": "mailersend",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "mlsn.xxxxxxxxxxxxxxxxxxxx"
  }
}
```

---

#### 10. ZeptoMail (`providerType: "zeptomail"`)
##### 📌 How to obtain Send Mail Token:
1. Sign in to **[ZeptoMail (Zoho) Console](https://zeptomail.zoho.com/)** -> Select your Mail Agent.
2. Go to **Setup Info** -> Under **Send Mail Token**, copy the **Zoho-enczapikey** token.
##### 🚀 Example JSON Payload:
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
##### 📌 How to obtain API Secret Key:
1. Sign in to **[Scaleway Console](https://console.scaleway.com/)** -> Go to IAM -> **API Keys** -> Click **Generate API Key**.
2. Copy the generated **Secret Key**.
##### 🚀 Example JSON Payload:
```json
{
  "name": "Scaleway Transactional",
  "providerType": "scaleway",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

---

#### 12. SparkPost (`providerType: "sparkpost"`)
##### 📌 How to obtain API Key:
1. Sign in to **[SparkPost Dashboard](https://app.sparkpost.com/)** -> Go to **Configuration** -> **API Keys**.
2. Click **Create API Key** -> Grant `Transmissions: Read/Write` permission -> Copy Key.
##### 🚀 Example JSON Payload:
```json
{
  "name": "SparkPost Cluster",
  "providerType": "sparkpost",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

---

#### 13. Mandrill / Mailchimp Transactional (`providerType: "mandrill"`)
##### 📌 How to obtain API Key:
1. Sign in to **[Mailchimp Transactional Dashboard](https://mandrillapp.com/)** -> Go to **Settings** -> **API Keys**.
2. Click **+ New API Key** -> Copy Key (starts with `md-...`).
##### 🚀 Example JSON Payload:
```json
{
  "name": "Mandrill Primary",
  "providerType": "mandrill",
  "fromEmail": "noreply@company.com",
  "credentials": {
    "apiKey": "md-xxxxxxxxxxxxxxxxxxxx"
  }
}
```

---

#### 14. Generic SMTP Relay (`providerType: "generic-smtp"`)
For connecting to On-Premise Mail Servers, Postfix, Exim, Zimbra, or custom corporate SMTP relays.
##### 📌 Required SMTP Parameters:
- Server Hostname / IP and Port (`587` for STARTTLS or `465` for implicit SSL).
- SMTP Authentication Username and Password.
##### 🚀 Example JSON Payload:
```json
{
  "name": "Corporate Postfix SMTP",
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

### 5.3 Inspect & Update Account Quotas (`PUT /v1/accounts/:id`)
```bash
# List all registered accounts
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/accounts

# Update limits and link fallback account
curl -X PUT http://localhost:9547/v1/accounts/acc_123456 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "rateLimitPerMinute": 600,
    "dailyQuotaLimit": 100000,
    "fallbackAccountId": "acc_standby_789"
  }'
```

---

### 5.4 DNS Records Configuration for Microsoft 365 & Google Workspace (SPF, DKIM, DMARC)

To achieve 100% email inbox delivery and prevent spam classification, configure DNS records on your domain DNS provider (e.g., Cloudflare, Route 53, GoDaddy):

#### 1. Microsoft 365 (Exchange Online)
- **SPF Record (TXT):**
  - Host: `@`
  - Value: `v=spf1 include:spf.protection.outlook.com -all`
- **DKIM Records (CNAME x2):**
  - Record 1: Host: `selector1._domainkey` -> Target: `selector1-yourdomain-com._domainkey.yourtenant.onmicrosoft.com`
  - Record 2: Host: `selector2._domainkey` -> Target: `selector2-yourdomain-com._domainkey.yourtenant.onmicrosoft.com`
- **DMARC Record (TXT):**
  - Host: `_dmarc`
  - Value: `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@yourdomain.com`

#### 2. Google Workspace (Gmail)
- **SPF Record (TXT):**
  - Host: `@`
  - Value: `v=spf1 include:_spf.google.com ~all`
- **DKIM Record (TXT):**
  - Host: `google._domainkey`
  - Value: `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg...` (Obtained from Google Admin Console)
- **DMARC Record (TXT):**
  - Host: `_dmarc`
  - Value: `v=DMARC1; p=reject; rua=mailto:dmarc-reports@yourdomain.com`

> **💡 Tip:** Use the Web Console GUI (`http://localhost:9547/`) under the **"DNS Verify"** tab to run instant real-time diagnostic checks on SPF and DKIM domain records.

---

## 6. Real-Time Analytics, Queue Reports & Logs

Query transmission metrics, live backlog in the priority queue, failure counters, and granular transmission audit logs:

### 6.1 Aggregate Delivery Overview (`GET /v1/metrics/overview`)
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/metrics/overview
```
**Sample Response:**
```json
{
  "ok": true,
  "metrics": {
    "total": 125430,
    "sent": 124800,
    "pending": 45,
    "processing": 12,
    "failed": 88,
    "suppressed": 485
  }
}
```
- `total`: Cumulative email dispatch requests received.
- `sent`: Successfully delivered emails.
- `pending`: Unprocessed emails waiting in the SQLite WAL Priority Queue.
- `processing`: Jobs actively being dispatched to provider APIs.
- `failed`: Exhausted retries and dispatched to dead-letter alerts.
- `suppressed`: Skipped due to previous hard-bounces or spam complaints.

### 6.2 Filter Transmission Logs (`GET /v1/emails/logs`)
```bash
# Get last 20 failed or throttled emails
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:9547/v1/emails/logs?status=FAILED&limit=20"

# Search dispatch history by recipient email
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:9547/v1/emails/logs?recipient=customer@domain.com"
```

### 6.3 Prometheus Scrape Endpoint (`GET /metrics/prometheus`)
```bash
curl http://localhost:9547/metrics/prometheus
```

---

## 7. Headless Control API (Complete Programmatic Management)

Every function available in the Web UI is 100% controllable programmatically via REST API:

### 7.1 Test Provider Connection (`POST /v1/accounts/:id/test`)
```bash
curl -X POST http://localhost:9547/v1/accounts/acc_1742440000_abc/test \
  -H "X-API-Key: YOUR_API_KEY"
```

### 7.2 Update Routing Rule (`PUT /v1/rules/:id`)
```bash
curl -X PUT http://localhost:9547/v1/rules/rule_1742440000_xyz \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "priority": 20,
    "isActive": true
  }'
```

### 7.3 Check Single Email Suppression (`GET /v1/suppression/check/:email`)
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/suppression/check/customer@example.com
```

### 7.4 Re-queue All Failed Jobs (`POST /v1/queue/retry-failed`)
```bash
curl -X POST http://localhost:9547/v1/queue/retry-failed \
  -H "X-API-Key: YOUR_API_KEY"
```

### 7.5 Purge Dead-Letter Queue (`POST /v1/queue/purge-dead`)
```bash
curl -X POST http://localhost:9547/v1/queue/purge-dead \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 9. Run with Docker from GitHub Container Registry (GHCR)

Run Thotsakan Mail Engine instantly with one command:
```bash
docker run -d --name thotsakan \
  -p 9547:9547 \
  -p 9548:9548 \
  -v $(pwd)/data:/app/data \
  ghcr.io/thabot/thotsakan-mail:latest
```
Access the Web Management Console at `http://localhost:9547` and interactive Swagger docs at `http://localhost:9547/docs`.


