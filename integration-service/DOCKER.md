# Docker Setup for CodeShuriken Integration Service

This directory contains Docker configuration for the CodeShuriken Integration Service - a multi-platform messaging service that supports Telegram, Discord, and Email integrations.

## Overview

The Integration Service is a Node.js microservice that provides:
- **Telegram Bot Integration** - Send messages via Telegram Bot API
- **Discord Bot Integration** - Send messages via Discord.js
- **Email Service** - Send emails via SMTP
- **PostgreSQL Database** - Store user profiles and message logs
- **RESTful API** - JSON-based messaging interface

## Files

- `Dockerfile` - Production build with security optimizations
- `Dockerfile.dev` - Development build with hot reloading
- `docker-compose.yml` - Multi-service orchestration with PostgreSQL
- `.dockerignore` - Files to exclude from Docker build context
- `database/email_schema.sql` - Email service database schema
- `scripts/init-db.js` - Database initialization script
- `scripts/add-discord-tables.js` - Discord tables setup

## Quick Start

### Production Deployment

```bash
# 1. Build and run all services
docker-compose up --build -d

# 2. Initialize database
docker-compose --profile init up db-init

# 3. Check service health
docker-compose ps
curl http://localhost:3000/api/health
```

**Access Points:**
- Integration Service: `http://localhost:3000`
- Database: `localhost:5433`
- Health Check: `http://localhost:3000/api/health`

### Development Mode

```bash
# Run development environment with live reloading
docker-compose --profile dev up --build -d

# Check logs
docker-compose logs -f integration-service-dev
```

**Access Points:**
- Development Service: `http://localhost:3001`
- Database: `localhost:5433`
- pgAdmin (optional): `http://localhost:8082` (admin@integration.local / admin)

### Database Management

```bash
# Include pgAdmin for database management
docker-compose --profile admin up -d pgadmin

# Access pgAdmin at http://localhost:8082
# Email: admin@integration.local
# Password: admin
```

## Configuration

### Environment Variables

#### Core Service Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | production | Environment mode |
| `PORT` | 3000 | Server port |
| `LOG_LEVEL` | info | Logging level |

#### Database Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `DB_HOST` | postgres | Database hostname |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | integration_service | Database name |
| `DB_USER` | postgres | Database username |
| `DB_PASSWORD` | postgres | Database password |

#### Bot Integration Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram Bot API token |
| `DISCORD_BOT_TOKEN` | Optional | Discord Bot token |

**Note:** The service runs in demo mode if bot tokens are not provided.

### Setting Up Bot Tokens

#### Telegram Bot Setup

1. Start a chat with [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command and follow instructions
3. Copy the bot token
4. Add to your environment:
   ```bash
   # Add to docker-compose.yml
   - TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   ```

#### Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token
4. Add to your environment:
   ```bash
   # Add to docker-compose.yml
   - DISCORD_BOT_TOKEN=your_discord_bot_token_here
   ```

## API Endpoints

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Telegram Integration

#### Send Telegram Message

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from CodeShuriken!",
    "receiver": "123456789"
  }'
```

#### Get Message History

```bash
curl http://localhost:3000/api/messages/123456789
```

#### Bot Status

```bash
curl http://localhost:3000/api/bot-status
```

### Discord Integration

#### Send Discord Message

```bash
curl -X POST http://localhost:3000/api/discord/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from CodeShuriken!",
    "receiver": "123456789012345678"
  }'
```

#### Get Discord Message History

```bash
curl http://localhost:3000/api/discord/messages/123456789012345678
```

#### Discord Bot Status

```bash
curl http://localhost:3000/api/discord/bot-status
```

### Email Service

#### Send Email

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "message": "Hello from CodeShuriken!"
  }'
```

## Database Schema

### Core Tables

#### Users Table (Telegram)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    chat_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Messages Table (Telegram)
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    telegram_message_id INTEGER,
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Email Tables
- `email_sender_profiles` - SMTP configurations
- `email_recipient_profiles` - Recipient information
- `email_logs` - Email activity logs

### Database Initialization

The database is automatically initialized with:

1. **Schema Creation**: All required tables and indexes
2. **Sample Data**: Optional test data (disabled by default)
3. **Triggers**: Automatic timestamp updates

```bash
# Manual database initialization
docker-compose --profile init up db-init
```

## Docker Commands

### Basic Operations

```bash
# Build services
docker-compose build

# Start all services
docker-compose up -d

# Start with database initialization
docker-compose up -d && docker-compose --profile init up db-init

# View logs
docker-compose logs -f integration-service

# Stop services
docker-compose down

# Remove volumes (delete data)
docker-compose down -v
```

### Development Commands

```bash
# Development mode with hot reloading
docker-compose --profile dev up -d

# Shell access to development container
docker-compose exec integration-service-dev sh

# Watch development logs
docker-compose logs -f integration-service-dev
```

