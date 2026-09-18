# Thotsakan Mail Engine (ทศกัณฐ์) - คู่มือการใช้งานฉบับสมบูรณ์ (ภาษาไทย)

## 1. บทนำ (Introduction)
**Thotsakan Mail Engine** คือระบบกระจายและจัดการอีเมลธุรกรรม (Transactional Email Microservice) ประสิทธิภาพสูง พัฒนาบน Bun + Hono + SQLite WAL Mode ออกแบบมาเพื่อประหยัดต้นทุนค่าส่งอีเมลลงกว่า 90% ด้วยระบบกระจายโหลด 10 ทิศทาง (AWS SES, Microsoft 365, Gmail, Resend, Postmark, SendGrid, Brevo, Mailgun, ฯลฯ) พร้อมระบบ Smart Failover และคิวอัจฉริยะในตัว โดยใช้ทรัพยากรต่ำกว่า 40 MB RAM

---

## 2. ตารางหมายเลข Port และหน้าที่การทำงาน (Network Ports & Roles)

Thotsakan Mail Engine แยกพอร์ตการทำงานออกเป็น 2 พอร์ตหลัก เพื่อความปลอดภัย ประสิทธิภาพ และรองรับสถาปัตยกรรมทั้งสมัยใหม่และระบบเดิม:

| พอร์ต (Port) | โพรโทคอล | ประเภทบริการ | หน้าที่และการทำงาน (Purpose & Capabilities) |
| :---: | :---: | :---: | :--- |
| **`9547`** | **HTTP / REST** | **Management & API Engine** | • **REST API Endpoint (`/v1/emails/send`, `/v1/emails/batch`):** สำหรับแอปพลิเคชันยุคใหม่ยิงส่งอีเมลผ่าน JSON Payload<br>• **Interactive Web Console (`/`):** หน้าแดชบอร์ดจัดการ Onboarding Wizard, จัดการ 10 Providers, Routing Rules และ Suppression List<br>• **Interactive Swagger Documentation (`/docs` & `/openapi.json`):** หน้าทดสอบและอ่าน API Spec ตามมาตรฐาน OpenAPI 3.0<br>• **DevOps & Monitoring (`/healthz`):** Endpoint เช็คสถานะ Container และ Database Connection สำหรับ Docker / K8s Health Check<br>• **Open & Click Tracking (`/v1/track/*`):** รับพิกเซลตรวจสอบการเปิดอ่านและลิงก์คลิกส่งต่อ<br>• **Webhook Ingestion (`/v1/webhooks/*`):** รับ Event Bounce/Complaint จากผู้ให้บริการคลาวด์ภายนอก |
| **`9548`** | **SMTP** | **Inbound SMTP Relay Bridge** | • **Local SMTP Server Bridge:** ทำหน้าที่เป็นตัวรับส่งอีเมลมาตรฐาน SMTP Protocol (RFC822 MIME)<br>• **Legacy & Third-Party System Integration:** สำหรับเชื่อมต่อโปรแกรมเดิมหรือเฟรมเวิร์กที่ไม่รองรับ HTTP API เช่น **WordPress, Laravel Mail, Django, ERP, CRM, Printers, Scanners**<br>• เพียงตั้งค่า Host: `localhost` (หรือ IP เซิร์ฟเวอร์) และ Port: `9548` พร้อมระบุ API Key เป็นรหัสผ่าน อีเมลจะถูกดึงเข้าสู่ระบบคิวอัจฉริยะของทศกัณฐ์และกระจายส่งต่ออัตโนมัติทันที |

---

## 3. เริ่มต้นเชื่อมต่อ AWS SES ภายใน 3 นาที (3-Minute AWS SES Setup)
1. **สร้าง IAM User บน AWS Console:**
   - ไปที่ AWS IAM -> Users -> Create User (เช่น `thotsakan-mailer`)
   - กำหนดสิทธิ์ Inline Policy ขั้นต่ำ:
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
   - สร้าง `Access Key` และ `Secret Access Key`
2. **สร้างบัญชีผู้ส่งใน Thotsakan ผ่าน API:**
   ```bash
   curl -X POST http://localhost:9547/v1/accounts \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{
       "name": "Primary AWS SES",
       "providerType": "aws-ses",
       "fromEmail": "noreply@yourdomain.com",
       "credentials": {
         "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
         "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
         "region": "ap-southeast-1"
       }
     }'
   ```
3. **ตรวจสอบ DNS และตั้งค่า DKIM/SPF:**
   - เข้าหน้า Web Console ที่ `http://localhost:9547/console`
   - เลือกแถบ **"One-Click DNS Verify"** แล้วพิมพ์ชื่อโดเมนของคุณ
   - นำค่า SPF/DKIM CNAME ที่ระบบแสดงไปใส่ใน Cloudflare / ผู้ให้บริการ DNS ของคุณ

---

## 3. ตัวอย่างการส่งอีเมล (API Usage)

