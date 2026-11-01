---
name: quality-gate-and-deploy
description: >-
  Use this skill to execute the mandatory quality gate (TypeScript typechecking, Bun unit & integration tests) and deploy updates by committing and pushing to both uat and main branches for Thotsakan Mail Engine.
---

# Quality Gate & Dual-Branch Deployment Workflow

คู่มือและขั้นตอนการตรวจสอบคุณภาพระบบ (Quality Gate) และ Deploy ไปยังสภาพแวดล้อม UAT และ Production ผ่าน Git Dual-Branch (`uat` และ `main`) สำหรับ Thotsakan Mail Engine

## 1. ข้อกำหนดและเงื่อนไข (Requirements)
- ต้องรันการตรวจสอบ TypeScript Typecheck ผ่าน 100% ปราศจากข้อผิดพลาด (`tsc --noEmit`)
- ต้องรันชุดทดสอบ Automated Test ทั้งหมดผ่าน 100% (ทั้ง Unit Tests และ Integration Tests)
- ห้ามลบ ซ่อน หรือเปลี่ยนแปลง UI components หรือฟีเจอร์เดิมที่มีอยู่โดยไม่ได้รับคำสั่ง
- รักษาความเท่าเทียมในการเข้าถึง (Parity & Accessibility) ระหว่าง Guest และ Logged-in user
- เมื่อผ่านครบทุกขั้นตอน ให้ commit และ push ไปยังทั้งสาขา `uat` และ `main`

## 2. ขั้นตอนการตรวจสอบ (Quality Gate Verification)

1. **TypeScript Type Verification:**
   ```bash
   bun run typecheck
   ```

2. **Automated Unit & Integration Tests (154+ tests):**
   ```bash
   bun test
   ```

3. **รันการทดสอบเฉพาะจุด (เมื่อแก้ไขเฉพาะส่วน):**
   - ทดสอบ Provider Adapters:
     ```bash
     bun test tests/unit/providers
     ```
   - ทดสอบ Queue & Workers:
     ```bash
     bun test tests/unit/workers
     ```
   - ทดสอบ Web Console UI:
     ```bash
     bun test tests/unit/console-ui.test.ts
     ```

## 3. ขั้นตอนการ Deploy สู่ UAT และ Production (Git Dual-Push)

เมื่อผ่านการทดสอบ 100% แล้ว ดำเนินการ Commit และ Push ไปยังทั้งสองสาขา:

1. ตรวจสอบสถานะการเปลี่ยนแปลง:
   ```bash
   git status
   ```

2. Commit การเปลี่ยนแปลงในสาขาปัจจุบัน:
   ```bash
   git add .
   git commit -m "feat/fix/docs: <รายละเอียดการเปลี่ยนแปลง>"
   ```

3. Push ไปยัง `uat`:
   ```bash
   git push origin uat
   ```

4. ซิงก์หรือรวมโค้ดไปยัง `main` และ Push:
   ```bash
   git checkout main
   git merge uat --ff-only
   git push origin main
   git checkout uat
   ```

5. ตรวจสอบสถานะ CI/CD Pipeline และ Service Container ให้ทำงานได้ตามปกติ
