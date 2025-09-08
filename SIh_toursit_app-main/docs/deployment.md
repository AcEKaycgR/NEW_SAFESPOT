# Deployment Guide

This guide covers deploying the SafeSpot Tourist Safety Application to production environments.

## 🚀 Production Deployment Options

### Option 1: Traditional Server Deployment
### Option 2: Container Deployment (Docker)
### Option 3: Cloud Platform Deployment
### Option 4: Kubernetes Deployment

---

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ LTS
- **npm** or **yarn** package manager
- **PostgreSQL** 14+ (recommended for production)
- **Redis** (for caching and sessions)
- **SSL Certificate** (for HTTPS)
- **Domain Name** with DNS configuration

### Required Services
- **Ethereum Node** (Infura, Alchemy, or self-hosted)
- **Google AI API** access
- **Email Service** (SendGrid, AWS SES, etc.)
- **File Storage** (AWS S3, Google Cloud Storage, etc.)

### Required Accounts
- **GitHub** (for source code)
- **Domain Registrar** (for custom domain)
- **Cloud Provider** (AWS, GCP, Azure, DigitalOcean, etc.)
- **Blockchain Service** (Infura, Alchemy)

---

## 🔧 Environment Configuration

### Production Environment Variables

Create a `.env.production` file for the backend:

```env
# Application
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@host:port/database_name
REDIS_URL=redis://username:password@host:port

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-project-id
ETHEREUM_PRIVATE_KEY=your-deployment-private-key
SMART_CONTRACT_ADDRESS=0x742d35cc6ba58daa6e0594c7d0d5fc979cf8bd3b

# Google AI
GOOGLE_API_KEY=your-google-ai-api-key

# Security
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=your-session-secret

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=error

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Create a `.env.local` file for the frontend:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.yourdomain.com

# Application
NEXT_PUBLIC_APP_NAME=SafeSpot
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production

# Analytics (optional)
NEXT_PUBLIC_GA_TRACKING_ID=GA-XXXXXXXXX-X
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-sentry-dsn

# Maps (if using Google Maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

---

## 🏗️ Option 1: Traditional Server Deployment

### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx (reverse proxy)
sudo apt install nginx -y

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 2. Database Setup

```sql
-- Connect to PostgreSQL
sudo -u postgres psql

-- Create database and user
CREATE DATABASE safespot_production;
CREATE USER safespot_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE safespot_production TO safespot_user;
\q
```

### 3. Application Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/safespot.git
cd safespot

# Install dependencies
npm run install:all

# Build applications
cd backend
npm run build

cd ../frontend
npm run build

# Setup database
cd ../backend
npx prisma migrate deploy
npx prisma generate

# Deploy smart contracts (if needed)
cd ../smart-contracts
npx hardhat run scripts/deploy.js --network mainnet
```

### 4. Process Management with PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'safespot-backend',
      cwd: './backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
    },
    {
      name: 'safespot-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
    }
  ]
};
```

```bash
# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/safespot`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Backend
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration (same as above)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS Headers
        add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/safespot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🐳 Option 2: Docker Deployment

### 1. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: safespot-postgres
    environment:
      POSTGRES_DB: safespot_production
      POSTGRES_USER: safespot_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U safespot_user"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: safespot-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: safespot-backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://safespot_user:${DB_PASSWORD}@postgres:5432/safespot_production
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    env_file:
      - ./backend/.env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3001:3001"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: safespot-frontend
    environment:
      - NODE_ENV=production
    env_file:
      - ./frontend/.env.local
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: safespot-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: safespot-network
```

### 2. Production Dockerfile for Backend

Create `backend/Dockerfile.prod`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create directories for uploads and logs
RUN mkdir -p /app/uploads /app/logs && chown -R nextjs:nodejs /app/uploads /app/logs

USER nextjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### 3. Production Dockerfile for Frontend

Create `frontend/Dockerfile.prod`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### 4. Deploy with Docker

```bash
# Set environment variables
export DB_PASSWORD=your_secure_db_password
export REDIS_PASSWORD=your_secure_redis_password

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale services if needed
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

