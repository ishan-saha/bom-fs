# 🚀 BOM-FS Deployment Guide

## Overview
This guide covers deploying the entire BOM-FS stack using Docker Compose with security best practices.

## Security Features

### ✅ Non-Root Users
All services run as non-root users for enhanced security:

| Service | User ID | User Name | Security Level |
|---------|---------|-----------|----------------|
| postgres-auth | postgres (default) | postgres | Database isolation |
| postgres-integration | postgres (default) | postgres | Database isolation |
| bom-be (Backend) | 1000 | bomuser | Application user |
| integration-service | 1001 | integration | Application user |
| playground-service | 1001 | playground | Sandboxed execution |
| sbom-fe (Frontend) | 1001 | nextjs | Web server user |

### 🔒 Security Configurations

#### All Services Include:
- ✅ **no-new-privileges**: Prevents privilege escalation
- ✅ **cap_drop: ALL**: Drops all Linux capabilities by default
- ✅ **read_only: true**: Read-only root filesystem
- ✅ **tmpfs mounts**: Writable temporary directories with restrictions

#### Database Services (PostgreSQL):
```yaml
security_opt:
  - no-new-privileges:true
read_only: true
tmpfs:
  - /tmp:rw,noexec,nosuid,size=100m
  - /var/run/postgresql:rw,noexec,nosuid,size=50m
```

#### Application Services:
```yaml
user: "1000:1000"  # or 1001:1001
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
read_only: true
tmpfs:
  - /tmp:rw,noexec,nosuid,size=100m
```

#### Playground Service (Additional Security):
```yaml
cap_add:
  - CHOWN
  - SETGID
  - SETUID
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
tmpfs:
  - /tmp:rw,noexec,nosuid,size=500m
  - /home/playground:rw,noexec,nosuid,size=200m
```

## Prerequisites

### Required Software
- Docker 24.0+ with Docker Compose V2
- 4GB+ RAM available
- 20GB+ disk space
- Linux, macOS, or Windows with WSL2

### Required Environment Variables
Create a `.env` file in the project root:

```bash
# Base URL (production domain or localhost for dev)
BASE_URL=http://localhost:3000

# SMTP Configuration (for email verification)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@bom.com
SMTP_FROM_NAME=BOM Platform

# Optional: Bot tokens for notifications
TELEGRAM_BOT_TOKEN=your-telegram-token
DISCORD_BOT_TOKEN=your-discord-token
```

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd bom-fs
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

### 3. Build and Start All Services
```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### 4. Verify Deployment
```bash
# Check all services are healthy
docker compose ps

# View logs
docker compose logs -f

