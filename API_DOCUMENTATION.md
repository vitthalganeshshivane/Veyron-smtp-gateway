# Veyron SMTP Gateway — API Documentation

## Overview & Base URL
The Veyron SMTP Gateway provides versioned REST APIs under `/api/v1`.

- **Production Base URL:** `https://api.yourdomain.com/api/v1`
- **Local Development:** `http://localhost:3000/api/v1`

---

## Authentication Modes

Veyron enforces two distinct authentication paradigms:

### 1. Project API Key (Client Applications)
Used by external applications (e.g. Render/Vercel services like Vexillar, TARS CRM) to queue emails.
```http
Authorization: Bearer vsg_live_a1b2c3d4e5f6_0123456789abcdef...
```
- API keys are generated via the Admin Dashboard.
- Keys are cryptographically hashed using **SHA-256** at rest.
- Projects are isolated: a project key can only query its own emails and utilize SMTP accounts explicitly assigned or unassigned.

### 2. Admin JWT Token (Dashboard & Management)
Used by the Admin Dashboard to manage projects, SMTP accounts, queue metrics, and system telemetry.
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Content Preservation Guarantee
Veyron acts as a pure SMTP relay. The gateway **does not**:
- Sanitize or alter HTML markup, CSS, or inline styles.
- Inject headers or tracking pixels.
- Re-wrap subject lines or plain text alternatives.
- Re-encode binary attachments unless required by standard RFC MIME encoding.

### Dynamic On-The-Fly SMTP Mode (Environment-Agnostic)
Applications can pass their own SMTP credentials directly in the **request body** (under the `smtp` key) OR via **request headers** (`X-SMTP-Host`, `X-SMTP-Port`, `X-SMTP-User`, `X-SMTP-Pass`, `X-SMTP-Secure`).

When provided, the gateway creates a temporary, on-the-fly Nodemailer transport for the job. You do **not** need to register any SMTP account in the dashboard!

Furthermore:
- Passwords sent on-the-fly are **encrypted using AES-256-GCM** before being enqueued in Redis. Plaintext credentials are **never stored** in Redis or logged in files.
- The worker decrypts the password in memory at delivery time.

#### Example A: Dynamic SMTP in Request Body
```json
{
  "smtp": {
    "host": "smtp.hostinger.com",
    "port": 465,
    "secure": true,
    "auth": {
      "user": "billing@mycompany.com",
      "pass": "MySmtpPassword123"
    }
  },
  "from": {
    "name": "Billing Team",
    "address": "billing@mycompany.com"
  },
  "to": ["customer@example.com"],
  "subject": "Your Order Confirmation #5581",
  "html": "<h1>Order Confirmed!</h1><p>Your item is on its way.</p>"
}
```

#### Example B: Dynamic SMTP via Headers
```http
POST /api/v1/emails/send HTTP/1.1
Authorization: Bearer <PROJECT_API_KEY>
Content-Type: application/json
X-SMTP-Host: smtp.gmail.com
X-SMTP-Port: 587
X-SMTP-User: user@gmail.com
X-SMTP-Pass: your-google-app-password
X-SMTP-Secure: false

{
  "to": ["customer@example.com"],
  "subject": "Email via Google SMTP headers",
  "html": "<p>Delivered using credentials supplied directly in HTTP headers!</p>"
}
```

---

## User Onboarding & Admin Approval Workflow

1. **User Sign Up (`POST /api/v1/auth/register`):**  
   Any user can sign up with their name, email, password, and company. The account is created with `status: "pending"`.
2. **Admin Review (`GET /api/v1/users?status=pending`):**  
   Administrators view pending applicants in the **User Approvals** dashboard.
3. **Approval & Key Issuance (`POST /api/v1/users/:id/approve`):**  
   The administrator approves the applicant, sets daily/monthly quota limits, and issues an active API key (`vsg_live_...`).
4. **Developer Portal:**  
   When the approved user logs in, they unlock their **Personal API Key**, quota dashboard, and dynamic integration code snippets.
5. **Relay Execution:**  
   The user uses their API key with their own dynamic SMTP credentials to send outbound emails!

---

### 1. Send Single Email
Enqueues an email for asynchronous delivery through the configured SMTP provider.

- **Method:** `POST`
- **Path:** `/emails/send`
- **Auth:** `Authorization: Bearer <PROJECT_API_KEY>`
- **Optional Header:** `Idempotency-Key: <unique-string>` (avoids duplicate dispatch on network retries)

