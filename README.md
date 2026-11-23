# Veyron SMTP Gateway

> **Production-Oriented, Scalable, Lightweight Outbound SMTP Gateway & Queue Engine**

Veyron SMTP Gateway is a centralized email delivery service architected for applications deployed on cloud platforms (such as Render, Vercel, Railway) where direct outbound SMTP traffic is blocked or throttled under free/hobby tiers.

Instead of paying for expensive third-party transactional email providers (like Resend, Brevo, or SendGrid), Veyron acts as an authenticated intermediary relay. Client applications dispatch transactional emails over HTTPS; Veyron validates authorization, enforces project quotas and rate limits, enqueues jobs into BullMQ with Redis, and delivers emails faithfully through real SMTP accounts (such as Hostinger SMTP, Google Workspace, or custom MTAs) via Nodemailer.

---

## Key Architectural Highlights

- **Host Target:** Optimized specifically for **Oracle Cloud Free Tier VM** (~1 GB RAM).
- **Core Technology Stack:**
  - **Backend:** Node.js 22 LTS (ES Modules), Express.js, Nodemailer, BullMQ, ioredis, MongoDB Atlas (Mongoose), Zod, Helmet, Express Rate Limit, Pino.
  - **Frontend:** React 18, Vite, Tailwind CSS, Lucide icons, Recharts (deployed independently on Vercel).
  - **Infrastructure:** Docker & Docker Compose (`mail-api`, `mail-worker`, `mail-redis`).
