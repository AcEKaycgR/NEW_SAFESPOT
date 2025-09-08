# Deploying SafeSpot on Render

## Overview
This guide provides step-by-step instructions for deploying the SafeSpot tourist application on Render, a cloud platform that simplifies hosting full-stack web applications.

## Prerequisites
1. **Render Account**: Sign up at render.com
2. **GitHub Repository**: Push your SafeSpot code to GitHub
3. **Database**: PostgreSQL database (can be on Render)
4. **API Keys**: Google Maps, Gemini API keys ready

## Deployment Architecture
```
┌─────────────────┐    ┌──────────────────┐
│   Frontend      │    │    Backend       │
│   (Next.js)     │◄──►│   (Express)     │
│   Static Site   │    │   Web Service    │
└─────────────────┘    └──────────────────┘
                               │
                      ┌──────────────────┐
                      │   PostgreSQL     │
                      │   Database       │
                      └──────────────────┘
```

## Step 1: Prepare Your Codebase

### 1.1 Update Environment Configuration

Create a `.env.render` file in your project root:
```bash
# Database
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# API Keys
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key

# Application URLs
NEXT_PUBLIC_API_BASE_URL=https://your-backend-on-render.onrender.com
NEXT_PUBLIC_SOCKET_URL=wss://your-backend-on-render.onrender.com

# JWT Secret
JWT_SECRET=your_secure_jwt_secret

# Port Configuration
PORT=3001
FRONTEND_PORT=3000
```

### 1.2 Update Package.json Scripts

Update `frontend/package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p $PORT",
    "render": "next build && next start -p $PORT"
  }
}
```

Update `backend/package.json`:
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "render": "npm run build && npm run start"
  }
}
```

### 1.3 Add Render Build Scripts

Create `render-build.sh` in your project root:
```bash
#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Build backend
echo "Building backend..."
cd backend
npm install
npm run build
cd ..
```

## Step 2: Set Up PostgreSQL Database on Render

### 2.1 Create Database
1. Log in to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure database:
   - Name: `safespot-db`
   - Region: Choose closest to your users
   - Plan: Free or Starter (consider paid for production)
4. Note the connection details:
   - Hostname
   - Port
   - Database name
   - Username
   - Password

### 2.2 Configure Database Connection
Update your backend database configuration to use Render's PostgreSQL connection string.

## Step 3: Deploy Backend Web Service

### 3.1 Create Backend Service
1. In Render Dashboard, click "New +" → "Web Service"
2. Connect to your GitHub repository
3. Configure service settings:
   - Name: `safespot-backend`
   - Environment: Node
   - Region: Choose appropriate region
   - Branch: main (or your deployment branch)
   - Root Directory: `backend`

### 3.2 Build Settings
```
Build Command: npm install
Start Command: npm run render
```

### 3.3 Environment Variables
Add these environment variables in the Render dashboard:
```
NODE_VERSION=18
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
GEMINI_API_KEY=your_actual_gemini_api_key
JWT_SECRET=your_secure_jwt_secret
PORT=3001
```

### 3.4 Advanced Settings
- Auto-Deploy: Yes
- Health Check Path: `/health`
- Environment Variables:
  - NODE_ENV: production
  - NEXT_PUBLIC_API_BASE_URL: `https://your-backend-service.onrender.com`

## Step 4: Deploy Frontend Static Site

### 4.1 Create Frontend Service
1. In Render Dashboard, click "New +" → "Static Site"
2. Connect to your GitHub repository
3. Configure service settings:
   - Name: `safespot-frontend`
   - Branch: main (or your deployment branch)
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `.next/standalone`

### 4.2 Environment Variables for Frontend
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NODE_VERSION=18
```

### 4.3 Advanced Settings
- Auto-Deploy: Yes
- Custom Domain: (optional)
- Redirects/Rewrites: Configure as needed

## Step 5: Configure CORS and API Integration

### 5.1 Update Backend CORS Settings
In your `backend/src/server.ts`, update CORS configuration:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.onrender.com',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

### 5.2 Update Frontend API Configuration
In your frontend, update API base URL:
```typescript
// In your actions.ts or API config file
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-backend-service.onrender.com';
```

## Step 6: Set Up Environment-Specific Configurations

### 6.1 Frontend Environment
Create `frontend/.env.production`:
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_google_maps_key
```

