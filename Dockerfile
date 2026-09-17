FROM oven/bun:1.4.2-alpine

WORKDIR /app

# Install curl for container health checks
RUN apk add --no-cache curl

# Install dependencies
COPY package.json ./
RUN bun install --frozen-lockfile || bun install

# Copy application source code
COPY . .

# Create persistent data directory for SQLite & backups
RUN mkdir -p /app/data /app/data/backups

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/thotsakan.db

# Expose HTTP API/Web UI (3000) and Inbound SMTP Relay (2525)
EXPOSE 3000 2525

# Container Healthcheck verifying /healthz endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

VOLUME ["/app/data"]

CMD ["bun", "run", "src/index.ts"]