### Database Commands

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d integration_service

# Run initialization scripts manually
docker-compose exec integration-service npm run init-db
docker-compose exec integration-service npm run add-discord-tables

# Backup database
docker-compose exec postgres pg_dump -U postgres integration_service > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres integration_service < backup.sql
```

## Service Features

### Production Container
- **Node.js 18 Alpine** for minimal footprint
- **Security hardening** with non-root user
- **Health checks** for monitoring
- **Multi-platform support** (Telegram, Discord, Email)
- **PostgreSQL integration** for data persistence

### Development Container
- **Hot reloading** with nodemon
- **Volume mounting** for live development
- **Full dev dependencies** included
- **Debug capabilities** enabled

## Monitoring and Health Checks

### Container Health

```bash
# Check container health status
docker-compose ps

# Test service health endpoint
curl -f http://localhost:3000/api/health
```

### Database Health

```bash
# PostgreSQL connection test
docker-compose exec postgres pg_isready -U postgres

# Database connectivity from service
docker-compose exec integration-service node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? 'Error: ' + err : 'Connected: ' + res.rows[0].now);
  pool.end();
});
"
```

### Bot Status Monitoring

```bash
# Check Telegram bot status
curl http://localhost:3000/api/bot-status

# Check Discord bot status  
curl http://localhost:3000/api/discord/bot-status
```

## Volume Management

### Persistent Volumes

- `postgres_data` - Database data persistence

### Development Volumes

- `.:/app` - Live code mounting for development
- `/app/node_modules` - Node modules persistence

## Security Features

### Container Security

- **Non-root user**: Service runs as `integration` user (UID 1001)
- **Alpine base**: Minimal attack surface
- **Production dependencies**: Only necessary packages in production
- **Environment isolation**: Separate dev/production configurations

### API Security

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input validation**: Joi schema validation
- **Error handling**: Comprehensive error management

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database status
docker-compose ps postgres

# Test database connection
docker-compose exec postgres psql -U postgres -l

# Check environment variables
docker-compose exec integration-service env | grep DB_
```

#### 2. Bot Token Issues

```bash
# Check if tokens are set
docker-compose exec integration-service node -e "
console.log('Telegram Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not Set');
console.log('Discord Token:', process.env.DISCORD_BOT_TOKEN ? 'Set' : 'Not Set');
"

# Test bot connectivity
curl http://localhost:3000/api/bot-status
curl http://localhost:3000/api/discord/bot-status
```

#### 3. Permission Issues

```bash
# Fix container permissions
sudo chown -R 1001:1001 .

# Check container user
docker-compose exec integration-service whoami
```

#### 4. Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3002:3000"  # Change host port
  - "5434:5432"  # Change database port
```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment
docker-compose exec integration-service sh -c "
export LOG_LEVEL=debug
export NODE_ENV=development
npm run dev
"
```

## Integration with Other Services

### Scanner Service Integration

The integration service can receive notifications from the scanner service:

```bash
# Example webhook endpoint (implement as needed)
curl -X POST http://localhost:3000/api/webhook/scan-complete \
  -H "Content-Type: application/json" \
  -d '{
    "scan_id": "scan_123",
    "status": "completed",
    "vulnerabilities": 15
  }'
```

### Reporting Service Integration

Send report notifications via messaging platforms:

```bash
# Notify via Telegram when report is ready
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Security report ready: http://reports.example.com/report_123",
    "receiver": "admin_chat_id"
  }'
```

## Production Deployment

### Resource Requirements

- **Memory**: 512MB minimum (1GB recommended)
- **CPU**: 1 core minimum
- **Storage**: 5GB for database and logs
- **Network**: Internet access for bot APIs

### Environment Configuration

Create a production environment file:

```bash
# .env.production
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=integration_service
DB_USER=integration_user
DB_PASSWORD=secure_password

# Bot Tokens (keep secure!)
TELEGRAM_BOT_TOKEN=your_telegram_token
DISCORD_BOT_TOKEN=your_discord_token
```

### Security Considerations

1. **Use strong database passwords**
2. **Secure bot tokens** (use Docker secrets)
3. **Enable HTTPS** in production
4. **Regular security updates** of dependencies
5. **Monitor logs** for suspicious activity
6. **Backup database** regularly

### Scaling

For high-load scenarios:

```yaml
# docker-compose.override.yml
services:
  integration-service:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## Support

For technical support:

1. **Check logs**: `docker-compose logs -f integration-service`
2. **Verify health**: `curl http://localhost:3000/api/health`
3. **Test database**: `docker-compose exec postgres psql -U postgres -d integration_service`
4. **Check bot status**: API endpoints for bot status
5. **Review configuration**: Environment variables and tokens

## API Documentation

For complete API documentation, see the individual service README files and API documentation in the `API_REFERENCE.md` file.