### 6.2 Backend Environment
Set these in Render dashboard:
```bash
NODE_ENV=production
DATABASE_URL=your_render_postgresql_connection_string
JWT_SECRET=your_production_jwt_secret
GEMINI_API_KEY=your_production_gemini_api_key
PORT=3001
```

## Step 7: Configure Custom Domain (Optional)

### 7.1 Purchase Domain
You can purchase a domain through Render or use an existing one.

### 7.2 Configure DNS Records
Add these DNS records:
```
Type: A
Name: @
Value: 192.0.2.1 (Render's IP or use CNAME)

Type: CNAME
Name: www
Value: your-frontend-service.onrender.com
```

### 7.3 SSL Certificate
Render automatically provisions SSL certificates for custom domains.

## Step 8: Set Up Monitoring and Alerts

### 8.1 Health Checks
Configure health checks in Render:
- Path: `/health`
- Interval: 30 seconds
- Timeout: 10 seconds

### 8.2 Alerts
Set up alerts in Render dashboard:
- Deployment failures
- Performance degradation
- High error rates

## Step 9: Optimize for Production

### 9.1 Caching Strategy
Enable caching in Render:
- Static asset caching
- API response caching

### 9.2 Database Optimization
- Enable connection pooling
- Set up database indexes
- Configure auto-backups

### 9.3 Performance Tuning
- Enable gzip compression
- Optimize image sizes
- Minimize bundle sizes

## Step 10: Deploy and Monitor

### 10.1 Initial Deployment
1. Commit all changes to GitHub
2. Render will automatically start deployment
3. Monitor build logs in Render dashboard

### 10.2 Post-Deployment Testing
1. Test frontend navigation
2. Verify backend API endpoints
3. Test database connectivity
4. Validate SOS functionality
5. Check safety score generation

### 10.3 Monitoring Dashboard
Monitor these metrics in Render:
- Response times
- Error rates
- Uptime
- Resource utilization

## Cost Estimation

### Free Tier (Development/Testing)
- Frontend: Free
- Backend: Free
- Database: Free (500MB storage)

### Production Pricing (Estimated Monthly)
- Frontend: $7 (Starter plan)
- Backend: $7 (Starter plan)  
- Database: $7-50 (based on usage)
- **Total**: $21-64/month

## Troubleshooting Common Issues

### 1. Build Failures
- Check Node.js version compatibility
- Verify all dependencies are correctly specified
- Ensure environment variables are properly set

### 2. Database Connection Issues
- Verify DATABASE_URL format
- Check database credentials
- Confirm database is not paused

### 3. CORS Errors
- Ensure frontend and backend URLs are in CORS whitelist
- Check protocol (http vs https) consistency

### 4. API Key Issues
- Verify Google Maps API key restrictions
- Check Gemini API key quotas
- Ensure API keys have correct permissions

### 5. Performance Problems
- Enable Render's auto-scaling
- Optimize database queries
- Implement caching strategies

## Maintenance Best Practices

### Regular Tasks
1. Monitor resource usage monthly
2. Update dependencies quarterly
3. Review security configurations
4. Backup database regularly
5. Test disaster recovery procedures

### Scaling Considerations
1. Monitor traffic patterns
2. Enable auto-scaling when needed
3. Upgrade plans based on usage
4. Implement load balancing for high traffic

## Security Considerations

### Production Hardening
1. Use strong JWT secrets
2. Restrict API key usage
3. Implement rate limiting
4. Enable HTTPS enforcement
5. Regular security audits

## Advanced Features

### CI/CD Pipeline
Set up automatic deployments:
1. Configure GitHub Actions
2. Add testing pipeline
3. Implement staging environment
4. Set up preview deployments

### Monitoring Integration
Integrate with:
- Sentry for error tracking
- New Relic for performance monitoring
- Loggly for log aggregation

## Conclusion

Deploying SafeSpot on Render provides:
- ✅ Easy deployment process
- ✅ Automatic SSL certificates
- ✅ Built-in monitoring
- ✅ Scalable infrastructure
- ✅ Cost-effective pricing
- ✅ Reliable uptime

The platform is ideal for hosting the complete SafeSpot application with minimal DevOps overhead, allowing you to focus on development while Render handles infrastructure management.