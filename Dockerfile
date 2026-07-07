# Single-stage Dockerfile optimized for Google Cloud Run compatibility
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

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
