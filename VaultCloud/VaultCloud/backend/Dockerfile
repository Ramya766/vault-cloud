# ─── Backend Dockerfile ──────────────────────────────────────────────────────
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Copy dependency manifests first for better Docker layer caching
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose the backend port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