# Check specific service
docker compose logs -f bom-frontend
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: Internal only (http://bom-auth-service:8001)
- **Integration Service**: Internal only (http://bom-integration-service:3000)
- **Playground Service**: Internal only (http://bom-playground-service:8000)

## Service Startup Order

Services start in the following order due to dependencies:

```
1. postgres-auth (Database for auth)
2. postgres-integration (Database for integration)
3. playground-service (SBOM generation)
4. bom-be (Backend API - depends on postgres-auth, playground-service)
5. integration-service (Integrations - depends on postgres-integration)
6. sbom-fe (Frontend - depends on all above)
```

## Database Migration

### Run Initial Migration
```bash
# Access backend container
docker compose exec bom-be bash

# Run migration
python migrate_database.py

# Exit container
exit
```

### Verify Migration
```bash
# Connect to auth database
docker compose exec postgres-auth psql -U bom_user -d bom_auth_db

# Check tables
\dt

# Check user schema
\d users

# Check scan_history schema
\d scan_history

# Exit
\q
```

## Health Checks

All services include health checks:

```bash
# Check health status
docker compose ps

# Expected output:
# NAME                        STATUS
# bom-auth-service           Up (healthy)
# bom-frontend               Up (healthy)
# bom-integration-service    Up (healthy)
# bom-playground-service     Up (healthy)
# bom-postgres-auth          Up (healthy)
# bom-postgres-integration   Up (healthy)
```

## Common Operations

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f bom-frontend
docker compose logs -f bom-be

# Last 100 lines
docker compose logs --tail=100
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart bom-frontend
docker compose restart bom-be
```

### Stop Services
```bash
# Stop all (keep data)
docker compose stop

# Stop and remove containers (keep data)
docker compose down

# Stop and remove everything including volumes (⚠️ DATA LOSS)
docker compose down -v
```

### Update Services
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose build
docker compose up -d

# Rebuild specific service
docker compose build bom-frontend
docker compose up -d bom-frontend
```

### Access Container Shell
```bash
# Backend
docker compose exec bom-be sh

# Frontend
docker compose exec sbom-fe sh

# Database
docker compose exec postgres-auth psql -U bom_user -d bom_auth_db
```

## Resource Limits

### Current Configuration

| Service | CPU Limit | Memory Limit | Notes |
|---------|-----------|--------------|-------|
| postgres-auth | Unlimited | Unlimited | Database needs flexibility |
| postgres-integration | Unlimited | Unlimited | Database needs flexibility |
| bom-be | Unlimited | Unlimited | API server |
| integration-service | Unlimited | Unlimited | Integration handler |
| playground-service | 2.0 CPUs | 1GB | Resource-intensive SBOM generation |
| sbom-fe | Unlimited | Unlimited | Frontend server |

### Adjust Resource Limits (if needed)

Edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

## Network Configuration

### Internal Network
- **Network Name**: `bom`
- **Driver**: bridge
- **Subnet**: 172.20.0.0/16
- **Access**: Internal only (except frontend)

### Port Exposure
- **Frontend**: 3000 → 3000 (Public)
- **All other services**: Internal only (no port exposure)

### Service Communication
```
Frontend → Backend:        http://bom-auth-service:8001
Frontend → Integration:    http://bom-integration-service:3000
Frontend → Playground:     http://bom-playground-service:8000
Backend  → Database:       postgres-auth:5432
Backend  → Playground:     http://bom-playground-service:8000
Integration → Database:    postgres-integration:5432
```

## Data Persistence

### Volumes
```bash
# List volumes
docker volume ls | grep bom

# Inspect volume
docker volume inspect bom_postgres_auth_data

# Backup database
docker compose exec postgres-auth pg_dump -U bom_user bom_auth_db > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres-auth psql -U bom_user -d bom_auth_db
```

### Volume Locations
- `postgres_auth_data`: PostgreSQL data for authentication
- `postgres_integration_data`: PostgreSQL data for integrations

## Security Checklist

Before deploying to production:

- [ ] Change all default passwords in `docker-compose.yml`
- [ ] Update `SECRET_KEY` in backend environment
- [ ] Configure valid SMTP credentials
- [ ] Set production `BASE_URL`
- [ ] Enable HTTPS/TLS (add reverse proxy like Nginx/Traefik)
- [ ] Review and adjust resource limits
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure log aggregation
- [ ] Set up automated backups
- [ ] Review network security groups/firewall rules
- [ ] Implement rate limiting at reverse proxy level
- [ ] Set up SSL certificates (Let's Encrypt)

## Production Deployment

### With Reverse Proxy (Nginx)

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment-Specific Compose Files

```bash
# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Monitoring

### Container Stats
```bash
# Real-time stats
docker stats

# Specific containers
docker stats bom-frontend bom-auth-service
```

### Health Status API
```bash
# Check backend health
curl http://localhost:8001/

# Check integration service health
docker compose exec integration-service curl http://localhost:3000/api/health

# Check playground health
docker compose exec playground-service curl http://localhost:8000/health
```

## Troubleshooting

### Services Won't Start

**Problem**: Container exits immediately
```bash
# Check logs
docker compose logs bom-frontend

# Common issues:
# - Permission errors: Check user IDs match in Dockerfile
# - Port conflicts: Ensure port 3000 is not in use
# - Missing dependencies: Rebuild images
```

**Solution**:
```bash
# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

### Database Connection Errors

**Problem**: Backend can't connect to database
```bash
# Check database is healthy
docker compose ps postgres-auth

# Check database logs
docker compose logs postgres-auth

# Verify connection
docker compose exec postgres-auth psql -U bom_user -d bom_auth_db -c "SELECT 1;"
```

### Permission Denied Errors

**Problem**: Application can't write to directories
```bash
# Check if tmpfs is mounted
docker compose exec bom-frontend mount | grep tmp

# Verify user ID
docker compose exec bom-frontend id
```

**Solution**: Ensure Dockerfile creates user with correct UID:
```dockerfile
RUN adduser --system --uid 1001 nextjs
```

### Out of Memory

**Problem**: Services crashing due to memory
```bash
# Check memory usage
docker stats --no-stream

# Increase memory limits in docker-compose.yml
```

### Slow Performance

**Problem**: Scans taking too long
```bash
# Check playground service resources
docker stats bom-playground-service

# Increase limits if needed
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 2G
```

## Maintenance

### Regular Tasks

**Daily**:
- Monitor logs for errors
- Check disk space usage
- Review container health status

**Weekly**:
- Backup databases
- Review resource usage
- Check for security updates

**Monthly**:
- Update base images
- Review and rotate logs
- Update dependencies

### Backup Strategy

```bash
# Automated backup script (backup.sh)
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup auth database
docker compose exec -T postgres-auth pg_dump -U bom_user bom_auth_db > \
  ${BACKUP_DIR}/auth_db_${DATE}.sql

# Backup integration database
docker compose exec -T postgres-integration pg_dump -U postgres integration_service > \
  ${BACKUP_DIR}/integration_db_${DATE}.sql

# Compress backups
gzip ${BACKUP_DIR}/*.sql

# Remove backups older than 30 days
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${DATE}"
```

## Useful Commands Reference

```bash
# Build and start
docker compose up -d --build

# Stop all services
docker compose down

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f bom-frontend

# Restart service
docker compose restart bom-frontend

# Scale service (if supported)
docker compose up -d --scale bom-frontend=3

# Remove all containers and volumes (⚠️ DATA LOSS)
docker compose down -v

# Execute command in container
docker compose exec bom-be python migrate_database.py

# Connect to database
docker compose exec postgres-auth psql -U bom_user -d bom_auth_db

# Check container resource usage
docker stats

# Prune unused resources
docker system prune -a

# View container details
docker inspect bom-frontend
```

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Verify health: `docker compose ps`
3. Review documentation
4. Check GitHub issues

## Summary

Your BOM-FS deployment includes:
- ✅ All services running as non-root users
- ✅ Security hardening (no-new-privileges, cap_drop)
- ✅ Read-only filesystems with tmpfs for write operations
- ✅ Health checks for all services
- ✅ Resource limits for resource-intensive services
- ✅ Internal network isolation
- ✅ Persistent data volumes
- ✅ Automated dependency management
- ✅ Comprehensive logging

**Your application is now secure and production-ready!** 🎉