### 3.1 ส่งแบบ Asynchronous เข้าคิวความเร็วสูง (< 5ms)
```bash
curl -X POST http://localhost:9547/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "user@example.com",
    "subject": "ยินดีต้อนรับสู่ระบบ",
    "html": "<h1>สวัสดีครับ</h1><p>ขอบคุณที่สมัครสมาชิก</p>",
    "priority": "normal",
    "async": true
  }'
```

### 3.2 ส่งแบบ Synchronous ส่งทันทีสำหรับรหัส OTP (High Priority)
```bash
curl -X POST http://localhost:9547/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "user@example.com",
    "subject": "รหัสยืนยัน OTP: 582910",
    "html": "<p>รหัสผ่านครั้งเดียวของคุณคือ <b>582910</b> (หมดอายุใน 5 นาที)</p>",
    "priority": "high",
    "async": false
  }'
```

### 3.3 ส่งแบบ Batch สูงสุด 500 ฉบับพร้อมกัน
```bash
curl -X POST http://localhost:9547/v1/emails/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "emails": [
      { "to": "user1@domain.com", "subject": "ประกาศฉบับที่ 1", "html": "เนื้อหา 1" },
      { "to": "user2@domain.com", "subject": "ประกาศฉบับที่ 2", "html": "เนื้อหา 2" }
    ]
  }'
```

### 3.4 ส่งอีเมลโดยระบุ Template (Dynamic Variables)
ส่งอีเมลโดยระบุรหัสเทมเพลต `templateCode` และตัวแปรใน `templateData`:
```bash
curl -X POST http://localhost:9547/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "to": "somchai@example.com",
    "templateCode": "welcome_member",
    "templateData": {
      "name": "คุณสมชาย",
      "verifyUrl": "https://example.com/verify?token=xyz123"
    },
    "priority": "normal",
    "async": true
  }'
```

---

## 4. ระบบจัดการ Email Template (CRUD & MJML)

### 4.1 สร้าง Template ใหม่ (`POST /v1/templates`)
```bash
curl -X POST http://localhost:9547/v1/templates \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "code": "welcome_member",
    "name": "เทมเพลตต้อนรับสมาชิกใหม่",
    "subjectTemplate": "ยินดีต้อนรับคุณ {{name}} สู่ระบบ",
    "htmlContent": "<h1>สวัสดีครับ {{name}}</h1><p>กรุณากดยืนยันตัวตน: <a href=\"{{verifyUrl}}\">คลิกที่นี่</a></p>",
    "mjmlContent": "<mjml><mj-body><mj-section><mj-column><mj-text>สวัสดี {{name}}</mj-text></mj-column></mj-section></mj-body></mjml>"
  }'
```

### 4.2 เรียกดูรายการ Template ทั้งหมดหรือรายตัว (`GET /v1/templates`)
```bash
# รายการทั้งหมด
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/templates

# รายการเฉพาะรหัส
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/templates/welcome_member
```

### 4.3 แก้ไข Template (`PUT /v1/templates/:code`)
```bash
curl -X PUT http://localhost:9547/v1/templates/welcome_member \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "เทมเพลตต้อนรับสมาชิก (ปรับปรุงข้อความ)",
    "subjectTemplate": "ยินดีต้อนรับคุณ {{name}} สู่ครอบครัวของเรา",
    "htmlContent": "<h1>ยินดีต้อนรับ {{name}}!</h1><p>ลิงก์ยืนยัน: <a href=\"{{verifyUrl}}\">ยืนยันอีเมล</a></p>"
  }'
```

### 4.4 ทดสอบเรนเดอร์ Template (Preview Data)
```bash
curl -X POST http://localhost:9547/v1/templates/welcome_member/preview \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "data": {
      "name": "สมชาย",
      "verifyUrl": "https://example.com/verify?token=12345"
    }
  }'
```

### 4.5 ลบ Template (`DELETE /v1/templates/:code`)
```bash
curl -X DELETE http://localhost:9547/v1/templates/welcome_member \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 5. การตั้งค่าบัญชีผู้ส่งหลายค่าย และจำกัดโควตา (Multi-Provider Accounts & Rate Limiting)

ระบบ Thotsakan รองรับการเชื่อมต่อ **บัญชีผู้ส่งพร้อมกันหลายบัญชี** สามารถแยกค่าย (AWS SES, Microsoft 365, Gmail, Resend, Generic SMTP) และกำหนด **เพดานต่อนาที (Rate Limit Per Minute)** และ **โควตาสูงสุดต่อวัน (Daily Quota Limit)** พร้อมเชื่อมต่อระบบ Failover สำรองอัตโนมัติ

### 5.1 เชื่อมต่อบัญชีหลัก (เช่น AWS SES - สูงสุด 300 ฉบับ/นาที, 50,000 ฉบับ/วัน)
```bash
curl -X POST http://localhost:9547/v1/accounts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "AWS SES เมนหลัก",
    "providerType": "aws-ses",
    "fromEmail": "noreply@company.com",
    "fromName": "Company System",
    "rateLimitPerMinute": 300,
    "dailyQuotaLimit": 50000,
    "credentials": {
      "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
      "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "region": "ap-southeast-1"
    }
  }'
