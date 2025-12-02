# Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### 1. Environment Setup

Copy the environment template and configure:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- SMTP settings for email verification
- Bot tokens (if using integration features)
- Update VERIFICATION_URL_BASE for your domain

### 2. Deploy All Services

```bash
# Build and start all services in the bom namespace
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- **Frontend (Public)**: http://localhost:3000
- Backend services are only accessible internally via the `bom` network

### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Internet/Users                       │
└────────────────────────┬────────────────────────────────┘
                         │ Port 3000 (Public)
                         ▼
              ┌──────────────────────┐
              │   sbom-fe (Next.js)  │ ◄── Only Public Service
              │   Container: bom-    │
              │     frontend         │
              └──────────┬───────────┘
                         │
            ┌────────────┼────────────┐
            │    bom Network          │
            │  (172.20.0.0/16)        │
            │                         │
     ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
     │   bom-be    │  │ integration │  │ playground  │
     │ Auth API    │  │  service    │  │  service    │
     │ :8001       │  │   :3000     │  │   :8000     │
     └──────┬──────┘  └──────┬──────┘  └─────────────┘
            │                │
     ┌──────▼──────┐  ┌──────▼──────┐
     │ postgres-   │  │ postgres-   │
     │   auth      │  │ integration │
     │  :5432      │  │   :5432     │
     └─────────────┘  └─────────────┘
```

## 📦 Services

### 1. **sbom-fe** (Frontend - Public)
- **Access**: Public (0.0.0.0:3000)
- **Purpose**: Next.js web application
- **Dependencies**: All backend services
- **Network**: bom (internal) + exposed port

### 2. **bom-be** (Authentication Service - Internal)
- **Access**: Internal only (via bom network)
- **Purpose**: User authentication, email verification
- **Port**: 8001 (internal)
- **Database**: postgres-auth

### 3. **integration-service** (Internal)
- **Access**: Internal only
- **Purpose**: Integration with external services (Telegram, Discord)
- **Port**: 3000 (internal)
- **Database**: postgres-integration

### 4. **playground-service** (Internal)
- **Access**: Internal only
- **Purpose**: SBOM generation and analysis
- **Port**: 8000 (internal)
- **Security**: Read-only filesystem, resource limits

### 5. **postgres-auth** (Database - Internal)
- **Access**: Internal only
- **Purpose**: Authentication database
- **Port**: 5432 (internal)

### 6. **postgres-integration** (Database - Internal)
- **Access**: Internal only
- **Purpose**: Integration service database
- **Port**: 5432 (internal)

## 🔒 Security Features

### Network Isolation
- All services run in isolated `bom` network (172.20.0.0/16)
- Only frontend exposed to public (port 3000)
- Backend services accessible only via internal network
- No direct database access from outside

### Container Security
- All services run as non-root users
- Playground service: read-only filesystem, dropped capabilities
- Resource limits on playground service (1 CPU, 512MB RAM)
- Health checks on all services

### Labels & Namespace
All containers tagged with:
- `com.bom.namespace: "bom"` - Namespace identifier
- `com.bom.service: "<service>"` - Service identifier
- `com.bom.access: "public|internal"` - Access level

## 🔧 Configuration

### Production Deployment

1. **Update Database Passwords**:
   Edit `docker-compose.yml` and change default passwords for:
   - postgres-auth: `POSTGRES_PASSWORD`
   - postgres-integration: `POSTGRES_PASSWORD`
   - bom-be: `DATABASE_URL` connection string

2. **Configure SMTP**:
   Update `.env` with your email provider settings

3. **Update Frontend URLs**:
   In `.env`, set `VERIFICATION_URL_BASE` to your production domain:
   ```
   VERIFICATION_URL_BASE=https://yourdomain.com/auth/verify
   ```

4. **Enable HTTPS**:
   Add reverse proxy (nginx/traefik) in front of frontend:
   ```yaml
   # Example nginx service
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx.conf:/etc/nginx/nginx.conf:ro
       - ./ssl:/etc/nginx/ssl:ro
     depends_on:
       - sbom-fe
     networks:
       - bom
   ```

