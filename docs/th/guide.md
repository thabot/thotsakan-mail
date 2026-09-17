# Thotsakan Mail Engine (ทศกัณฐ์) - คู่มือการใช้งานฉบับสมบูรณ์ (ภาษาไทย)

## 1. บทนำ (Introduction)
**Thotsakan Mail Engine** คือระบบกระจายและจัดการอีเมลธุรกรรม (Transactional Email Microservice) ประสิทธิภาพสูง พัฒนาบน Bun + Hono + SQLite WAL Mode ออกแบบมาเพื่อประหยัดต้นทุนค่าส่งอีเมลลงกว่า 90% ด้วยระบบกระจายโหลด 10 ทิศทาง (AWS SES, Microsoft 365, Gmail, Resend, Postmark, SendGrid, Brevo, Mailgun, ฯลฯ) พร้อมระบบ Smart Failover และคิวอัจฉริยะในตัว โดยใช้ทรัพยากรต่ำกว่า 40 MB RAM

---

## 2. เริ่มต้นเชื่อมต่อ AWS SES ภายใน 3 นาที (3-Minute AWS SES Setup)
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
   curl -X POST http://localhost:3000/v1/accounts \
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
   - เข้าหน้า Web Console ที่ `http://localhost:3000/console`
   - เลือกแถบ **"One-Click DNS Verify"** แล้วพิมพ์ชื่อโดเมนของคุณ
   - นำค่า SPF/DKIM CNAME ที่ระบบแสดงไปใส่ใน Cloudflare / ผู้ให้บริการ DNS ของคุณ

---

## 3. ตัวอย่างการส่งอีเมล (API Usage)

### 3.1 ส่งแบบ Asynchronous เข้าคิวความเร็วสูง (< 5ms)
```bash
curl -X POST http://localhost:3000/v1/emails/send \
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
curl -X POST http://localhost:3000/v1/emails/send \
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
curl -X POST http://localhost:3000/v1/emails/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "emails": [
      { "to": "user1@domain.com", "subject": "ประกาศฉบับที่ 1", "html": "เนื้อหา 1" },
      { "to": "user2@domain.com", "subject": "ประกาศฉบับที่ 2", "html": "เนื้อหา 2" }
    ]
  }'
```
