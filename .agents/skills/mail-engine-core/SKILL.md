---
name: mail-engine-core
description: >-
  Use this skill when developing, testing, debugging, or extending the Thotsakan Mail Engine core dispatching pipeline, 14 email provider adapters, SQLite WAL priority queue, sentbox cleaner, background workers, or inbound SMTP relay.
---

# Mail Engine Core & Multi-Provider Dispatcher Workflow

คู่มือการทำงานกับสถาปัตยกรรมหลักของ Thotsakan Mail Engine (`src/`) ครอบคลุมการส่งอีเมลผ่าน 14 ผู้ให้บริการ, คิว SQLite WAL พร้อมระบบ Priority, Inbound SMTP Relay และ Worker เบื้องหลัง

## 1. โครงสร้างระบบหลัก (Architecture Map)
- `src/providers/`: อะแดปเตอร์เชื่อมต่อ 14 Email Providers (AWS SES, Microsoft Graph, Gmail, Resend, Postmark, SendGrid, Brevo, Mailgun, Scaleway, MailerSend, ZeptoMail, SparkPost, Mandrill, Generic SMTP)
- `src/core/`: ระบบ Dispatcher, Rate Limiting, Circuit Breakers, Smart Failover, และ Retry Policy
- `src/database/`: SQLite WAL Database Schema, Migrations, Encryption (AES-256-GCM), และ Repositories
- `src/smtp/`: Inbound SMTP Relay Server (พอร์ต 9548) สำหรับรับอีเมลจาก WordPress/Laravel และส่งต่อเข้าคิว
- `src/workers/`: Background Workers ได้แก่:
  - `dispatcher.worker.ts`: ดึงงานจากคิวตาม Priority และส่งผ่าน Provider
  - `cleaner.worker.ts`: ลบ OTP และรหัสลับออกจาก Sentbox (M365/Gmail) อัตโนมัติ
  - `telemetry.worker.ts`: รายงาน Metrics สุขภาพระบบและตรวจสอบสถานะ License
  - `backup.worker.ts`: Hot backup SQLite ฐานข้อมูลด้วย `VACUUM INTO`

## 2. ขั้นตอนการพัฒนาและทดสอบ (Development & Testing)

1. **รัน Development Server ในเครื่อง:**
   ```bash
   bun run dev
   ```

2. **ทดสอบ Provider Adapters ทั้ง 14 ตัว:**
   ```bash
   bun test tests/unit/providers
   bun test tests/unit/providers/providers-dispatch.test.ts
   ```

3. **ทดสอบ Inbound SMTP Relay Server:**
   ```bash
   bun test tests/unit/smtp-relay.test.ts
   ```

4. **ทดสอบ Background Workers:**
   ```bash
   bun test tests/unit/workers
   ```

5. **ทดสอบ API Endpoints & Multi-Node Cluster:**
   ```bash
   bun test tests/integration/api-emails.test.ts
   bun test tests/unit/cluster-coordinator.test.ts
   ```

6. **ตรวจสอบ Hardware Fingerprint CLI:**
   ```bash
   bun run license:fingerprint
   ```

## 3. ข้อควรระวังและการจัดการ Sensitive Data
- ต้องเข้ารหัส Credentials และ API Keys ด้วย `ENCRYPTION_KEY` (AES-256-GCM) เสมอ
- ห้ามบันทึกข้อมูล PII หรือเนื้อหาอีเมลที่เป็นความลับลงใน Logs ที่ไม่มีการเข้ารหัส
- ตรวจสอบ Rate Limit และ Quota ก่อนส่งงานให้ Provider เสมอ
