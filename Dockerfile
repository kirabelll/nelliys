# Multi-stage Dockerfile that builds both web and server applications
FROM node:20-alpine AS base

# Install dependencies for both apps
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY turbo.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build both applications
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

# Generate Prisma client
RUN pnpm turbo db:generate --filter=server

# Ensure public directory exists
RUN mkdir -p apps/web/public

# Build both applications
RUN pnpm turbo build --filter=server --filter=web

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Install pnpm, PM2, and nginx
RUN npm install -g pnpm pm2
RUN apk add --no-cache nginx

# Copy built server application
COPY --from=builder --chown=appuser:nodejs /app/apps/server/dist ./server/dist
COPY --from=builder --chown=appuser:nodejs /app/apps/server/prisma ./server/prisma
COPY --from=builder --chown=appuser:nodejs /app/apps/server/package.json ./server/package.json

# Copy built web application
COPY --from=builder --chown=appuser:nodejs /app/apps/web/.next/standalone ./web/
COPY --from=builder --chown=appuser:nodejs /app/apps/web/.next/static ./web/apps/web/.next/static
COPY --from=builder --chown=appuser:nodejs /app/apps/web/public ./web/apps/web/public

# Copy node_modules
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

# Create nginx configuration
RUN mkdir -p /etc/nginx/conf.d && \
    echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 3000;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # API routes to backend' >> /etc/nginx/conf.d/default.conf && \
    echo '    location /api/ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_pass http://localhost:3001;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Upgrade $http_upgrade;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Connection "upgrade";' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Health check' >> /etc/nginx/conf.d/default.conf && \
    echo '    location /health {' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_pass http://localhost:3001;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Socket.IO' >> /etc/nginx/conf.d/default.conf && \
    echo '    location /socket.io/ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_pass http://localhost:3001;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Upgrade $http_upgrade;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Connection "upgrade";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Frontend routes' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_pass http://localhost:3002;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Upgrade $http_upgrade;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Connection "upgrade";' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Create PM2 ecosystem file
RUN echo 'module.exports = {' > ecosystem.config.js && \
    echo '  apps: [' >> ecosystem.config.js && \
    echo '    {' >> ecosystem.config.js && \
    echo '      name: "server",' >> ecosystem.config.js && \
    echo '      script: "./server/dist/index.js",' >> ecosystem.config.js && \
    echo '      cwd: "/app",' >> ecosystem.config.js && \
    echo '      env: {' >> ecosystem.config.js && \
    echo '        NODE_ENV: "production",' >> ecosystem.config.js && \
    echo '        PORT: "3001"' >> ecosystem.config.js && \
    echo '      }' >> ecosystem.config.js && \
    echo '    },' >> ecosystem.config.js && \
    echo '    {' >> ecosystem.config.js && \
    echo '      name: "web",' >> ecosystem.config.js && \
    echo '      script: "./web/apps/web/server.js",' >> ecosystem.config.js && \
    echo '      cwd: "/app",' >> ecosystem.config.js && \
    echo '      env: {' >> ecosystem.config.js && \
    echo '        NODE_ENV: "production",' >> ecosystem.config.js && \
    echo '        PORT: "3002"' >> ecosystem.config.js && \
    echo '      }' >> ecosystem.config.js && \
    echo '    }' >> ecosystem.config.js && \
    echo '  ]' >> ecosystem.config.js && \
    echo '};' >> ecosystem.config.js

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting Nelliys App..."' >> /app/start.sh && \
    echo 'nginx &' >> /app/start.sh && \
    echo 'pm2-runtime start ecosystem.config.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Change ownership of nginx directories
RUN chown -R appuser:nodejs /var/log/nginx /var/lib/nginx /etc/nginx

USER appuser

EXPOSE 3000

CMD ["/app/start.sh"]