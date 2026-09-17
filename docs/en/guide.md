# Thotsakan Mail Engine - Complete Documentation (English)

## 1. Introduction
**Thotsakan Mail Engine** is a high-throughput, multi-provider transactional email microservice built on Bun, Hono, and SQLite WAL Mode. Designed to reduce enterprise email costs by over 90%, it seamlessly routes, priority-queues, and automatically fails over across 14 major cloud and SaaS email providers (AWS SES, Microsoft Graph/M365, Gmail, Resend, Postmark, SendGrid, Brevo, Mailgun, etc.) while maintaining a microscopic memory footprint under 40 MB RAM.

---

## 2. Quick AWS SES Setup in 3 Minutes
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
   curl -X POST http://localhost:3000/v1/accounts \
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
   - Open Web Console at `http://localhost:3000/console`
   - Switch to **"One-Click DNS Verify"** tab and verify your sender domain.
   - Copy SPF and DKIM tokens to Cloudflare or Route53.

---

## 3. API Dispatch Examples

### 3.1 Fast Asynchronous Enqueue (< 5ms)
```bash
curl -X POST http://localhost:3000/v1/emails/send \
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
curl -X POST http://localhost:3000/v1/emails/send \
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
