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

### 3.3 Bulk Batch Dispatch (Up to 500 emails)
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

### 3.4 Dispatch with Template & Dynamic Variables
```bash
curl -X POST http://localhost:3000/v1/emails/send \
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
curl -X POST http://localhost:3000/v1/templates \
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
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/v1/templates

# Retrieve single template
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/v1/templates/invoice_receipt
```

### 4.3 Update Template (`PUT /v1/templates/:code`)
```bash
curl -X PUT http://localhost:3000/v1/templates/invoice_receipt \
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
curl -X POST http://localhost:3000/v1/templates/invoice_receipt/preview \
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
curl -X DELETE http://localhost:3000/v1/templates/invoice_receipt \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 5. Multi-Provider Accounts & Rate Limit Management

Thotsakan allows connecting **multiple sender accounts concurrently** across 14 providers. Each account enforces independent **per-minute rate limits** and **daily quota limits**, with seamless automatic failover.

### 5.1 Register Primary Account (e.g. AWS SES - 300/min, 50k/day)
```bash
curl -X POST http://localhost:3000/v1/accounts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "AWS SES Production",
    "providerType": "aws-ses",
    "fromEmail": "notifications@example.com",
    "fromName": "Production Alert",
    "rateLimitPerMinute": 300,
    "dailyQuotaLimit": 50000,
    "credentials": {
      "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
      "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "region": "us-east-1"
    }
  }'
```

### 5.2 Register Backup Account (e.g. Resend) with Failover Link
```bash
curl -X POST http://localhost:3000/v1/accounts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "Resend Standby",
    "providerType": "resend",
    "fromEmail": "notifications@example.com",
    "rateLimitPerMinute": 60,
    "dailyQuotaLimit": 10000,
    "credentials": {
      "apiKey": "re_123456789_abcdef"
    }
  }'
```

### 5.3 Inspect & Update Account Quotas (`PUT /v1/accounts/:id`)
```bash
# List all accounts
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/v1/accounts

# Update limits and link fallback account
curl -X PUT http://localhost:3000/v1/accounts/acc_123456 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "rateLimitPerMinute": 600,
    "dailyQuotaLimit": 100000,
    "fallbackAccountId": "acc_standby_789"
  }'
```

---

## 6. Real-Time Analytics, Queue Reports & Logs

Query transmission metrics, live backlog in the priority queue, failure counters, and granular transmission audit logs:

### 6.1 Aggregate Delivery Overview (`GET /v1/metrics/overview`)
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/v1/metrics/overview
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
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:3000/v1/emails/logs?status=FAILED&limit=20"

# Search dispatch history by recipient email
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:3000/v1/emails/logs?recipient=customer@domain.com"
```

### 6.3 Prometheus Scrape Endpoint (`GET /metrics/prometheus`)
```bash
curl http://localhost:3000/metrics/prometheus
```

---

## 7. Headless Control API (Complete Programmatic Management)

Every function available in the Web UI is 100% controllable programmatically via REST API:

### 7.1 Test Provider Connection (`POST /v1/accounts/:id/test`)
```bash
curl -X POST http://localhost:3000/v1/accounts/acc_1742440000_abc/test \
  -H "X-API-Key: YOUR_API_KEY"
```

### 7.2 Update Routing Rule (`PUT /v1/rules/:id`)
```bash
curl -X PUT http://localhost:3000/v1/rules/rule_1742440000_xyz \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "priority": 20,
    "isActive": true
  }'
```

### 7.3 Check Single Email Suppression (`GET /v1/suppression/check/:email`)
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/v1/suppression/check/customer@example.com
```

### 7.4 Re-queue All Failed Jobs (`POST /v1/queue/retry-failed`)
```bash
curl -X POST http://localhost:3000/v1/queue/retry-failed \
  -H "X-API-Key: YOUR_API_KEY"
```

### 7.5 Purge Dead-Letter Queue (`POST /v1/queue/purge-dead`)
```bash
curl -X POST http://localhost:3000/v1/queue/purge-dead \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 8. Run with Docker from GitHub Container Registry (GHCR)

Run Thotsakan Mail Engine instantly with one command:
```bash
docker run -d --name thotsakan \
  -p 3000:3000 \
  -p 2525:2525 \
  -v $(pwd)/data:/app/data \
  ghcr.io/thabot/thotsakan-mail:latest
```
Access the Web Management Console at `http://localhost:3000` and interactive Swagger docs at `http://localhost:3000/docs`.


