# ========================================================
# Veyron SMTP Gateway - Production Multi-Stage Dockerfile
# Optimized for Oracle Cloud VM (~1 GB RAM)
# Base: Node.js 22 LTS on Alpine Linux
# ========================================================

# Stage 1: Dependencies Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install all dependencies (including dev for building/testing if needed)
RUN npm ci

COPY . .

# Prune devDependencies for a lean production footprint
RUN npm prune --production

# ========================================================
# Stage 2: Production Minimal Runner
# ========================================================
FROM node:22-alpine AS runner

# Install dumb-init for proper kernel signal forwarding (SIGTERM / SIGINT) and curl for health checks
RUN apk add --no-cache dumb-init curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only production dependencies and source files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

# Create non-root user security sandbox
RUN chown -R node:node /app

USER node

EXPOSE 3000

# Dumb-init ensures Node receives SIGTERM and gracefully flushes queue/connections
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default command starts the API service (Worker overrides this in docker-compose)
CMD ["node", "src/server.js"]
