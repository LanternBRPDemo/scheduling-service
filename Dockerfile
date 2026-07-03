# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY knexfile.js ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/knexfile.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Set environment variables
ENV NODE_ENV=production \
    SERVICE_NAME=scheduling-service \
    SERVICE_PORT=4015

# Expose port
EXPOSE 4015

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4015/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start with dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start the service
CMD ["sh", "-c", "npm run migrate && node dist/main.js"]