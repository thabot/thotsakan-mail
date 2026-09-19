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
ENV PORT=9547
ENV SMTP_PORT=9548
ENV DB_PATH=/app/data/thotsakan.db

# Expose HTTP API/Web UI (9547) and Inbound SMTP Relay (9548)
EXPOSE 9547 9548

# Container Healthcheck verifying /healthz endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9547/healthz || exit 1

VOLUME ["/app/data"]

CMD ["bun", "run", "src/index.ts"]
