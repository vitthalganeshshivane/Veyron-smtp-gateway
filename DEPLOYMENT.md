# Veyron SMTP Gateway — Deployment Guide

This guide details the complete production deployment procedures for:
1. **Backend Infrastructure (API, BullMQ Worker, Redis):** Hosted on an **Oracle Cloud Free Tier VM** (~1 GB RAM).
2. **Frontend Admin Dashboard:** Hosted independently on **Vercel**.
3. **Database:** Hosted on **MongoDB Atlas** (External Cloud Database).

---

## Part 1: Oracle Cloud Free Tier VM Setup (Backend)

Oracle Cloud Infrastructure (OCI) offers an `Always Free` Compute VM (`VM.Standard.E2.1.Micro` with 1 OCPU and 1 GB RAM, or `VM.Standard.A1.Flex` with Ampere ARM).

### Step 1: Provision the VM & Configure Security Lists
1. In the OCI Console, launch an **Ubuntu 24.04 LTS** instance.
2. In the Virtual Cloud Network (VCN) **Security List**, add Ingress Rules for:
   - **Port 22 (SSH):** Inbound from your administration IP.
   - **Port 80 (HTTP):** Inbound `0.0.0.0/0` (for Let's Encrypt challenge).
   - **Port 443 (HTTPS):** Inbound `0.0.0.0/0` (for public API traffic).
   - *Do NOT open Port 6379 (Redis) or Port 3000 directly to the internet.*

### Step 2: Configure 2 GB Swap Space (CRITICAL for 1 GB RAM VM)
To prevent Linux Out-Of-Memory (OOM) killer from terminating containers during peak email throughput:

```bash
# Verify existing swap
sudo swapon --show

# Create a 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Tune swappiness for memory-conservative server operation
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### Step 3: Install Docker & Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker for the non-root user
sudo usermod -aG docker $USER
```

### Step 4: Clone the Repository & Configure Environment
```bash
git clone https://github.com/your-org/veyron-smtp-gateway.git
cd veyron-smtp-gateway

cp .env.example .env
nano .env
```

Ensure the following variables are populated in `.env`:
- `MONGODB_URI`: Your MongoDB Atlas connection string.
- `JWT_SECRET`: Random 64-character hex (`openssl rand -hex 32`).
- `ENCRYPTION_MASTER_KEY`: Random 64-character hex (`openssl rand -hex 32`).
- `CORS_ORIGINS`: Your Vercel dashboard URL (e.g. `https://veyron-dashboard.vercel.app`).
- `WORKER_CONCURRENCY`: `5` (recommended default for 1 GB VM).

### Step 5: Launch Containers via Docker Compose
```bash
docker compose up -d --build
```

Verify service status:
```bash
docker compose ps
docker compose logs -f mail-api
```

---

## Part 2: Reverse Proxy & SSL Setup (Caddy or Nginx)

To terminate SSL and forward traffic securely to port 3000:

### Option A: Using Caddy (Recommended — Automatic SSL)
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Edit `/etc/caddy/Caddyfile`:
```caddy
api.yourdomain.com {
    reverse_proxy localhost:3000 {
        header_up X-Real-IP {remote_host}
    }
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

---

## Part 3: Deploy Frontend to Vercel

The frontend is an independent React Single-Page Application (SPA) located in the `frontend/` directory.

### Step 1: Push Repository to GitHub
Ensure the `frontend/` directory is committed to your repository.

### Step 2: Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** &rarr; **Project**.
3. Select your Git repository.
4. Configure the Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click edit and set to `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
   ```
6. Click **Deploy**.

### Step 3: Configure SPA Routing on Vercel
Create `frontend/vercel.json` if direct sub-route reloads are needed:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Part 4: MongoDB Atlas External Database Configuration

1. In MongoDB Atlas, create a free `M0` cluster.
2. In **Network Access**, add the static public IP of your Oracle Cloud VM.
3. In **Database Access**, create a user with `readWriteAnyDatabase` or scoped read/write privileges on `veyron_smtp_gateway`.
4. Copy the SRV connection string into your `.env`:
   ```env
   MONGODB_URI=mongodb+srv://gateway_user:StrongPassword@cluster0.abcde.mongodb.net/veyron_smtp_gateway?retryWrites=true&w=majority
   ```

---

## Part 5: Maintenance & Operational Commands

### View Live Worker Processing
```bash
docker compose logs -f --tail=100 mail-worker
```

### Inspect Container Memory Usage
```bash
docker stats
```

### Updating the Gateway
```bash
git pull
docker compose up -d --build
```
Zero downtime is maintained as Docker restarts containers gracefully with connection draining.
