# Integration Service

A comprehensive Node.js microservice providing unified integration with multiple communication platforms (Telegram, Discord, Email) and secure VCS (Version Control System) SSH key management for private repository access.

## Features

### Communication Services
- **Telegram Integration** - Bot-based messaging with history tracking
- **Discord Integration** - Direct messaging with user history
- **Email Service** - Profile-based SMTP email sending

### VCS Key Management
- **SSH Key Generation** - Ed25519 key pair creation
- **Secure Storage** - AES-256-GCM encryption at rest
- **Automated Rotation** - Time-based key lifecycle management
- **Watchdog Monitoring** - Automatic key reinstallation
- **Prometheus Metrics** - Exportable observability data

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run init-db
npm run add-discord-tables
npm run add-vcs-keys-table
npm run add-vcs-key-events-table

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start service
npm start
```

## API Endpoints

### Health & Status
- `GET /api/health` - Service health check

### Telegram (3 endpoints)
- `POST /api/send-message` - Send message
- `GET /api/messages/:chatId` - Get message history
- `GET /api/bot-status` - Bot connection status

### Discord (3 endpoints)
- `POST /api/discord/send-message` - Send message
- `GET /api/discord/messages/:userId` - Get message history
- `GET /api/discord/bot-status` - Bot connection status

### Email (8 endpoints)
- `POST /api/email/sender-profiles` - Create sender profile
- `POST /api/email/recipient-profiles` - Create recipient profile
- `POST /api/email/send` - Send email
- `GET /api/email/sender-profiles` - List sender profiles
- `GET /api/email/recipient-profiles` - List recipient profiles
- `GET /api/email/logs` - Get email logs
- `POST /api/email/test-config/:profileId` - Test SMTP config

### VCS Key Management (10 endpoints)
- `POST /api/vcs/generate` - Generate SSH key
- `POST /api/vcs/activate/:fingerprint` - Activate key
- `POST /api/vcs/activate` - Activate key (body)
- `GET /api/vcs/active` - Get active key
- `POST /api/vcs/distribute/:fingerprint` - Distribute key
- `POST /api/vcs/test-connection` - Test SSH connection
- `POST /api/vcs/rotate-if-due` - Force rotation check
- `POST /api/vcs/watchdog-check` - Force watchdog check
- `GET /api/vcs/metrics` - Prometheus metrics

**Total: 25 API endpoints**

## Environment Configuration

Create `.env` file with:

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

### Generate Encryption Key

**Linux/macOS:**
```bash
head -c 32 /dev/urandom | base64
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Usage Examples

### Send Telegram Message

```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from Integration Service!",
    "receiver": "123456789"
  }'
```

### Send Discord Message

```bash
curl -X POST http://localhost:3000/api/discord/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "123456789012345678",
    "message": "Hello Discord!"
  }'
```

### Generate VCS SSH Key

```bash
# Generate key
curl -X POST http://localhost:3000/api/vcs/generate

# Activate key (after adding to GitHub)
curl -X POST http://localhost:3000/api/vcs/activate \
  -H "Content-Type: application/json" \
  -d '{"fingerprint": "SHA256:abc123..."}'

# Test connection
curl -X POST http://localhost:3000/api/vcs/test-connection
```

## Docker Deployment

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL 12+
- **Validation**: Joi
- **Security**: Helmet.js, CORS
- **Telegram**: node-telegram-bot-api
- **Discord**: discord.js
- **Email**: Nodemailer
- **Crypto**: Node.js native crypto

## Documentation

For complete documentation, see the [Wiki](wiki/Home):

- [Installation Guide](wiki/Installation-Guide)
- [Telegram API](wiki/Telegram-API)
- [Discord API](wiki/Discord-API)
- [Email API](wiki/Email-API)
- [VCS Key Management API](wiki/VCS-Key-Management-API)
- [API Examples](wiki/API-Examples)

## Security Features

### VCS Key Security
- Ed25519 SSH keys (256-bit)
- AES-256-GCM encryption at rest
- HMAC-signed key distribution
- Tmpfs storage in Playground (memory-only)
- Automatic key rotation (default: 30 days)
- Watchdog monitoring for key presence

## Database Schema

The service uses PostgreSQL with the following tables:
- `messages` - Telegram message logs
- `users` - Telegram user information
- `discord_messages` - Discord message logs
- `sender_profiles` - Email sender configurations
- `recipient_profiles` - Email recipient information
- `email_logs` - Email sending history
- `vcs_keys` - SSH key metadata (encrypted)
- `vcs_key_events` - Key lifecycle audit log

## Monitoring

### Health Checks

```bash
# Service health
curl http://localhost:3000/api/health

# Telegram bot status
curl http://localhost:3000/api/bot-status

# Discord bot status
curl http://localhost:3000/api/discord/bot-status

# VCS active key
curl http://localhost:3000/api/vcs/active
```

### Prometheus Metrics

```bash
# VCS key metrics
curl http://localhost:3000/api/vcs/metrics
```

Metrics include:
- `vcs_keys_generated_total` - Total keys generated
- `vcs_keys_activated_total` - Total keys activated
- `vcs_keys_rotation_events_total` - Rotation events
- `vcs_active_key_age_seconds` - Active key age

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U postgres -d integration_service
```

### Bot Not Responding

**Telegram:**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- User must send `/start` to bot first
- Check bot logs for errors

**Discord:**
- Verify `DISCORD_BOT_TOKEN` is correct
- Bot must share server with user
- Check bot has DM permissions

### VCS Key Issues

```bash
# Check active key
curl http://localhost:3000/api/vcs/active

# Force key redistribution
curl -X POST http://localhost:3000/api/vcs/watchdog-check

# Test SSH connection
curl -X POST http://localhost:3000/api/vcs/test-connection
```

## Development

### Run in Development Mode

```bash
npm run dev
```

### Database Migrations

```bash
# Initialize base tables
npm run init-db

# Add Discord tables
npm run add-discord-tables

# Add VCS tables
npm run add-vcs-keys-table
npm run add-vcs-key-events-table
```

### Test VCS Cycle

```bash
npm run test-vcs-cycle
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests:
- GitHub Issues: [bom-fs/issues](https://github.com/ishan-saha/bom-fs/issues)
- Email: ishansaha@outlook.com

## Changelog

### v1.0.0 (2025-12-02)
- Initial release
- Telegram integration
- Discord integration
- Email service with profiles
- VCS SSH key management
- Automated key rotation
- Watchdog monitoring
- Prometheus metrics
