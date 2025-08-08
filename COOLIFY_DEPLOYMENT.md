# Coolify Deployment Guide for Nelliys App

## 🚀 Single Container Deployment

### Step 1: Create Database Service
1. In Coolify, create a **PostgreSQL** database service
2. Note the connection details for environment variables

### Step 2: Deploy Full Stack Application
1. Create a new **Application** in Coolify
2. Connect your Git repository (deployment branch)
3. **Dockerfile**: Use the default `Dockerfile` (builds both web and server)
4. **Port**: 3000
5. **Build Command**: Leave empty (uses Dockerfile)
6. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://username:password@postgres-host:5432/database
   JWT_SECRET=your-super-secret-jwt-key-change-this
   CORS_ORIGIN=https://your-domain.com
   NEXT_PUBLIC_API_URL=https://your-domain.com
   NEXT_PUBLIC_WS_URL=wss://your-domain.com
   PORT=3000
   ```

## 🏗️ Architecture
The single Dockerfile creates a container that runs:
- **Nginx** (Port 3000) - Reverse proxy and static file server
- **Express Server** (Port 3001) - API and WebSocket server  
- **Next.js App** (Port 3002) - Frontend application

Nginx routes:
- `/api/*` → Express Server (3001)
- `/socket.io/*` → Express Server (3001) 
- `/*` → Next.js App (3002)

## 📋 Environment Variables Reference

### Required Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key` |
| `CORS_ORIGIN` | Your domain for CORS | `https://yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `https://yourdomain.com` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `wss://yourdomain.com` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Container port | `3000` |

## 🔧 Deployment Order
1. **Database** (PostgreSQL) - Deploy first
2. **Full Stack App** - Deploy second (single container)

## 🏗️ Available Dockerfiles
- `Dockerfile` - Default (Backend API)
- `Dockerfile.frontend` - Frontend Web App
- `Dockerfile.server` - Alternative backend (same as default)
- `Dockerfile.web` - Alternative frontend (same as Dockerfile.frontend)

## 🔍 Health Checks
- **Backend**: `GET /health`
- **Frontend**: `GET /`

## 🌐 Domain Setup
1. Set up your domains in Coolify
2. Configure SSL certificates
3. Update CORS_ORIGIN and API URLs accordingly

## 🐛 Troubleshooting

### Build Fails
- Check if all environment variables are set
- Ensure database is running and accessible
- Check build logs for specific errors

### Connection Issues
- Verify DATABASE_URL format
- Check network connectivity between services
- Ensure CORS_ORIGIN matches frontend domain

### TypeScript Errors
- Run `pnpm check-types` locally first
- Fix any type errors before deploying

## 📁 File Structure
```
├── Dockerfile              # Default (Backend)
├── Dockerfile.frontend     # Frontend
├── Dockerfile.server       # Backend (alternative)
├── Dockerfile.web         # Frontend (alternative)
├── docker-compose.yml     # Local development
└── COOLIFY_DEPLOYMENT.md  # This guide
```