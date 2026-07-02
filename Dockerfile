# Multi-stage Dockerfile optimized for Google Cloud Run
# This builds a Next.js application with Python support for data processing

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application source
COPY . .

# Build Next.js application
RUN npm run build

# Stage 2: Runtime stage - minimal production image
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Optional: Copy Python dependencies and scripts if needed for data processing
# Uncomment the lines below if you need Python runtime in the container
# FROM node:20-alpine (use debian-based image instead for Python)
# RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
# COPY requirements.txt .
# RUN pip install -r requirements.txt

# Switch to non-root user
USER nextjs

# Expose port 3000 (Cloud Run requires this or configure via PORT env var)
EXPOSE 3000

# Set environment for production
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js server
CMD ["node_modules/.bin/next", "start"]