```

### 5.2 เชื่อมต่อบัญชีสำรอง (เช่น Resend หรือ M365) พร้อมผูกเป็น Fallback
```bash
curl -X POST http://localhost:9547/v1/accounts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "Resend บัญชีสำรอง",
    "providerType": "resend",
    "fromEmail": "noreply@company.com",
    "rateLimitPerMinute": 60,
    "dailyQuotaLimit": 10000,
    "credentials": {
      "apiKey": "re_123456789_abcdef"
    }
  }'
```

### 5.3 ดูรายการและอัปเดตโควตาเพดานการส่ง (`PUT /v1/accounts/:id`)
```bash
# เรียกดูบัญชีทั้งหมด
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/accounts

# ปรับเพดานส่งเป็น 600 ฉบับ/นาที และ 100,000 ฉบับ/วัน
curl -X PUT http://localhost:9547/v1/accounts/acc_123456 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "rateLimitPerMinute": 600,
    "dailyQuotaLimit": 100000,
    "fallbackAccountId": "acc_backup_789"
  }'
```

---

## 6. การตรวจสอบสถิติ รายงานผล และคิวค้าง (Real-Time Metrics & Reports)

ระบบมี API สำหรับตรวจสอบประสิทธิภาพแบบ Real-time เช็คได้ทั้งจำนวนที่ส่งสำเร็จ, เมลที่ค้างในคิว, เมลที่ล้มเหลว และการดึง Log ย้อนหลัง:

### 6.1 สรุปภาพรวมการส่งทั้งหมด (`GET /v1/metrics/overview`)
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/metrics/overview
```
**ตัวอย่างผลลัพธ์ (JSON Response):**
```json
{
  "ok": true,
  "metrics": {
    "total": 54200,
    "sent": 53950,
    "pending": 30,
    "processing": 10,
    "failed": 25,
    "suppressed": 185
  }
}
```
- `total`: ยอดรวมคำขอส่งอีเมลทั้งหมด
- `sent`: ส่งสำเร็จแล้ว
- `pending`: ค้างอยู่ในคิวรอการส่ง (Priority Queue)
- `processing`: กำลังประมวลผลการส่ง ณ วินาทีนั้น
- `failed`: ส่งไม่สำเร็จ (เกินจำนวน Retry และแจ้งเตือนเข้า Dead-Letter)
- `suppressed`: ถูกระงับไม่ส่งเนื่องจากติด Suppression List (เคย Hard Bounce หรือ SPAM)

### 6.2 ตรวจสอบประวัติ Log การส่งแยกตามสถานะ (`GET /v1/emails/logs`)
```bash
# ดูรายการเมลที่ส่งไม่สำเร็จ 20 ฉบับล่าสุด
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:9547/v1/emails/logs?status=FAILED&limit=20"

# ค้นหาประวัติการส่งตามอีเมลปลายทาง
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:9547/v1/emails/logs?recipient=customer@domain.com"
```

### 6.3 ดึง Metrics ไปยัง Grafana / Prometheus (`GET /metrics/prometheus`)
```bash
curl http://localhost:9547/metrics/prometheus
```

---

## 7. Headless Control API (คู่มือควบคุม Engine ครบ 100%)

ทุกฟังก์ชันที่ทำได้บนหน้า Web UI สามารถสั่งการแบบอัตโนมัติผ่าน REST API ได้ 100%:

### 7.1 ทดสอบการเชื่อมต่อบัญชีผู้ส่ง (`POST /v1/accounts/:id/test`)
```bash
curl -X POST http://localhost:9547/v1/accounts/acc_1742440000_abc/test \
  -H "X-API-Key: YOUR_API_KEY"
```

### 7.2 แก้ไขกฎ Dynamic Routing (`PUT /v1/rules/:id`)
```bash
curl -X PUT http://localhost:9547/v1/rules/rule_1742440000_xyz \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "priority": 20,
    "isActive": true
  }'
```

### 7.3 ตรวจสอบสถานะการบล็อกอีเมลเดี่ยว (`GET /v1/suppression/check/:email`)
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:9547/v1/suppression/check/customer@example.com
```

### 7.4 สั่ง Re-queue อีเมลที่ล้มเหลวเพื่อส่งใหม่ทั้งหมด (`POST /v1/queue/retry-failed`)
```bash
curl -X POST http://localhost:9547/v1/queue/retry-failed \
  -H "X-API-Key: YOUR_API_KEY"
```

### 7.5 สั่งล้างคิวอีเมลที่ตายถาวร (`POST /v1/queue/purge-dead`)
```bash
curl -X POST http://localhost:9547/v1/queue/purge-dead \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 9. การรันด้วย Docker Image จาก GitHub Container Registry (GHCR)

สามารถรัน Thotsakan ได้ทันทีด้วยคำสั่งบรรทัดเดียว:
```bash
docker run -d --name thotsakan \
  -p 9547:9547 \
  -p 9548:9548 \
  -v $(pwd)/data:/app/data \
  ghcr.io/thabot/thotsakan-mail:latest
```
เมื่อรันเสร็จ เปิดหน้าเว็บคอนโซลได้ที่ `http://localhost:9547` และเปิดดูเอกสาร Interactive Swagger ได้ที่ `http://localhost:9547/docs`