- **Zero Content Modification:** Email HTML, CSS, inline styles, MIME parts, attachments, and custom headers are preserved and forwarded without template injection or destructive sanitization.
- **Security & Multi-Tenancy:**
  - AES-256-GCM encryption at rest for all SMTP passwords.
  - Cryptographically hashed API keys for external applications (`Authorization: Bearer <API_KEY>`).
  - SSRF protection against malicious remote attachment URLs.
  - Strict tenant isolation (projects cannot access other projects' accounts or logs).
- **High-Resilience Queue Engine:**
  - Configurable BullMQ concurrency (default 5 concurrent delivery streams).
  - Exponential backoff retries for transient SMTP errors (timeouts, 4xx responses).
  - Unrecoverable error handling for permanent 5xx responses (mailbox not found).
  - Automatic account pause and alert triggers on SMTP authentication failure (535 / EAUTH).
  - Idempotency deduplication using `Idempotency-Key` HTTP headers.

---

## Architecture Diagram

```
+-------------------------------------------------------------------------+
| Client Applications (Render / Vercel / Railway)                        |
| e.g. Vexillar, TARS CRM                                                 |
+------------------------------------+------------------------------------+
                                     | HTTPS POST /api/v1/emails/send
                                     | Authorization: Bearer <API_KEY>
                                     v
+------------------------------------+------------------------------------+
| Oracle Cloud VM (~1 GB RAM)                                             |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  | Container: mail-api (Port 3000)                                   |  |
|  | - Helmet, Rate Limiter, Zod Validation                           |  |
|  | - Authenticates Project API Key (SHA-256)                         |  |
|  | - Checks & Atomically Reserves Quota                             |  |
|  | - Generates Job ID & Enqueues to BullMQ                          |  |
|  +---------------------------------+--------------------------------+  |
|                                    |                                    |
|                                    v                                    |
|  +---------------------------------+--------------------------------+  |
|  | Container: mail-redis (Redis 7 Alpine)                           |  |
|  | - 128 MB maxmemory (noeviction policy)                           |  |
|  | - AOF & RDB Persistence (Internal Network Only)                  |  |
|  +---------------------------------+--------------------------------+  |
|                                    |                                    |
|                                    v                                    |
|  +---------------------------------+--------------------------------+  |
|  | Container: mail-worker (BullMQ Consumer)                         |  |
|  | - Concurrency: 5 streams                                         |  |
|  | - Nodemailer Connection Pool                                     |  |
|  | - Decrypts credentials (AES-256-GCM)                             |  |
|  | - Classifies Transient vs Permanent SMTP responses               |  |
|  | - Reconciles Quotas on Success / Failure                         |  |
|  +---------------------------------+--------------------------------+  |
+------------------------------------+------------------------------------+
                   |                                   |
                   v (SMTP Delivery)                   v (Audit & History)
       +-----------------------+           +-----------------------+
       | Upstream SMTP Relays  |           | MongoDB Atlas Cluster |
       | - Hostinger SMTP      |           | - EmailLog & Events   |
       | - Google Workspace    |           | - Quotas & Projects   |
       | - Custom MTAs         |           | - Admin Profiles      |
       +-----------------------+           +-----------------------+
```

---

## Directory Structure

```
veyron_smtp_gateway/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment, MongoDB, and Redis configuration
│   │   ├── controllers/    # API controllers (Auth, Emails, Projects, SMTP, Analytics, System)
│   │   ├── middleware/     # Project API Key auth, Admin JWT auth, Rate Limiting, Validation
│   │   ├── models/         # Mongoose models (Admin, Project, SMTPAccount, EmailLog, Quota, etc.)
│   │   ├── providers/      # SMTP Transport Factory (Hostinger, Google, Custom, Mock)
│   │   ├── queues/         # BullMQ email queue definition
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Quota reservation, reconciliation, account selection
│   │   ├── utils/          # AES-256-GCM crypto, API key hashing, SSRF guard, Pino logger
│   │   ├── validators/     # Zod request validation schemas
│   │   ├── workers/        # BullMQ Worker consumer process
│   │   ├── app.js          # Express app entry
│   │   └── server.js       # Main API HTTP server listener
│   ├── tests/              # Vitest & Supertest unit and integration test suite
│   ├── Dockerfile          # Production multi-stage Alpine Dockerfile
│   └── package.json
│
├── frontend/               # Independent React + Vite + Tailwind Admin Dashboard (Deploy to Vercel)
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, Header, Modals
│   │   ├── context/        # JWT Authentication Context
│   │   ├── pages/          # Overview, Logs, Queue, Projects, SMTP, Analytics, Health, Settings
│   │   ├── services/       # API client with VITE_API_BASE_URL
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml      # Orchestrates mail-api, mail-worker, mail-redis
├── .env.example            # Environment variables template
├── DEPLOYMENT.md           # Step-by-step Oracle Cloud and Vercel deployment guide
├── API_DOCUMENTATION.md    # Comprehensive endpoint reference & payload examples
├── DOCKER_GUIDE.md         # Container architecture, resource constraints & maintenance
├── SECURITY.md             # Security architecture & threat modeling
└── postman_collection.json # Ready-to-import Postman test collection
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ LTS
- Redis running locally or via Docker (`docker run -d -p 6379:6379 redis:7-alpine`)
- MongoDB Atlas cluster URL or local MongoDB

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Ensure `ENCRYPTION_MASTER_KEY` (64 hex characters) and `JWT_SECRET` are set.
For local testing without active SMTP credentials, set:
```env
MOCK_SMTP_ENABLED=true
```

### 3. Backend Setup & Run
```bash
cd backend
npm install
npm test            # Run all 27 unit & integration tests
npm run dev         # Starts API on http://localhost:3000
npm run dev:worker  # In a separate terminal: starts BullMQ Worker
```

### 4. Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev         # Starts Vite dev server on http://localhost:5173
```

Visit `http://localhost:5173` and sign in with:
- **Email:** `admin@veyron.internal`
- **Password:** `ChangeThisMasterAdminPassword123!` (or value defined in `ADMIN_INITIAL_PASSWORD`)

---

## Running with Docker Compose

To start the API, Worker, and Redis on your server:

```bash
docker compose up -d --build
```

Check health and logs:
```bash
docker compose ps
docker compose logs -f mail-api
docker compose logs -f mail-worker
```

---

## Verification & Tests

To execute the test suite:
```bash
cd backend
npm test
```
**Test coverage includes:**
- AES-256-GCM symmetric encryption roundtrips & authentication tag tampering detection.
- SSRF prevention against private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, AWS metadata `169.254.169.254`).
- Zod schema validation for SendEmail (HTML, text, raw MIME, attachments).
- SMTP error classification (Transient timeouts vs Permanent 5xx vs Authentication 535).
- Project sender authorization (Exact matching & `*@domain.com` wildcard evaluation).
- Admin password bcrypt hashing & JWT token verification.
- HTTP endpoint integration tests with Supertest.
