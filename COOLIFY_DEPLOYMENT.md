# Coolify Deployment Guide for Nelliys App

## 🚀 Quick Setup

### Step 1: Create Database Service
1. In Coolify, create a **PostgreSQL** database service
2. Note the connection details for environment variables

### Step 2: Deploy Backend API
1. Create a new **Application** in Coolify
2. Connect your Git repository (deployment branch)
3. **Dockerfile**: Use the default `Dockerfile` (builds server)
4. **Port**: 3000
5. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://username:password@postgres-host:5432/database
   JWT_SECRET=your-super-secret-jwt-key
   CORS_ORIGIN=https://your-frontend-domain.com
   PORT=3000
   ```

### Step 3: Deploy Frontend Web App
1. Create another **Application** in Coolify
2. Connect the same Git repository (deployment branch)
3. **Dockerfile**: Use `Dockerfile.frontend`
4. **Port**: 3000
5. **Environment Variables**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com
   ```

## 📋 Environment Variables Reference

### Backend (API) Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key` |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://app.yourdomain.com` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |

### Frontend (Web) Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `wss://api.yourdomain.com` |
| `NODE_ENV` | Environment | `production` |

## 🔧 Deployment Order
1. **Database** (PostgreSQL) - Deploy first
2. **Backend API** - Deploy second (needs database)
3. **Frontend Web** - Deploy last (needs backend)

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