#### Request Body
```json
{
  "from": {
    "name": "TARS Support",
    "address": "support@example.com"
  },
  "to": ["customer@example.com"],
  "cc": ["manager@example.com"],
  "bcc": [],
  "subject": "Your Monthly Invoice #1042",
  "html": "<!DOCTYPE html><html><body><h1 style='color: #0d9488;'>Invoice #1042</h1><p>Thank you for your business!</p></body></html>",
  "text": "Invoice #1042. Thank you for your business!",
  "replyTo": "billing@example.com",
  "attachments": [
    {
      "filename": "invoice_1042.pdf",
      "content": "JVBERi0xLjQKJcOkw7zDtsOfCDCm...base64...",
      "encoding": "base64",
      "contentType": "application/pdf"
    }
  ],
  "headers": {
    "X-Entity-Ref-ID": "inv_1042"
  },
  "metadata": {
    "invoiceId": "1042",
    "customerId": "cust_99"
  }
}
```

#### Raw MIME RFC 822 Mode
For applications with an already constructed raw MIME buffer:
```json
{
  "to": ["customer@example.com"],
  "subject": "Pre-Rendered MIME Message",
  "rawMime": "MIME-Version: 1.0\r\nFrom: sender@example.com\r\nTo: customer@example.com\r\nSubject: Pre-Rendered\r\n\r\nHello World"
}
```

#### Response (`HTTP 202 Accepted`)
```json
{
  "success": true,
  "jobId": "vms_82fa912c9b4e",
  "status": "queued",
  "message": "Email accepted for processing"
}
```

---

### 2. Send Bulk Emails
Queue up to 50 emails in a single batch request.

- **Method:** `POST`
- **Path:** `/emails/bulk`
- **Auth:** `Authorization: Bearer <PROJECT_API_KEY>`

#### Request Body
```json
{
  "emails": [
    {
      "to": ["user1@example.com"],
      "subject": "Notification 1",
      "text": "Hello User 1"
    },
    {
      "to": ["user2@example.com"],
      "subject": "Notification 2",
      "text": "Hello User 2"
    }
  ]
}
```

#### Response (`HTTP 202 Accepted`)
```json
{
  "success": true,
  "summary": {
    "total": 2,
    "queued": 2,
    "failed": 0
  },
  "results": [
    { "success": true, "jobId": "vms_32ad81b", "status": "queued" },
    { "success": true, "jobId": "vms_99fe12c", "status": "queued" }
  ]
}
```

---

### 3. Query Email Transaction Log
Retrieve paginated transaction records.

- **Method:** `GET`
- **Path:** `/emails?page=1&limit=20&status=sent&search=customer@example.com`
- **Auth:** Bearer Token (Admin JWT or Project API Key)

#### Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1,
  "logs": [
    {
      "jobId": "vms_82fa912c9b4e",
      "projectName": "Vexillar",
      "smtpAccountName": "Hostinger Primary",
      "recipients": ["customer@example.com"],
      "subject": "Your Monthly Invoice #1042",
      "status": "sent",
      "attempts": 1,
      "messageId": "<c28a-784f@smtp.hostinger.com>",
      "smtpResponse": {
        "response": "250 2.0.0 Ok: queued as 4S9H9V31",
        "accepted": ["customer@example.com"],
        "rejected": []
      },
      "queuedAt": "2026-11-16T18:00:00.000Z",
      "sentAt": "2026-11-16T18:00:02.120Z"
    }
  ]
}
```

---

### 4. Retry Failed Email
Re-queues a failed email for delivery attempt.

- **Method:** `POST`
- **Path:** `/emails/:jobId/retry`
- **Auth:** Bearer Token (Admin JWT or Project API Key)

#### Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Email vms_82fa912c9b4e successfully re-queued for delivery"
}
```

---

### 5. Health Check
Public telemetry endpoint for uptime monitoring and Docker health checks.

- **Method:** `GET`
- **Path:** `/health` or `/api/v1/health`
- **Auth:** Public

#### Response (`HTTP 200 OK`)
```json
{
  "status": "healthy",
  "service": "veyron-smtp-gateway",
  "timestamp": "2026-11-16T18:30:00.000Z",
  "uptime": 1420,
  "database": "connected",
  "redis": "connected"
}
```

---

## HTTP Status Codes Reference

| Code | Meaning | Context |
| :--- | :--- | :--- |
| **200 OK** | Success | Query requests, password changes, connection tests |
| **201 Created** | Resource Created | Project or SMTP account successfully registered |
| **202 Accepted** | Email Queued | Email accepted into BullMQ queue (not yet sent) |
| **400 Bad Request** | Validation Failure | Missing fields, invalid email format, no content provided |
| **401 Unauthorized** | Auth Failure | Missing, invalid, or expired API Key or JWT |
| **403 Forbidden** | Authorization Block | Project disabled, or sender address not permitted |
| **429 Too Many Requests** | Limit Exceeded | Daily/monthly project quota or per-minute rate limit hit |
| **503 Service Degraded** | Resource Unavailable | Redis or MongoDB connection down, or no eligible SMTP account |
