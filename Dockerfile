FROM oven/bun:1.4.2-alpine

WORKDIR /app

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

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["bun", "run", "src/index.ts"]
