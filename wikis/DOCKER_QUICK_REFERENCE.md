# 🚀 BOM Docker Quick Reference

## One-Command Deployment

### Windows (PowerShell)
```powershell
.\deploy.ps1 deploy
```

### Linux/Mac (Bash)
```bash
chmod +x deploy.sh && ./deploy.sh deploy
```

### Direct Docker Compose
```bash
docker-compose up -d --build
```

## Access Points

| Service | URL | Access |
|---------|-----|--------|
| **Frontend** | http://localhost:3000 | ✅ PUBLIC |
| Backend (bom-be) | http://bom-be:8001 | ❌ Internal Only |
| Integration Service | http://integration-service:3000 | ❌ Internal Only |
| Playground Service | http://playground-service:8000 | ❌ Internal Only |

## Common Commands

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove data
docker-compose down -v

# Restart a service
docker-compose restart <service-name>

# View resource usage
docker stats
```

## Service Management (PowerShell)

```powershell
.\deploy.ps1 deploy      # Start all services
.\deploy.ps1 stop        # Stop all services
.\deploy.ps1 restart     # Restart all services
.\deploy.ps1 logs        # View logs
.\deploy.ps1 health      # Check health
.\deploy.ps1 backup      # Backup databases
.\deploy.ps1 clean       # Remove everything
```

## Quick Health Check

```bash
# Check all services
docker-compose ps

# Test frontend
curl http://localhost:3000

# Test internal services (from frontend container)
docker exec bom-frontend curl http://bom-be:8001/
docker exec bom-frontend curl http://integration-service:3000/api/health
docker exec bom-frontend curl http://playground-service:8000/health
```

## Container Names

| Service | Container Name |
|---------|---------------|
| Frontend | `bom-frontend` |
| Auth Backend | `bom-auth-service` |
| Integration | `bom-integration-service` |
| Playground | `bom-playground-service` |
| Postgres Auth | `bom-postgres-auth` |
| Postgres Integration | `bom-postgres-integration` |

## Network Info

- **Name**: `bom`
- **Subnet**: 172.20.0.0/16
- **Type**: Isolated bridge network
- **Public Port**: Only 3000 (frontend)

## Namespace Labels

All containers have:
```yaml
com.bom.namespace: "bom"
com.bom.service: "<service>"
com.bom.access: "public|internal"
```

## Filter by Namespace

```bash
# List BOM containers
docker ps --filter "label=com.bom.namespace=bom"

# Stop BOM containers
docker stop $(docker ps --filter "label=com.bom.namespace=bom" -q)

# Remove BOM containers
docker rm $(docker ps -a --filter "label=com.bom.namespace=bom" -q)

# Stats for BOM containers
docker stats $(docker ps --filter "label=com.bom.namespace=bom" -q)
```

## Backup Commands

```bash
# Backup auth database
docker exec bom-postgres-auth pg_dump -U bom_user bom_auth_db > backup-auth.sql

# Backup integration database
docker exec bom-postgres-integration pg_dump -U postgres integration_service > backup-integration.sql

# Restore auth database
docker exec -i bom-postgres-auth psql -U bom_user bom_auth_db < backup-auth.sql

# Restore integration database
docker exec -i bom-postgres-integration psql -U postgres integration_service < backup-integration.sql
```

## Troubleshooting

### Service won't start
```bash
docker-compose logs <service-name>
docker-compose restart <service-name>
docker-compose up -d --build <service-name>
```

### View specific service logs
```bash
docker-compose logs -f sbom-fe          # Frontend
docker-compose logs -f bom-be           # Auth backend
docker-compose logs -f integration-service
docker-compose logs -f playground-service
docker-compose logs -f postgres-auth
```

### Connect to database
```bash
# Auth database
docker exec -it bom-postgres-auth psql -U bom_user -d bom_auth_db

# Integration database
docker exec -it bom-postgres-integration psql -U postgres -d integration_service
```

### Inspect network
```bash
docker network inspect bom
```

### Nuclear option (reset everything)
```bash
docker-compose down -v
docker rm -f $(docker ps -a --filter "label=com.bom.namespace=bom" -q)
docker network rm bom
docker volume prune -f
docker-compose up -d --build
```

## Configuration

### Before First Run
1. Copy `.env.example` to `.env`
2. Edit `.env` and configure SMTP settings
3. Run deployment command

### Environment Variables (in .env)
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@bom.com
VERIFICATION_URL_BASE=http://localhost:3000/auth/verify
TELEGRAM_BOT_TOKEN=          # Optional
DISCORD_BOT_TOKEN=           # Optional
```

## Production Deployment

```bash
# Use production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Resource Limits (Production)

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| Frontend | 2.0 | 2GB |
| Auth Backend | 1.0 | 1GB |
| Integration | 1.0 | 1GB |
| Playground | 1.0 | 512MB |
| Postgres Auth | 1.0 | 2GB |
| Postgres Integration | 1.0 | 2GB |

## Health Check Endpoints

| Service | Endpoint | Method |
|---------|----------|--------|
| Frontend | http://localhost:3000/ | GET |
| Auth Backend | http://bom-be:8001/ | GET |
| Integration | http://integration-service:3000/api/health | GET |
| Playground | http://playground-service:8000/health | GET |

## Monitoring

```bash
# All services status
docker-compose ps

# Resource usage
docker stats

# Logs (all services)
docker-compose logs -f

# Logs (last 100 lines)
docker-compose logs --tail=100 -f

# Logs (specific service, last 50 lines)
docker-compose logs --tail=50 -f sbom-fe
```

## Volumes

- `postgres_auth_data` - Auth database data
- `postgres_integration_data` - Integration database data

```bash
# List volumes
docker volume ls --filter "label=com.bom.namespace=bom"

# Inspect volume
docker volume inspect postgres_auth_data

# Backup volume
docker run --rm -v postgres_auth_data:/data -v $(pwd):/backup alpine tar czf /backup/auth-data.tar.gz /data

# Restore volume
docker run --rm -v postgres_auth_data:/data -v $(pwd):/backup alpine tar xzf /backup/auth-data.tar.gz -C /
```

## Documentation

- **DOCKER_DEPLOYMENT.md** - Full deployment guide (500+ lines)
- **DOCKER_SETUP_SUMMARY.md** - Setup summary and changes
- **README.md** - Project overview with Docker section
- **QUICKSTART.md** - Quick start guide
- **ARCHITECTURE.md** - Architecture diagrams

## Support

For detailed documentation, see:
- Docker Deployment: `DOCKER_DEPLOYMENT.md`
- Setup Summary: `DOCKER_SETUP_SUMMARY.md`
- Architecture: `ARCHITECTURE.md`

---

**Tip**: Use `.\deploy.ps1` (Windows) or `./deploy.sh` (Linux/Mac) for interactive menu!
