# Veyron SMTP Gateway — Security Architecture & Policy

## 1. Threat Model & Mitigation Overview

| Threat | Impact | Mitigation in Veyron |
| :--- | :--- | :--- |
| **Open Email Relay** | Gateway abused for spam/phishing | Strict Project API key requirement; unauthenticated relaying is impossible; sender addresses validated against project `allowedSenders`. |
| **SMTP Credential Theft** | Upstream mail account compromised | Credentials stored encrypted at rest via AES-256-GCM; master key stored in environment; passwords never returned in API responses. |
| **Server-Side Request Forgery (SSRF)** | Attacker probes internal cloud metadata (e.g. AWS 169.254.169.254) via attachments | Strict DNS lookup resolution before fetching remote URLs; blocks loopback (`127.0.0.0/8`), private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and link-local ranges. |
| **Project Cross-Access / Data Leak** | Tenant A accesses Tenant B's emails/accounts | Strict multi-tenant isolation enforced in queries; project API keys are scoped exclusively to their own project ID and assigned accounts. |
| **Brute Force & DoS** | Gateway or auth overwhelmed | Global IP rate limiting via Express Rate Limit; dedicated auth rate limiter (10 attempts/15m); project dynamic sliding window limiters. |
| **Information Leakage via Logs** | Secrets exposed in centralized log files | Pino structured logger configured with automatic redaction paths for `password`, `apiKey`, `authorization`, `secret`, and `token`. |

---

## 2. AES-256-GCM Credential Encryption

SMTP passwords stored in MongoDB are encrypted using the **Galois/Counter Mode (GCM)** of the Advanced Encryption Standard (AES) with a 256-bit key.

- **Authentication Tag:** A 128-bit authentication tag is produced for every encryption. If the ciphertext is tampered with at rest, decryption throws an authentication error.
- **Initialization Vector (IV):** A cryptographically strong, unique 16-byte random IV is generated for each encryption operation.
- **Ciphertext Storage Format:** `iv_hex:authTag_hex:ciphertext_hex`.
- **Master Key:** Derived from `ENCRYPTION_MASTER_KEY` (64-character hex string).

---

## 3. Project API Key Hashing

- API keys follow the format: `vsg_live_<prefix>_<secret_entropy>`.
- The plaintext API key is shown to the user **exactly once** upon creation.
- Only the **SHA-256 cryptographic hash** of the key is saved in the database:
  ```javascript
  const keyHash = crypto.createHash('sha256').update(rawApiKey.trim()).digest('hex');
  ```
- When an API request arrives with `Authorization: Bearer <KEY>`, the gateway computes `sha256(KEY)` and performs a constant-time lookup against the `Project` collection.
- Revocation or regeneration immediately invalidates the old hash.

---

## 4. SSRF Attachment Guard (`src/utils/ssrfProtection.js`)

Before downloading any remote attachment URL, Veyron:
1. Validates that the protocol is strictly `http:` or `https:`.
2. Resolves the hostname to all associated IP addresses via asynchronous DNS lookup.
3. Validates that no resolved IP falls within:
   - `127.0.0.0/8` (Loopback)
   - `10.0.0.0/8` (RFC 1918 Private)
   - `172.16.0.0/12` (RFC 1918 Private)
   - `192.168.0.0/16` (RFC 1918 Private)
   - `169.254.0.0/16` (Link-Local & Cloud Metadata Service `169.254.169.254`)
   - `::1` or IPv6 private ranges (`fc00::/7`, `fe80::/10`)
4. Rejects hostnames resolving to internal addresses with a permanent, unrecoverable error.

---

## 5. Security Headers & Network Hardening

- **Helmet:** Enables standard HTTP security headers: Content Security Policy, X-Content-Type-Options, Strict-Transport-Security, Frameguard.
- **Non-Root Docker Execution:** Containers run under the unprivileged `node` user (`UID 1000`).
- **Private Docker Network:** Redis container communicates strictly across internal bridge network `veyron-internal`. Redis port 6379 is never exposed to the host network interface.
