---
name: web-console-ui
description: >-
  Use this skill when modifying, testing, or debugging the Thotsakan Mail Engine Web Console dashboard, single-file HTML/JS UI, Swagger OpenAPI docs, tracking pixels, or provider setup guides.
---

# Web Console UI & Documentation Workflow

คู่มือการทำงานกับส่วนติดต่อผู้ใช้งาน Web Console Dashboard (`src/ui/console.html`), Interactive API Swagger Docs (`/docs`), Tracking Open/Click, และ Provider Setup Guides

## 1. กฎเหล็กของ UI/UX
- **ห้ามลบ ซ่อน หรือเปลี่ยนแปลง UI components, buttons, navigation tabs, หรือฟีเจอร์เดิมที่มีอยู่โดยไม่ได้รับคำสั่งที่ชัดเจน**
- รักษาความเท่าเทียมกันในการเข้าถึง (100% Parity & Accessibility) ระหว่าง Guest และ Logged-in User
- รองรับการแสดงผลทุกขนาดหน้าจอ (Responsive Mobile, Tablet, Desktop)

## 2. โครงสร้างส่วนประกอบ UI (Components Map)
- `src/ui/console.html`: Single-File SPA Dashboard (Dashboard Overview, Live Logs, Dispatch Playground, Accounts Manager, Routing Rules, Templates, Suppression List, DNS Check, และ Provider Setup Guides)
- `src/api/routes/docs.route.ts`: OpenAPI 3.0 Spec (`/openapi.json`) และ Swagger UI (`/docs`)
- `src/api/routes/tracking.route.ts`: 1x1 Transparent Open Pixel Tracking (`/t/open/:id`) และ Click Redirect Tracking (`/t/click/:id`)

## 3. ขั้นตอนการทดสอบและการตรวจสอบความถูกต้อง

1. **ทดสอบ UI Navigation & Provider Setup Guides:**
   ```bash
   bun test tests/unit/console-ui.test.ts
   ```

2. **ทดสอบ Phase 4 Web UI, Templates, Tracking & Webhooks:**
   ```bash
   bun test tests/integration/api-phase4.test.ts
   ```

3. **ทดสอบ Swagger Docs & OpenAPI Specification:**
   ```bash
   bun test tests/unit/api-docs.test.ts
   ```

4. **ตรวจสอบการทำงานของ Web Console สดใน Browser:**
   - เริ่มรันเซิร์ฟเวอร์: `bun run dev`
   - เปิดบราวเซอร์ที่: `http://localhost:9547` (Web Console) และ `http://localhost:9547/docs` (Swagger UI)