### Scaling Services

Scale specific services:
```bash
# Scale integration service to 3 instances
docker-compose up -d --scale integration-service=3

# Scale playground service to 2 instances
docker-compose up -d --scale playground-service=2
```

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f sbom-fe
docker-compose logs -f bom-be

# Last 100 lines
docker-compose logs --tail=100 -f
```

### Health Checks
```bash
# Check all service health
docker-compose ps

# Inspect specific container
docker inspect bom-frontend
```

### Resource Usage
```bash
# View resource usage
docker stats

# View only bom namespace
docker stats $(docker ps --filter "label=com.bom.namespace=bom" -q)
```

## 🔍 Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs <service-name>

# Rebuild specific service
docker-compose up -d --build <service-name>

# Restart service
docker-compose restart <service-name>
```

### Database connection issues
```bash
# Check database health
docker-compose ps postgres-auth postgres-integration

# Connect to database manually
docker exec -it bom-postgres-auth psql -U bom_user -d bom_auth_db
docker exec -it bom-postgres-integration psql -U postgres -d integration_service
```

### Frontend can't connect to backend
```bash
# Verify network
docker network inspect bom

# Check backend health from frontend container
docker exec -it bom-frontend curl http://bom-be:8001/
docker exec -it bom-frontend curl http://integration-service:3000/api/health
docker exec -it bom-frontend curl http://playground-service:8000/health
```

### Reset everything
```bash
# Stop all services and remove volumes
docker-compose down -v

# Remove all bom containers
docker rm -f $(docker ps -a --filter "label=com.bom.namespace=bom" -q)

# Remove bom network
docker network rm bom

# Start fresh
docker-compose up -d --build
```

## 🧪 Testing

### Test Complete Flow
```bash
# 1. Ensure all services are running
docker-compose ps

# 2. Access frontend
open http://localhost:3000

# 3. Test signup flow
# - Navigate to /auth/signup
# - Fill in form (avoid disposable emails)
# - Check email for verification link
# - Click verification link
# - Login at /auth/login

# 4. Test API endpoints from frontend container
docker exec -it bom-frontend sh
curl http://bom-be:8001/
curl http://integration-service:3000/api/health
curl http://playground-service:8000/health
```

## 📈 Production Checklist

- [ ] Change all default passwords in docker-compose.yml
- [ ] Configure SMTP with production email service
- [ ] Update VERIFICATION_URL_BASE to production domain
- [ ] Add reverse proxy with HTTPS (nginx/traefik)
- [ ] Configure firewall rules (only allow 80/443)
- [ ] Set up log aggregation (ELK, Loki, etc.)
- [ ] Configure backup for PostgreSQL volumes
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure resource limits for production load
- [ ] Enable Docker secrets for sensitive data
- [ ] Set up automatic container health recovery
- [ ] Configure log rotation
- [ ] Test disaster recovery procedures

## 🚨 Emergency Commands

### Backup Databases
```bash
# Backup auth database
docker exec bom-postgres-auth pg_dump -U bom_user bom_auth_db > backup-auth-$(date +%Y%m%d).sql

# Backup integration database
docker exec bom-postgres-integration pg_dump -U postgres integration_service > backup-integration-$(date +%Y%m%d).sql
```

### Restore Databases
```bash
# Restore auth database
docker exec -i bom-postgres-auth psql -U bom_user bom_auth_db < backup-auth-20250103.sql

# Restore integration database
docker exec -i bom-postgres-integration psql -U postgres integration_service < backup-integration-20250103.sql
```

### Quick Recovery
```bash
# If a service is unhealthy, restart it
docker-compose restart <service-name>

# If restart doesn't work, recreate the container
docker-compose up -d --force-recreate <service-name>

# Nuclear option: restart everything
docker-compose restart
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Docker Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs -f <service>`
2. Review health: `docker-compose ps`
3. Inspect network: `docker network inspect bom`
4. Check service connectivity from frontend container
