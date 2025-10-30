# JARVIS Deployment Guide

## Overview

This guide covers deploying JARVIS in various environments: local development, production server, Docker, and cloud platforms.

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- (Optional) Docker for containerized deployment
- (Optional) Cloud platform account (Vercel, AWS, etc.)

## Local Development

### Setup

```bash
# Clone repository
git clone https://github.com/Senpai-Sama7/jarvis.git
cd jarvis

# Run setup script
./scripts/setup-dev.sh

# Configure environment
cp .env.example .env
# Edit .env and add your API keys
```

### Running Services

```bash
# CLI Interface
npm run start:cli

# HTTP API
npm run start:api

# Web Interface
npm run dev
```

## Production Server

### Build for Production

```bash
# Install dependencies
npm install --production

# Build core
npm run build:core

# Build web interface
npm run build

# Set production environment
export NODE_ENV=production
```

### Environment Variables

Create a `.env.production` file:

```env
# Required
GROQ_API_KEY=your_production_api_key

# Optional
NODE_ENV=production
API_PORT=8080
WEB_PORT=3000
LOG_LEVEL=info
API_KEY=your_secure_api_key_for_authentication
```

### Running in Production

#### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start API server
pm2 start dist/interfaces/api/index.js --name jarvis-api

# Start web interface
pm2 start npm --name jarvis-web -- start

# Save configuration
pm2 save

# Setup auto-restart
pm2 startup
```

#### Using systemd

Create `/etc/systemd/system/jarvis-api.service`:

```ini
[Unit]
Description=JARVIS API Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/jarvis
Environment="NODE_ENV=production"
EnvironmentFile=/path/to/jarvis/.env.production
ExecStart=/usr/bin/node dist/interfaces/api/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable jarvis-api
sudo systemctl start jarvis-api
sudo systemctl status jarvis-api
```

### Nginx Configuration

Create `/etc/nginx/sites-available/jarvis`:

```nginx
# API Server
server {
    listen 80;
    server_name api.jarvis.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Web Interface
server {
    listen 80;
    server_name jarvis.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/jarvis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d jarvis.yourdomain.com -d api.jarvis.yourdomain.com
```

## Docker Deployment

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source
COPY . .

# Build application
RUN npm run build:core

# Expose ports
EXPOSE 3000 8080

# Start command (override with docker-compose)
CMD ["npm", "start"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  jarvis-api:
    build: .
    container_name: jarvis-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - API_PORT=8080
    env_file:
      - .env.production
    command: node dist/interfaces/api/index.js

  jarvis-web:
    build: .
    container_name: jarvis-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - WEB_PORT=3000
    env_file:
      - .env.production
    command: npm start

  nginx:
    image: nginx:alpine
    container_name: jarvis-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - jarvis-api
      - jarvis-web
```

### Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Cloud Deployment

### Vercel (Web Interface)

The Next.js web interface can be deployed to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - GROQ_API_KEY
# - ANTHROPIC_API_KEY (if using)
```

Or use the Vercel dashboard:
1. Import GitHub repository
2. Configure environment variables
3. Deploy

### AWS EC2

```bash
# Connect to EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Clone and setup
git clone https://github.com/Senpai-Sama7/jarvis.git
cd jarvis
./scripts/setup-dev.sh

# Configure environment
nano .env.production

# Install PM2
npm install -g pm2

# Start services
pm2 start dist/interfaces/api/index.js --name jarvis-api
pm2 start npm --name jarvis-web -- start
pm2 save
pm2 startup
```

### AWS Lambda (API Only)

For serverless deployment, wrap the API in a Lambda handler:

```javascript
// lambda.js
const serverless = require('serverless-http');
const { app } = require('./dist/interfaces/api/index');

module.exports.handler = serverless(app);
```

### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-jarvis-api

# Set environment variables
heroku config:set GROQ_API_KEY=your_key
heroku config:set NODE_ENV=production

# Create Procfile
echo "web: node dist/interfaces/api/index.js" > Procfile

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## Security Checklist

Before deploying to production:

- [ ] Rotate all API keys
- [ ] Enable authentication (`API_KEY` environment variable)
- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Set appropriate CORS origins
- [ ] Enable input sanitization
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules
- [ ] Set up backups
- [ ] Review and update dependencies

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","timestamp":"...","version":"2.0.0"}
```

### Logging

Configure logging level:

```env
LOG_LEVEL=info  # debug, info, warn, error
```

View logs with PM2:

```bash
pm2 logs jarvis-api
pm2 logs jarvis-web
```

### Performance Monitoring

Consider integrating:
- New Relic
- Datadog
- Sentry (for error tracking)
- Prometheus + Grafana

## Backup and Recovery

### Database Backup

If using a database for conversation history:

```bash
# Backup
pg_dump jarvis_db > backup.sql

# Restore
psql jarvis_db < backup.sql
```

### Configuration Backup

```bash
# Backup configs
tar -czf config-backup.tar.gz config/ .env.production

# Restore
tar -xzf config-backup.tar.gz
```

## Scaling

### Horizontal Scaling

Use a load balancer with multiple API instances:

```yaml
# docker-compose-scaled.yml
version: '3.8'

services:
  jarvis-api:
    build: .
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    command: node dist/interfaces/api/index.js

  load-balancer:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - jarvis-api
```

### Caching

Add Redis for caching:

```yaml
services:
  redis:
    image: redis:alpine
    container_name: jarvis-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port
lsof -i :8080
# Kill process
kill -9 <PID>
```

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build:core
```

**API key not working:**
```bash
# Verify environment variable
echo $GROQ_API_KEY
# Restart service
pm2 restart jarvis-api
```

## Support

For deployment issues:
- GitHub Issues: https://github.com/Senpai-Sama7/jarvis/issues
- Documentation: See `docs/` directory
