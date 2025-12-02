# Installation Guide

Complete installation guide for the Integration Service.

## Prerequisites

Before installing, ensure you have:

- **Node.js** 16.x or higher
- **npm** 7.x or higher
- **PostgreSQL** 12.x or higher
- **Git** (for cloning repository)

### Optional Prerequisites
- **Telegram Bot Token** (for Telegram features)
- **Discord Bot Token** (for Discord features)
- **SMTP Server Access** (for email features)

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/ishan-saha/bom-fs.git
cd bom-fs/integration-service
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- express
- cors
- helmet
- morgan
- joi
- node-telegram-bot-api
- discord.js
- nodemailer
- pg (PostgreSQL client)
- dotenv

### 3. Database Setup

#### Create Database

```bash
# Using psql
createdb integration_service

# Or using SQL
psql -U postgres
CREATE DATABASE integration_service;
\q
```

#### Run Migrations

```bash
# Initialize base tables
npm run init-db

# Add Discord tables
npm run add-discord-tables

# Add VCS key management tables
npm run add-vcs-keys-table

# Add VCS key events table
npm run add-vcs-key-events-table
```

### 4. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=integration_service
DB_USER=postgres
DB_PASSWORD=your_password

# Telegram (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TEST_CHAT_ID=your_test_chat_id

# Discord (Optional)
DISCORD_BOT_TOKEN=your_discord_bot_token

# VCS Key Management
INTEGRATION_SHARED_SECRET=min-32-character-secret
INTEGRATION_VCS_KEY_ENC_KEY=base64-encoded-32-byte-key
PLAYGROUND_BASE_URL=http://playground-service:8000

# VCS Settings
VCS_ROTATION_DAYS=30
VCS_RETAIN_INACTIVE=3
VCS_WATCHDOG_INTERVAL_SEC=300
VCS_ROTATION_CHECK_INTERVAL_HOURS=6
```

#### Generate Encryption Key

**Linux/macOS:**
```bash
head -c 32 /dev/urandom | base64
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Verify Installation

```bash
# Start service
npm start

# Check health endpoint
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-12-02T10:00:00.000Z",
  "service": "Telegram & Discord Integration Service"
}
```

## Verification Checklist

- [ ] Node.js 16+ installed
- [ ] PostgreSQL database created
- [ ] All migrations run successfully
- [ ] `.env` file configured
- [ ] Service starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Database connections working

## Post-Installation

### Setup Telegram Bot (Optional)
See [Telegram Bot Setup](Telegram-Bot-Setup)

### Setup Discord Bot (Optional)
See [Discord Bot Setup](Discord-Bot-Setup)

### Setup Email (Optional)
See [Email SMTP Setup](Email-SMTP-Setup)

### Docker Deployment (Optional)
See [Docker Deployment](Docker-Deployment)

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Change port in .env
PORT=3001
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U postgres -d integration_service
```

### Migration Errors

```bash
# Drop and recreate database
dropdb integration_service
createdb integration_service

# Run migrations again
npm run init-db
npm run add-discord-tables
npm run add-vcs-keys-table
npm run add-vcs-key-events-table
```

## Next Steps

- [Configuration Guide](Configuration)
- [Quick Start Tutorial](Quick-Start)
- [API Documentation](Home#api-documentation)
