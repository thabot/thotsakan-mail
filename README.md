# 👺 Thotsakan Mail Engine (ทศกัณฐ์)

<div align="center">
  <h3>The 10-Headed Multi-Provider Transactional Email Dispatcher Microservice</h3>
  <p>Ultra-lightweight (< 40 MB RAM), 5ms Response Time, Priority Queue, Smart Failover, and Inbound SMTP Relay built on Bun + Hono + SQLite WAL.</p>

  [![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
  [![Commercial License: Available](https://img.shields.io/badge/Commercial%20License-Lemon%20Squeezy-purple.svg)](#dual-license-model)
  [![Runtime: Bun](https://img.shields.io/badge/Runtime-Bun%201.4+-f472b6.svg)](https://bun.sh)
  [![Framework: Hono](https://img.shields.io/badge/Framework-Hono%20v4-e11d48.svg)](https://hono.dev)
  [![Tests: 100% Passed](https://img.shields.io/badge/Tests-106%20Passed-emerald.svg)](#testing)
</div>

---

## ⚡️ Key Value Propositions

- 💸 **Save Over 90% on Email Delivery Costs:** Shift high-volume transactional workloads to **AWS SES ($0.10 per 10,000 emails)** as your primary cost optimizer, replacing overpriced SaaS providers.
- 🔄 **Smart Failover Across 14 Email Providers:** Automatic transient error detection (HTTP 429, 5xx, timeouts) and fallback routing across:
  - **Cloud Infrastructure:** AWS SES, Scaleway
  - **Enterprise Mailboxes:** Microsoft 365 / Graph, Google Workspace / Gmail
  - **Modern SaaS:** Resend, Postmark, SendGrid, Brevo, Mailgun, MailerSend, ZeptoMail, SparkPost, Mandrill
  - **On-Premises:** Generic SMTP (Exchange, Postfix, Zimbra)
- 🧹 **Automated Sentbox Cleaner:** For Microsoft 365 and Gmail, automatically purges dispatched OTP and notification messages from the Sent Items folder, preventing mailbox bloat and securing confidential codes.
- 🚀 **Zero-Redis SQLite Priority Queue:** Urgent OTP emails jump ahead of marketing blasts instantly using SQLite WAL concurrency-safe transactions.
- 📬 **Inbound SMTP Relay:** Acts as an internal SMTP Server (ports 587 / 2525) allowing WordPress, WooCommerce, Laravel, and legacy ERP systems to enjoy Queue + Failover to AWS SES without changing a single line of application code.
- 🖥️ **Built-in Web Console & Quick Send:** Embedded single-file SPA (< 1MB) with a real-time Dispatch Playground, Live Logs, and One-Click DNS Verification (SPF, DKIM, DMARC).
- 🔒 **Zero-Downtime SQLite Backup:** Online hot backups via `VACUUM INTO` without locking write operations, retaining a 7-day snapshot rotation.

---

## 🥊 Feature-by-Feature Competitive Analysis

Why high-growth engineering teams choose Thotsakan Mail Engine over monolithic notification SaaS or self-built solutions:

| Feature & Capabilities | 👺 Thotsakan Mail Engine | Novu / Courier (SaaS) | Postal (Self-Hosted) | Custom In-House Setup |
| :--- | :---: | :---: | :---: | :---: |
| **RAM Footprint** | **< 40 MB** 🟢 | > 1.5 GB 🔴 | > 2 GB 🔴 | Varies by language |
| **Smart Multi-Provider Failover** | **Native (14 Providers)** 🟢 | Limited / Add-on 🟡 | None (Single SMTP) 🔴 | Must build manually 🔴 |
| **M365 / Gmail API + Auto Sentbox Cleaner** | **Built-in Native** 🟢 | None 🔴 | None 🔴 | Very complex to write 🔴 |
| **Priority Queue (OTP Bypass Blasts)** | **Zero-Redis (SQLite WAL)** 🟢 | Included 🟢 | Single FIFO Queue 🟡 | Requires external Redis 🟡 |
| **Infrastructure & Server Cost** | **Minimal ($3–$5/mo VPS)** 🟢 | High / Per-Volume MAU 🔴 | High (MySQL + RabbitMQ) 🔴 | Medium 🟡 |
| **Dead-Letter Webhook Alerts** | **Built-in (Discord/Slack/LINE)** 🟢 | Included 🟢 | None 🔴 | Must write webhook 🟡 |
| **Deployment Complexity** | **< 5 min (Single Container)** 🟢 | Multi-service stack 🔴 | Difficult setup 🔴 | Months of dev work 🔴 |
| **Data Privacy & Compliance (PDPA/GDPR)** | **100% On-Prem (Zero PII Leak)** 🟢 | Third-party Cloud PII 🔴 | 100% On-Prem 🟢 | 100% On-Prem 🟢 |

---

## 🚀 Quick Start (Up in 60 Seconds)

### Option 1: Run with Docker Compose (Recommended)
```bash
docker compose up -d
```
Open your browser and navigate to `http://localhost:3000/console` to access the Web Console.

### Option 2: Run with Bun Directly
```bash
# 1. Clone repository
git clone https://github.com/thabot/thotsakan-mail.git
cd thotsakan-mail

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env

# 4. Start the engine
bun run dev
```

---

## 📡 API Usage Quick Reference

### 1. Asynchronous Enqueue (< 5ms response)
```bash
curl -X POST http://localhost:3000/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "customer@example.com",
    "subject": "Order Confirmed #10294",
    "html": "<h1>Order Received</h1><p>Thank you for your purchase!</p>",
    "priority": "normal",
    "async": true
  }'
```

### 2. High-Priority Synchronous Send (Instant OTP)
```bash
curl -X POST http://localhost:3000/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "user@example.com",
    "subject": "Your Login Verification Code",
    "html": "<p>Your OTP code is <b>849201</b> (valid for 5 minutes)</p>",
    "priority": "high",
    "async": false
  }'
```

### 3. Bulk Batch Dispatch (Up to 500 emails per request)
```bash
curl -X POST http://localhost:3000/v1/emails/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "emails": [
      { "to": "user1@domain.com", "subject": "Notice #1", "html": "<p>Content 1</p>" },
      { "to": "user2@domain.com", "subject": "Notice #2", "html": "<p>Content 2</p>" }
    ]
  }'
```

### 4. Dispatch Email with Dynamic Template
Send personalized emails by specifying `templateCode` and dynamic variables in `templateData`:
```bash
curl -X POST http://localhost:3000/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "alice@example.com",
    "templateCode": "order_receipt",
    "templateData": {
      "customerName": "Alice",
      "orderId": "ORD-9821",
      "totalAmount": 149.50,
      "items": [
        { "name": "Cloud Subscription", "qty": 1, "price": 99.50 },
        { "name": "Dedicated IP", "qty": 1, "price": 50.00 }
      ]
    },
    "priority": "high",
    "async": true
  }'
```

---

## 🎨 Template Management (CRUD & MJML Engine)

Thotsakan includes a responsive template engine supporting Handlebars variable interpolation, loops, conditional blocks, and MJML markup:

### 1. Create a Template (`POST /v1/templates`)
```bash
curl -X POST http://localhost:3000/v1/templates \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "code": "order_receipt",
    "name": "Order Receipt Template",
    "subjectTemplate": "Order #{{orderId}} Confirmed for {{customerName}}",
    "htmlContent": "<h1>Thank you {{customerName}}!</h1><p>Total: <b>${{totalAmount}}</b></p>",
    "mjmlContent": "<mjml><mj-body><mj-section><mj-column><mj-text>Thank you {{customerName}}!</mj-text></mj-column></mj-section></mj-body></mjml>"
  }'
```

### 2. Get / List Templates (`GET /v1/templates`)
```bash
# List all templates
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/v1/templates

# Get single template by code
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/v1/templates/order_receipt
```

### 3. Update a Template (`PUT /v1/templates/:code`)
```bash
curl -X PUT http://localhost:3000/v1/templates/order_receipt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "Updated Order Receipt",
    "subjectTemplate": "Official Receipt: Order #{{orderId}}",
    "htmlContent": "<h1>Hello {{customerName}}</h1><p>Your order #{{orderId}} has been processed. Total: ${{totalAmount}}</p>"
  }'
```

### 4. Preview Template with Mock Data (`POST /v1/templates/:code/preview`)
```bash
curl -X POST http://localhost:3000/v1/templates/order_receipt/preview \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "data": {
      "customerName": "Alice",
      "orderId": "ORD-9821",
      "totalAmount": 149.50
    }
  }'
```

### 5. Delete a Template (`DELETE /v1/templates/:code`)
```bash
curl -X DELETE http://localhost:3000/v1/templates/order_receipt \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 📚 Complete Multi-Language Documentation

- 🇬🇧 **[English Documentation (docs/en/guide.md)](docs/en/guide.md)** — Complete Setup, 3-Minute AWS SES Guide, Architecture & API Reference.
- 🇹🇭 **[คู่มือภาษาไทย (docs/th/guide.md)](docs/th/guide.md)** — ติดตั้งระบบ, เชื่อมต่อ AWS SES ใน 3 นาที, และการใช้งาน Web Console.
- 🇨🇳 **[中文使用手册 (docs/cn/guide.md)](docs/cn/guide.md)** — 系统架构, 3分钟接入AWS SES, 及控制台使用指南.
- 💻 **[Client SDK Snippets (docs/sdk/sdks.md)](docs/sdk/sdks.md)** — Ready-to-use code examples for:
  - **C# / .NET 8** (`System.Net.Http.Json`)
  - **Java 17+** (`java.net.http.HttpClient`)
  - **TypeScript / Node.js** (`fetch`)
  - **Python 3** (`requests` / `httpx`)
  - **PHP / Laravel** (`Http::withHeaders`)
  - **Go** (`net/http`)
  - **cURL / Shell**

---

## 🧪 Automated Testing

Comprehensive test suites covering unit and integration testing across all 14 providers:

```bash
bun test
```
```text
106 pass
0 fail
349 expect() calls
Ran 106 tests across 27 files. [259.00ms]
```

---

## 📜 License Architecture & Commercial Tiers

Thotsakan Mail Engine operates on a **Pure Self-Hosted Dual License Model** designed for zero phone-home reliance and complete data sovereignty:

### 1. Feature Matrix by Edition

| Feature / Capability | Community Edition (AGPLv3) | Pro License | Enterprise License |
| :--- | :---: | :---: | :---: |
| **Pricing** | **Free & Open Source** | **$199 / year** | **$799 / year** |
| **Tenants / Workspaces** | Up to 3 Tenants | Up to 20 Tenants | **Unlimited** |
| **Connected Email Accounts** | Up to 5 Accounts | Up to 50 Accounts | **Unlimited** |
| **Web Console UI & Live Dashboard** | ❌ (REST API & CLI) | 🟢 Full Access | 🟢 Full Access |
| **Visual MJML Template Editor** | ❌ | 🟢 Built-in | 🟢 Built-in |
| **Dynamic Multi-Provider Failover** | Basic (1 Fallback Hop) | 🟢 Advanced (Chain Routing) | 🟢 Unlimited Custom Rules |
| **Dead-Letter Webhook Alerts** | ❌ | 🟢 Discord / Slack / LINE | 🟢 Discord / Slack / LINE |
| **Bulk Batch API (500/req)** | ❌ | 🟢 High-Throughput | 🟢 High-Throughput |
| **Commercial Proprietary Use** | Requires AGPLv3 compliance | 🟢 Commercial (Closed Source) | 🟢 Commercial + White-Label |

### 2. Offline Cryptographic Verification
- Commercial licenses are issued as JSON Web Tokens (JWT) signed via an **Ed25519 Private Key**.
- Thotsakan Mail Engine embeds only the **Ed25519 Public Key**, allowing completely offline, local cryptographic signature validation with **zero outbound pings** to licensing servers.
- **Graceful Fallback:** If a license expires or is missing, the engine smoothly downgrades to Community tier without crashing or dropping mail dispatch queues.

---

## 🛡️ Open Source Compliance & IP Safety

All dependencies and libraries utilized within Thotsakan Mail Engine have been thoroughly vetted for enterprise commercial safety and permissive licensing:

| Dependency Category | Packages / Libraries | License Type | Commercial Proprietary Rights |
| :--- | :--- | :---: | :---: |
| **Core Web Engine** | `hono` | **MIT** | 🟢 Permissive (Full Commercial Distribution) |
| **Validation & Schemas** | `zod`, `@hono/zod-validator` | **MIT** | 🟢 Permissive (Full Commercial Distribution) |
| **Cryptographic Security** | `jose` (Ed25519 / AES-GCM) | **Apache-2.0** | 🟢 Permissive (Full Commercial Distribution) |
| **Database & Runtime** | `bun:sqlite`, `bun` runtime | **MIT** | 🟢 Permissive (Full Commercial Distribution) |
| **Email Protocol & SMTP** | `nodemailer`, `smtp-server` | **MIT** | 🟢 Permissive (Full Commercial Distribution) |
| **IMAP Cleaner Engine** | `imapflow` | **MIT** | 🟢 Permissive (Full Commercial Distribution) |
| **Template Compilation** | `handlebars`, `mjml` | **MIT** | 🟢 Permissive (Full Commercial Distribution) |
| **Official Provider SDKs** | AWS SES, MSAL, Google APIs, Resend | **Apache-2.0 / MIT** | 🟢 Official Cloud Provider SDKs |

> 🔒 **Zero Copyleft Contamination:** None of the internal microservice libraries use copyleft licenses (GPL/LGPL). Organizations can safely deploy and distribute commercial extensions without IP risk.

---

<div align="center">
  Maintained with ❤️ by <a href="https://github.com/thabot">thabot</a> & the Open Source Community
</div>
