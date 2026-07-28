# Google Cloud Mirror single-stage Dockerfile optimized for GCR compatibility
FROM mirror.gcr.io/library/node:20-slim

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy application source
COPY . .

# Build Next.js application
RUN npm run build

# Expose port 3000 (Cloud Run overrides this via PORT env var)
EXPOSE 3000

# Set environment for production
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Use dumb-init to handle container termination signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js server using package.json script
CMD ["npm", "run", "start"]
