<div align="center">

# ⚡ VEYRON SMTP GATEWAY
### Enterprise-Grade, High-Throughput Outbound Email Relay & Queue Engine

[![Node.js Version](https://img.shields.io/badge/Node.js-22%20LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![BullMQ](https://img.shields.io/badge/Queue-BullMQ%20%2B%20Redis%207-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://bullmq.io/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)](#)

<p align="center">
  <b>Bypass cloud outbound port blocks (Render, Vercel, Railway, AWS Lambda).</b><br>
  Deliver millions of transactional emails reliably using your existing business SMTP accounts (Hostinger, Google Workspace, AWS SES, or private MTAs) without expensive SaaS subscription fees.
</p>

[Explore Features](#-product-overview--key-capabilities) • [Option 1: Use Hosted Service](#-option-1-use-the-hosted-gateway-recommended) • [Option 2: Self-Host](#-option-2-self-host-with-docker-compose) • [API Reference](#-api-quick-reference)

</div>

---

## 🎯 Why Veyron SMTP Gateway?

Modern cloud platforms (**Render, Vercel, Railway, Fly.io, Cloudflare Workers**) impose strict blocks or rate-limits on outbound SMTP traffic (`ports 25, 465, 587`) for free and serverless tiers. This forces developers into paying steep monthly fees for proprietary transactional email providers ($35–$100+/month for SendGrid, Resend, or Postmark), even when they already pay for business email mailboxes with generous outbound SMTP quotas (such as Hostinger, Google Workspace, Microsoft 365, or Zoho).

**Veyron bridges this gap.** It acts as an authenticated, high-performance HTTP-to-SMTP intermediary:
- Your apps dispatch transactional emails via standard, authenticated **HTTPS POST requests**.
- Veyron validates authorization, enforces quotas and rate limits, enqueues the delivery job into **Redis 7 + BullMQ**, and dispatches the email reliably through real SMTP accounts.

```mermaid
flowchart LR
    subgraph Clients["Your Applications (Serverless / Cloud)"]
        A1["Render Web App"]
        A2["Vercel Frontend / Next.js"]
        A3["Mobile App Backend"]
    end

    subgraph Gateway["Veyron SMTP Gateway (Oracle VM / Docker)"]
        API["mail-api (Express REST API)"]
        Queue[("mail-redis (Redis 7 + BullMQ)")]
        Worker["mail-worker (Nodemailer Pool)"]
        DB[("MongoDB Atlas (Logs & Quotas)")]

        API -->|"Enqueue Job"| Queue
        Queue -->|"Fetch & Retry"| Worker
        API -.->|"Audit & Quotas"| DB
        Worker -.->|"Delivery Status"| DB
    end

    subgraph Providers["Upstream SMTP Relays"]
        P1["Hostinger SMTP"]
        P2["Google Workspace"]
        P3["Custom MTA / Postfix"]
    end

    subgraph Recipients["Target Recipients"]
        R1["Gmail / Outlook / Corporate"]
    end

    Clients -->|"HTTPS POST /send"| API
    Worker -->|"SSL / TLS (Port 465 / 587)"| Providers
    Providers -->|"MTA Delivery"| Recipients

    style Gateway fill:#0f172a,stroke:#2dd4bf,stroke-width:2px,color:#f8fafc
    style Clients fill:#1e293b,stroke:#94a3b8,stroke-width:1px,color:#f8fafc
    style Providers fill:#1e293b,stroke:#f59e0b,stroke-width:1px,color:#f8fafc
    style Recipients fill:#1e293b,stroke:#10b981,stroke-width:1px,color:#f8fafc
```

---

## ✨ Product Overview & Key Capabilities

| Capability | Feature Description |
| :--- | :--- |
| **Zero Content Modification** | Raw MIME, HTML, inline CSS, multipart messages, custom headers, and attachments are delivered byte-for-byte with strict preservation. No vendor template hijacking. |
| **High-Resilience Queue Engine** | Powered by **Redis 7** and **BullMQ** with exponential backoff retries for transient errors (4xx, greylisting, socket drops) and immediate fail-stops for permanent 5xx errors. |
| **Dynamic On-The-Fly SMTP** | Pass SMTP host, port, and credentials directly in the API payload or HTTP headers (`X-SMTP-*`). Ideal for multi-tenant SaaS where each tenant supplies their own mailbox. |
| **AES-256-GCM Credential Shield** | Passwords are encrypted in-memory with AES-256-GCM. Plaintext credentials are **never written** to Redis queues or persistent disk logs. |
| **Strict Multi-Tenancy & Isolation** | Cryptographic API keys (`vsg_live_...`) with per-user daily and monthly delivery quotas, minute-level rate limiters, and sender domain allowlists. |
| **SSRF Protection** | Built-in security guard validates and blocks malicious remote attachment URLs targeting private networks (`10.0.0.0/8`, `192.168.0.0/16`, AWS metadata `169.254.169.254`). |
| **Lightweight Footprint** | Specially architected to run seamlessly on a **free 1 GB RAM cloud VM** (e.g., Oracle Cloud Free Tier) running API, Worker, and Redis simultaneously. |
| **Modern Admin Portal** | Dedicated React + Vite + Tailwind dashboard with real-time delivery graphs, BullMQ queue telemetry, audit logs, and account approvals. |

---

## 🚀 Choose Your Implementation Path

Choose the approach that fits your workflow:

```
┌──────────────────────────────────────────────────────────┐
│              Choose Your Deployment Path                 │
├────────────────────────────┬─────────────────────────────┤
│  Option 1: Hosted Gateway  │   Option 2: Self-Hosted     │
│  - Zero server management  │   - 100% private control    │
│  - Instant developer key   │   - Host on your own VPS    │
│  - Managed SSL & queue     │   - Custom domain & limits  │
│  ▶ Recommended for quick start │  ▶ For full infrastructure ops │
└────────────────────────────┴─────────────────────────────┘
```

---

## 🌐 Option 1: Use the Hosted Gateway (Recommended)

Get up and running in less than 3 minutes without provisioning any servers or databases.

### Step 1: Sign Up on the Portal
1. Open the hosted Veyron Gateway portal in your browser:
   **[https://veyron-gateway.duckdns.org](https://veyron-gateway.duckdns.org)** *(or your organization's custom dashboard URL)*.
2. Click **Request Access** on the sign-in modal.
3. Fill in your Name, Email Address, Company/Project name, and Password.

### Step 2: Instant Administrator Approval
1. Once submitted, your account enters the administrative queue.
2. Upon approval, your **Project API Key** (`vsg_live_...`) is generated with your dedicated daily and monthly delivery quotas.

### Step 3: Copy Your API Key
1. Sign in with your approved credentials.
2. Navigate to **Developer Access & Integration** to view and copy your authorized live API key.

### Step 4: Dispatch Outbound Emails
Send an authenticated HTTP POST request to dispatch an email via your preferred programming language or CLI:

#### cURL
```bash
curl -X POST https://veyron-gateway.duckdns.org/api/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer vsg_live_YOUR_API_KEY_HERE" \
  -d '{
    "smtp": {
      "host": "smtp.hostinger.com",
      "port": 465,
      "secure": true,
      "auth": {
        "user": "billing@yourdomain.com",
        "pass": "YourSmtpPasswordHere"
      }
    },
    "from": "billing@yourdomain.com",
    "to": ["client@example.com"],
    "subject": "Invoice #1042 from Your Company",
    "html": "<h2>Thank you for your business!</h2><p>Your receipt is attached.</p>",
    "text": "Thank you for your business! Your receipt is attached."
  }'
```

#### Node.js / TypeScript
```javascript
const response = await fetch('https://veyron-gateway.duckdns.org/api/v1/emails/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer vsg_live_YOUR_API_KEY_HERE'
  },
  body: JSON.stringify({
    smtp: {
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'billing@yourdomain.com',
        pass: 'YourSmtpPasswordHere'
      }
    },
    from: 'billing@yourdomain.com',
    to: ['client@example.com'],
    subject: 'Welcome to our platform!',
    html: '<p>Your account is ready to use.</p>'
  })
});

const data = await response.json();
console.log('Queued Job ID:', data.jobId);
```

#### Python
```python
import requests

url = "https://veyron-gateway.duckdns.org/api/v1/emails/send"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer vsg_live_YOUR_API_KEY_HERE"
}
payload = {
    "smtp": {
        "host": "smtp.hostinger.com",
        "port": 465,
        "secure": True,
        "auth": {
            "user": "billing@yourdomain.com",
            "pass": "YourSmtpPasswordHere"
        }
    },
    "from": "billing@yourdomain.com",
    "to": ["client@example.com"],
    "subject": "Password Reset Code",
    "html": "<h3>Your code is: <b>849201</b></h3>"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## 🛠️ Option 2: Self-Host with Docker Compose

Self-host on any Ubuntu/Debian VM (including **Oracle Cloud Infrastructure Always-Free VM**, DigitalOcean Droplet, Hetzner, or AWS EC2).

### System Requirements
- **OS:** Ubuntu 22.04 LTS / Debian 12
- **RAM:** Minimum 1 GB RAM (optimized with 128 MB Redis cap)
- **Software:** Docker Engine 24+ & Docker Compose v2

### Step 1: Clone the Repository
```bash
git clone https://github.com/vitthalganeshshivane/Veyron-smtp-gateway.git
cd Veyron-smtp-gateway
```

### Step 2: Configure Environment Variables
Copy the template and configure your production credentials:
```bash
cp .env.example .env
```

Generate secure cryptographic keys and fill in `.env`:
```bash
# Generate 64-hex-char encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate 64-hex-char JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit your `.env`:
```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security (Paste generated keys)
ENCRYPTION_MASTER_KEY=your_64_character_hex_encryption_master_key
JWT_SECRET=your_64_character_hex_jwt_secret

# Database (MongoDB Atlas Free M0 or local MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/veyron_gateway?retryWrites=true&w=majority

# Redis Container
REDIS_HOST=mail-redis
REDIS_PORT=6379
REDIS_PASSWORD=ChooseAStrongRedisPasswordHere

# Master Admin Bootstrap
ADMIN_INITIAL_EMAIL=admin@yourdomain.com
ADMIN_INITIAL_PASSWORD=YourSecureMasterPassword123!

# CORS (Frontend URL)
CORS_ORIGINS=https://your-dashboard.vercel.app,http://localhost:5173
```

### Step 3: Launch with Docker Compose
Start the API, Queue Worker, and Redis container with a single command:
```bash
docker compose up -d --build
```

Verify all services are up and healthy:
```bash
docker compose ps
```
You will see:
- `mail-redis` — **Healthy** (port 6379 internal)
- `mail-api` — **Up / Healthy** (port 3000 mapped)
- `mail-worker` — **Up** (BullMQ consumer concurrency: 1–5)

### Step 4: Configure HTTPS & Reverse Proxy (Caddy)
To expose your API securely with automatic SSL certificates from Let's Encrypt:

1. Install Caddy on your VM:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
   curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install caddy
   ```

2. Configure `/etc/caddy/Caddyfile`:
   ```caddy
   your-gateway.duckdns.org {
       reverse_proxy 127.0.0.1:3000
   }
   ```

3. Reload Caddy:
   ```bash
   sudo systemctl reload caddy
   ```

### Step 5: Deploy the Frontend to Vercel
1. Import `vitthalganeshshivane/Veyron-smtp-gateway` on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-gateway.duckdns.org/api/v1`
4. Click **Deploy**.

---

## 📡 API Quick Reference

### Public Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status (MongoDB, Redis, Uptime) | None |
| `POST` | `/api/v1/auth/register` | Self-service developer registration | None |
| `POST` | `/api/v1/auth/login` | Universal sign-in (Admin or User) | None |

### Email Dispatch Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/emails/send` | Send a single email (supports dynamic SMTP) | Project API Key |
| `POST` | `/api/v1/emails/bulk` | Batch queue up to 50 emails in one request | Project API Key |
| `GET` | `/api/v1/emails/:jobId` | Inspect real-time delivery status & MTA receipt | Project / Admin |
| `POST` | `/api/v1/emails/:jobId/retry` | Manually re-queue a permanently failed email | Project / Admin |

### Telemetry & Admin Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/system/health` | Detailed OS memory, Redis memory & worker metrics | Admin JWT |
| `GET` | `/api/v1/queue/stats` | Waiting, active, delayed, completed, and failed counts | Admin JWT |
| `POST` | `/api/v1/queue/clean` | Purge completed/failed jobs from Redis | Admin JWT |
| `GET` | `/api/v1/users` | List developer accounts and approve/reject requests | Admin JWT |

---

## 🔒 Security Architecture

- **Encrypted Payloads:** SMTP credentials in dynamic calls are encrypted in-memory before entering Redis queues and decrypted only inside worker execution threads.
- **Constant-Time Verification:** API keys use SHA-256 digests compared in constant-time to resist timing attacks.
- **SSRF Hardening:** All remote attachment URLs are pre-resolved against DNS and forbidden from accessing loopback (`127.0.0.1`), link-local, private LAN ranges, or cloud metadata instances.
- **Rate Limiting:** Double-layered protection with both global IP-based rate limiting (Express Rate Limit) and tenant-specific minute token buckets.

---

## 🔍 Technical Deep-Dive & Architecture Audit FAQ

### 1. Does Veyron preserve sender authentication (SPF, DKIM, and DMARC)?
**Yes, 100%.**
- **SPF:** When Veyron sends an email, it authenticates with your real domain SMTP server (e.g., Hostinger, Google Workspace, AWS SES). The actual TCP connection to the recipient MTA (Gmail, Outlook) is established by your mail provider's servers, which are already authorized in your domain's SPF DNS record (`v=spf1 include:_spf... ~all`).
- **DKIM & DMARC:** Your upstream SMTP provider signs the outbound message with your domain's private DKIM key. Because the `From` address aligns with your authenticated domain, DMARC alignment passes without issue.
- **Raw MIME:** If an upstream client pre-signs messages with custom DKIM signatures, Veyron's `rawMime` mode forwards the RFC 822 payload byte-for-byte without header reordering or signature invalidation.

### 2. Can the fallback mechanism or queue retries accidentally send duplicate emails?
**No.**
- **No Dynamic Account Switching in Flight:** Account selection happens strictly at ingestion time. Once a job enters BullMQ, it is locked to that assigned account. Veyron never switches to a secondary SMTP account mid-flight or on timeout.
- **Idempotency Deduplication:** The API supports the `Idempotency-Key` HTTP header. Repeated requests from client networks (e.g., Render/Vercel retries) return the cached response immediately and prevent duplicate queue jobs.
- **Distributed Redis Locks:** BullMQ uses Redis atomic locks with a 40-second lock window (`lockDuration`). Only one worker thread can ever process an email job at a time.
- **Strict Delivery Acknowledgments:** A job is only marked `sent` and quotas deducted once the upstream SMTP server responds with an explicit `250 OK` receipt.

### 3. How reliable is the BullMQ worker in a production cloud deployment?
- **Low-Memory Optimization:** Redis 7 is capped at `128 MB maxmemory` with a `noeviction` policy, specifically designed to run on a free 1 GB RAM cloud instance (Oracle Cloud Free Tier) alongside the API and worker.
- **Process Supervision:** The worker runs in a separate Docker container (`mail-worker`) supervised by Docker with `restart: unless-stopped`.
- **Graceful Shutdown:** The worker listens to `SIGTERM` and `SIGINT`, cleanly finishing in-flight deliveries (`await worker.close()`), closing the Redis connection, and disconnecting MongoDB before terminating.

### 4. Do existing users have legitimate administrator privileges?
**No, privileges are strictly segregated.**
- **Separate Collections & Role-Based Access Control (RBAC):** Master administrators exist in the `admins` collection (`role: 'superadmin'`), bootstrapped via `ADMIN_INITIAL_EMAIL`. Registered users exist in the `users` collection (`role: 'user'`).
- **Route Guarding:** All administrative routes (`/api/v1/users`, `/api/v1/smtp-accounts`, `/api/v1/system/health`, `/api/v1/queue/clean`) are protected by the `authenticateAdmin` middleware. If a standard user attempts to access admin APIs, the server responds with `HTTP 403 Forbidden`.
- **Portal Isolation:** Standard users only have access to their own developer portal (`/portal`), their own API key, and their own email logs.

### 5. Is the weekly digest triggered automatically and how are recipients selected?
**Veyron is a pure transactional relay infrastructure; it does not generate or schedule automated marketing digests.**
- Veyron does not contain cron jobs that compose or trigger marketing emails.
- If your external SaaS or CRM application wants to send a weekly summary or digest to its users, your application handles recipient selection and dispatches the batch to Veyron's `/api/v1/emails/send` or `/api/v1/emails/bulk` API. Veyron acts strictly as the high-throughput delivery relay.

### 6. Do email HTML templates introduce dynamic rendering edge cases or dependency risks?
**No, because Veyron deliberately enforces a Zero-Content-Modification Policy.**
- **No Server-Side Template Engine:** Veyron does not compile or parse templates (no Handlebars, Mustache, or React-Email in the backend). Client applications pass pre-rendered HTML/CSS or raw MIME.
- **No Parsing Failures:** This eliminates template variable syntax errors, unescaped character crashes, or missing dependency vulnerabilities.
- **Attachment Protection:** Remote attachment URLs are verified by an SSRF security guard to ensure they do not target local or cloud metadata IP addresses.

---

## 🧪 Verification & Automated Testing

The gateway includes an extensive Vitest automated test suite:

```bash
cd backend
npm test
```

```
 ✓ tests/ssrf.test.js (4 tests)
 ✓ tests/crypto.test.js (4 tests)
 ✓ tests/validation.test.js (6 tests)
 ✓ tests/smtpTransport.test.js (4 tests)
 ✓ tests/integration.test.js (4 tests)
 ✓ tests/api.test.js (6 tests)

 Test Files  6 passed (6)
      Tests  28 passed (28)
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

<div align="center">
  <sub>Built with high-resilience engineering by Vitthal Ganesh Shivane. Powered by Node.js, BullMQ, Redis, and React.</sub>
</div>
