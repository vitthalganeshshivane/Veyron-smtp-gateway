# Veyron SMTP Gateway — Docker Architecture & Operations Guide

## Overview

The Veyron SMTP Gateway uses a strictly scoped Docker configuration. 
Per system requirements:
- **Dockerized Components:** `mail-api`, `mail-worker`, `mail-redis`.
- **Excluded Components:**
  - **MongoDB:** Hosted externally on **MongoDB Atlas** (never run MongoDB in Docker on a 1 GB RAM instance).
  - **Frontend:** Hosted independently on **Vercel** (static assets and client-side SPA).

---

## 1. Container Memory Allocation (Target: Oracle 1 GB RAM VM)

On a machine with approximately 1,024 MB RAM, memory allocation is constrained via Docker Compose limits:

| Container | Image | Purpose | Memory Limit |
| :--- | :--- | :--- | :--- |
| **`mail-redis`** | `redis:7-alpine` | BullMQ queue store | **192 MB** (128 MB maxmemory) |
| **`mail-api`** | `veyron-backend:latest` | Express API HTTP server | **384 MB** |
| **`mail-worker`** | `veyron-backend:latest` | Dedicated BullMQ consumer | **384 MB** |
| **Total Reserved** | | | **960 MB** |

> [!IMPORTANT]
> Always enable a 2 GB swapfile on the host OS as documented in `DEPLOYMENT.md`. Swap ensures buffer headroom during high burst allocations and prevents Linux OOM container kills.

---

## 2. Multi-Stage Dockerfile (`backend/Dockerfile`)

The backend Dockerfile uses a 2-stage build on `node:22-alpine`:
1. **Builder Stage (`node:22-alpine`):** Installs Python/make build tools, installs npm dependencies, and runs `npm prune --production` to eliminate development dependencies (Vitest, Supertest, etc.).
2. **Runner Stage (`node:22-alpine`):**
   - Installs `dumb-init` (for proper PID 1 signal handling) and `curl` (for health checks).
   - Copies only pruned production `node_modules`, `package.json`, and `src/`.
   - Runs under non-root user `node` (`USER node`).
   - Image size is minimized to ~160 MB.

---

## 3. Redis Configuration Details

The `mail-redis` container runs with flags optimized for data integrity and low memory:
```bash
redis-server \
  --appendonly yes \
  --maxmemory 128mb \
  --maxmemory-policy noeviction \
  --save 900 1 \
  --save 300 10
```
- `--appendonly yes`: Uses Append-Only File (AOF) persistence so jobs are retained across restarts.
- `--maxmemory 128mb`: Prevents Redis from consuming unbounded host memory.
- `--maxmemory-policy noeviction`: Crucial for queue systems. If Redis reaches memory limits, commands error out rather than silently deleting waiting email jobs!
- **Internal Network Only:** Redis is attached solely to `veyron-internal` bridge network. Port 6379 is NOT published to host ports.

---

## 4. API vs Worker Process Model

Both `mail-api` and `mail-worker` use the same underlying Docker image, but execute different commands:
- **`mail-api`:** `CMD ["node", "src/server.js"]` — Handles HTTP routing, JWT & API Key validation, and inserts jobs into BullMQ.
- **`mail-worker`:** `CMD ["node", "src/workers/emailWorker.js"]` — Consumes jobs, decrypts SMTP credentials, throttles delivery, and interacts with SMTP servers over TLS.

This separation ensures heavy email sending operations do not block the Express event loop from accepting new API requests.

---

## 5. Docker Operational Commands

### Build and Start Containers
```bash
docker compose up -d --build
```

### Check Running Containers & Health Status
```bash
docker compose ps
```
Sample healthy output:
```
NAME                 IMAGE               COMMAND                  SERVICE       CREATED         STATUS                   PORTS
veyron-mail-api      veyron-mail-api     "/usr/bin/dumb-init …"   mail-api      2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:3000->3000/tcp
veyron-mail-redis    redis:7-alpine      "docker-entrypoint.s…"   mail-redis    2 minutes ago   Up 2 minutes (healthy)   
veyron-mail-worker   veyron-mail-worker  "/usr/bin/dumb-init …"   mail-worker   2 minutes ago   Up 2 minutes             
```

### Inspect Live Logs
```bash
# Follow all container logs
docker compose logs -f

# Follow worker logs only
docker compose logs -f mail-worker

# Follow API logs only
docker compose logs -f mail-api
```

### Stop Containers Gracefully
```bash
docker compose down
```
`dumb-init` forwards `SIGTERM` to the Node.js processes, enabling BullMQ workers to finish in-flight jobs and close Redis/MongoDB connection pools cleanly.
