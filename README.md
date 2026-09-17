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

## 📜 Dual License Model

Thotsakan Mail Engine is distributed under a Dual License model:
1. **Community Edition (AGPLv3):** 100% free and open-source for personal projects, independent developers, and open-source software under AGPLv3 terms.
2. **Commercial Edition (Pro / Enterprise):** Tailored for commercial proprietary applications that cannot comply with AGPLv3 copyleft terms. Unlocks full Web Console access, unlimited tenants/accounts, and priority support. Available via Lemon Squeezy.

---

<div align="center">
  Maintained with ❤️ by <a href="https://github.com/thabot">thabot</a> & the Open Source Community
</div>