---

## ☁️ Option 3: Cloud Platform Deployment

### AWS Deployment with ECS

1. **Create ECR repositories**
2. **Build and push Docker images**
3. **Setup ECS cluster and services**
4. **Configure ALB and Route53**
5. **Setup RDS for database**
6. **Configure ElastiCache for Redis**

### Google Cloud Platform

1. **Create GKE cluster**
2. **Build images with Cloud Build**
3. **Deploy with Kubernetes**
4. **Setup Cloud SQL**
5. **Configure Load Balancer**

### DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Configure build settings**
3. **Setup managed database**
4. **Configure custom domain**

---

## 🔍 Monitoring & Logging

### Application Monitoring

```bash
# Install monitoring tools
npm install @sentry/node @sentry/nextjs
npm install winston morgan

# Setup health checks
# Create monitoring dashboard
# Configure alerts
```

### Log Management

```javascript
// winston configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'safespot-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:all
      
      - name: Run security audit
        run: npm audit --audit-level moderate

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build backend
        run: |
          cd backend
          npm run build
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          script: |
            cd /var/www/safespot
            git pull origin main
            npm ci
            cd backend && npm run build
            cd ../frontend && npm run build
            pm2 restart ecosystem.config.js
            
      - name: Health check
        run: |
          sleep 30
          curl -f https://yourdomain.com/health || exit 1
```

---

## 🛡️ Security Checklist

### Pre-deployment Security

- [ ] Update all dependencies to latest versions
- [ ] Run security audit (`npm audit`)
- [ ] Configure HTTPS with valid SSL certificates
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Set secure HTTP headers
- [ ] Enable database encryption
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Review and secure environment variables
- [ ] Enable firewall and security groups
- [ ] Configure proper user permissions
- [ ] Set up log monitoring
- [ ] Enable database connection encryption
- [ ] Configure session security

### Post-deployment Security

- [ ] Verify SSL certificate installation
- [ ] Test rate limiting
- [ ] Verify CORS configuration
- [ ] Test authentication flows
- [ ] Verify database connections
- [ ] Test backup and recovery
- [ ] Monitor application logs
- [ ] Set up security alerts
- [ ] Run penetration testing
- [ ] Review access logs

---

## 📊 Performance Optimization

### Backend Optimization

```javascript
// Add database connection pooling
// Enable gzip compression
// Implement caching strategy
// Optimize database queries
// Add CDN for static assets
```

### Frontend Optimization

```javascript
// Next.js optimizations
// Image optimization
// Code splitting
// Lazy loading
// Service worker caching
```

---

## 🔄 Backup & Recovery

### Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U safespot_user safespot_production > "/backup/safespot_$DATE.sql"

# Compress backup
gzip "/backup/safespot_$DATE.sql"

# Remove old backups (keep 30 days)
find /backup -name "safespot_*.sql.gz" -mtime +30 -delete
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

---

## 🆘 Troubleshooting

### Common Deployment Issues

1. **Database Connection Failed**
   - Check database credentials
   - Verify network connectivity
   - Check firewall rules

2. **Frontend Build Failed**
   - Check Node.js version
   - Clear node_modules and reinstall
   - Check for missing environment variables

3. **SSL Certificate Issues**
   - Verify certificate expiration
   - Check certificate chain
   - Validate domain configuration

4. **High Memory Usage**
   - Check for memory leaks
   - Optimize database queries
   - Configure proper caching

### Monitoring Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs safespot-backend --lines 100

# Monitor resources
htop
df -h
free -h

# Check database performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t
```

---

## 📞 Support

For deployment support and questions:

- **Documentation**: Check troubleshooting guides
- **GitHub Issues**: Report deployment problems
- **Email**: DevOps team at devops@safespot.com
- **Emergency**: On-call support for critical issues

---

This deployment guide provides comprehensive instructions for deploying SafeSpot to production. Choose the deployment option that best fits your infrastructure requirements and security needs.
