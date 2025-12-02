# Integration Service Wiki

Welcome to the Integration Service documentation. This service provides unified integration with multiple communication platforms and secure VCS SSH key management.

## Quick Navigation

### Getting Started
- [Installation Guide](Installation-Guide)
- [Configuration](Configuration)
- [Quick Start](Quick-Start)

### API Documentation
- [Telegram API](Telegram-API)
- [Discord API](Discord-API)
- [Email API](Email-API)
- [VCS Key Management API](VCS-Key-Management-API)

### Setup Guides
- [Telegram Bot Setup](Telegram-Bot-Setup)
- [Discord Bot Setup](Discord-Bot-Setup)
- [Email SMTP Setup](Email-SMTP-Setup)
- [Database Setup](Database-Setup)
- [Docker Deployment](Docker-Deployment)

### Advanced Topics
- [VCS Security Model](VCS-Security-Model)
- [Key Rotation & Watchdog](Key-Rotation-Watchdog)
- [Monitoring & Metrics](Monitoring-Metrics)
- [Troubleshooting](Troubleshooting)

### Development
- [Architecture](Architecture)
- [Database Schema](Database-Schema)
- [API Examples](API-Examples)
- [Contributing](Contributing)

## Overview

The Integration Service is a Node.js microservice that provides:

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

## Features at a Glance

| Feature | Description | Status |
|---------|-------------|--------|
| Telegram Bot | Send/receive messages via Telegram | ✅ Active |
| Discord Bot | Send/receive messages via Discord | ✅ Active |
| Email Service | SMTP-based email with profiles | ✅ Active |
| SSH Key Generation | Ed25519 key pair creation | ✅ Active |
| Key Encryption | AES-256-GCM at rest | ✅ Active |
| Key Distribution | HMAC-signed delivery to Playground | ✅ Active |
| Automated Rotation | Time-based key rotation | ✅ Active |
| Watchdog | Auto-reinstallation monitoring | ✅ Active |
| Prometheus Metrics | VCS metrics export | ✅ Active |
| PostgreSQL Storage | Persistent data storage | ✅ Active |

## Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL 12+
- **Validation**: Joi
- **Security**: Helmet.js, CORS
- **Logging**: Morgan
- **Telegram**: node-telegram-bot-api
- **Discord**: discord.js
- **Email**: Nodemailer
- **Crypto**: Node.js native crypto module

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run init-db
npm run add-discord-tables
npm run add-vcs-keys-table

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start service
npm start
```

## API Endpoints Summary

### Health & Status
- `GET /api/health` - Service health check

### Telegram (3 endpoints)
- `POST /api/send-message` - Send message
- `GET /api/messages/:chatId` - Get history
- `GET /api/bot-status` - Bot status

### Discord (3 endpoints)
- `POST /api/discord/send-message` - Send message
- `GET /api/discord/messages/:userId` - Get history
- `GET /api/discord/bot-status` - Bot status

### Email (8 endpoints)
- `POST /api/email/sender-profiles` - Create sender
- `POST /api/email/recipient-profiles` - Create recipient
- `POST /api/email/send` - Send email
- `GET /api/email/sender-profiles` - List senders
- `GET /api/email/recipient-profiles` - List recipients
- `GET /api/email/logs` - Email history
- `POST /api/email/test-config/:profileId` - Test SMTP

### VCS Keys (10 endpoints)
- `POST /api/vcs/generate` - Generate key
- `POST /api/vcs/activate/:fingerprint` - Activate key
- `POST /api/vcs/activate` - Activate (body)
- `GET /api/vcs/active` - Get active key
- `POST /api/vcs/distribute/:fingerprint` - Distribute key
- `POST /api/vcs/test-connection` - Test SSH
- `POST /api/vcs/rotate-if-due` - Force rotation
- `POST /api/vcs/watchdog-check` - Force watchdog
- `GET /api/vcs/metrics` - Prometheus metrics

**Total: 25 API endpoints**

## Support

For issues, questions, or feature requests:
- GitHub Issues: [bom-fs/issues](https://github.com/ishan-saha/bom-fs/issues)
- Email: ishansaha@outlook.com

## License

MIT License - See LICENSE file for details
