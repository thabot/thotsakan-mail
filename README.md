# 👺 Thotsakan Mail Engine (ทศกัณฐ์)

<div align="center">
  <h3>The 10-Headed Multi-Provider Transactional Email Dispatcher Microservice</h3>
  <p>Ultra-lightweight (< 40 MB RAM), 5ms Response Time, Priority Queue, Smart Failover, and Inbound SMTP Relay on Bun + Hono + SQLite WAL.</p>

  [![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
  [![Commercial License: Available](https://img.shields.io/badge/Commercial%20License-Lemon%20Squeezy-purple.svg)](#dual-license-model)
  [![Runtime: Bun](https://img.shields.io/badge/Runtime-Bun%201.4+-f472b6.svg)](https://bun.sh)
  [![Framework: Hono](https://img.shields.io/badge/Framework-Hono%20v4-e11d48.svg)](https://hono.dev)
  [![Tests: 100% Passed](https://img.shields.io/badge/Tests-106%20Passed-emerald.svg)](#testing)
</div>

---

## ⚡️ Key Value Propositions (ทำไมต้องทศกัณฐ์?)

- 💸 **ประหยัดค่าส่งอีเมลลงกว่า 90%:** สลับการส่งอีเมลปริมาณมากไปที่ **AWS SES (\$0.10 ต่อ 10,000 ฉบับ)** เป็นช่องทางหลัก แทนที่จะจ่ายแพงให้ SaaS เจ้าเดิม
- 🔄 **Smart Failover ครบ 14 ค่าย:** สลับอัตโนมัติเมื่อเจอปัญหา 429 Rate Limit หรือ Provider ล่ม (AWS SES, Microsoft 365, Google Workspace/Gmail, Resend, Postmark, SendGrid, Brevo, Mailgun, Scaleway, MailerSend, ZeptoMail, SparkPost, Mandrill, On-Premises SMTP)
- 🧹 **Sentbox Cleaner ในตัว:** สำหรับ Microsoft 365 และ Gmail ระบบสั่งลบอีเมลออกจากกล่อง Sent Items อัตโนมัติ ป้องกันกล่องจดหมายเต็มและรักษาความลับ OTP
- 🚀 **Priority Queue ในตัว:** รหัส OTP (High Priority) แซงคิวเมลแจ้งเตือนทั่วไปได้ทันที โดยไม่ต้องตั้งค่า Redis
- 📬 **Inbound SMTP Relay:** ทำหน้าที่เป็น SMTP Server (พอร์ต 587 / 2525) ให้ WordPress, Laravel, ERP ชี้มาแล้วได้ระบบ Queue + Failover ไปยัง SES ทันทีโดยไม่ต้องแก้โค้ด
- 🖥️ **Web Console & Quick Send:** หน้าเว็บแดชบอร์ด Single-File SPA (< 1MB) ในตัว มีระบบตรวจเช็ก DNS (SPF, DKIM, DMARC) ในคลิกเดียว
- 🔒 **Zero-Downtime SQLite Backup:** ระบบ Hot Backup ในตัวด้วย `VACUUM INTO` ไม่บล็อกการส่งอีเมล พร้อมหมุนเวียนเก็บ 7 วันล่าสุด

---

## 🚀 Quick Start (เริ่มต้นใช้งานใน 1 นาที)

### 1. ติดตั้งและเริ่มรันผ่าน Docker
```bash
docker compose up -d
```
เปิดบราวเซอร์ไปที่ `http://localhost:3000/console` เพื่อเข้าสู่ Web Console

### 2. หรือรันผ่าน Bun โดยตรง
```bash
# Clone repository
git clone https://github.com/bothanom/thotsakan-mail.git
cd thotsakan-mail

# ติดตั้ง Dependencies
bun install

# คัดลอก Environment File
cp .env.example .env

# รันระบบ Development
bun run dev
```

---

## 📚 เอกสารคู่มือการใช้งาน (Documentation)

- 🇹🇭 **[คู่มือภาษาไทย (Thai Guide)](docs/th/guide.md)** - วิธีติดตั้ง, เชื่อมต่อ AWS SES ใน 3 นาที, และการใช้งาน Web Console
- 🇬🇧 **[English Documentation](docs/en/guide.md)** - Full Installation Guide, 3-Minute AWS SES setup, and Architecture
- 🇨🇳 **[中文使用手册 (Chinese Documentation)](docs/cn/guide.md)** - 系统架构, 3分钟接入AWS SES, 及控制台使用指南
- 💻 **[Client SDK Snippets (7 Languages)](docs/sdk/sdks.md)** - โค้ดตัวอย่างสำหรับ C#/.NET 8, Java 17+, TypeScript/Node.js, Python, PHP/Laravel, Go, และ cURL

---

## 🧪 Testing

ชุดทดสอบครอบคลุมทั้ง Unit Test และ Integration Test ทั้งหมด 27 Test Files รันผ่าน 100%:

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

Thotsakan Mail Engine ใช้โมเดลสิทธิ์การใช้งานแบบคู่:
1. **Community Edition (AGPLv3):** ฟรี 100% สำหรับการศึกษา, นักพัฒนาอิสระ, และโปรเจกต์ Open-Source ภายใต้เงื่อนไข AGPLv3
2. **Commercial Edition (Pro / Enterprise):** สำหรับการใช้งานเชิงพาณิชย์ที่ไม่ต้องการเปิดเผยซอร์สโค้ดตามสัญญา AGPLv3 พร้อมฟีเจอร์ระดับองค์กร (Web Console เต็มรูปแบบ, Unlimited Tenants/Accounts, Priority Support) สั่งซื้อและรับ License Key ผ่าน Lemon Squeezy

---

<div align="center">
  Made with ❤️ by bothanom & the Open Source Community
</div>
