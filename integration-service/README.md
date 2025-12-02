# Integration Service API

A comprehensive Node.js microservice providing unified integration with multiple communication platforms (Telegram, Discord, Email) and secure VCS (Version Control System) SSH key management for private repository access.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [Telegram API](#telegram-api)
  - [Discord API](#discord-api)
  - [Email API](#email-api)
  - [VCS Key Management API](#vcs-key-management-api)
- [Database Schema](#database-schema)
- [Security Model](#security-model)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## Features

### Communication Services
- **Telegram Integration** - Send messages via Telegram Bot API with message history tracking
- **Discord Integration** - Send messages via Discord Bot with user message history
- **Email Service** - SMTP-based email sending with sender/recipient profile management

### VCS Key Management
- **SSH Key Generation** - Automated Ed25519 SSH key pair generation for Git operations
- **Secure Key Storage** - AES-256-GCM encryption of private keys at rest
- **Key Rotation** - Automatic key rotation based on age with retention policies
- **Key Distribution** - HMAC-signed secure delivery to Playground service
- **Watchdog Monitoring** - Automatic key reinstallation detection and recovery
- **Prometheus Metrics** - Exportable metrics for observability

### Infrastructure
- **PostgreSQL Database** - Persistent storage for profiles, logs, and key metadata
- **REST API** - Comprehensive RESTful endpoints with Joi validation
- **Security** - Helmet.js security headers, CORS support, error handling
- **Logging** - Morgan HTTP request logging
- **Health Checks** - Service status monitoring endpoints

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Integration Service                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Telegram   │  │   Discord    │  │    Email     │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           VCS Key Management Service                │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │  Key Gen    │  │  Encryption  │  │ Rotation │ │   │
│  │  └─────────────┘  └──────────────┘  └──────────┘ │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │Distribution │  │  Watchdog    │  │ Metrics  │ │   │
│  │  └─────────────┘  └──────────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                     │  │
│  │  • vcs_keys        • vcs_key_events                 │  │
│  │  • sender_profiles • recipient_profiles             │  │
│  │  • email_logs      • messages                       │  │
│  │  • users           • discord_messages               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                                    │
           │ HMAC-Signed Key Distribution       │
           ▼                                    ▼
   ┌──────────────────┐              ┌──────────────────┐
   │ Playground       │              │  External Apps   │
   │ Service          │              │  (API Clients)   │
   └──────────────────┘              └──────────────────┘
```

---

## Prerequisites

- **Node.js** 16.x or higher
- **PostgreSQL** 12.x or higher
- **Telegram Bot Token** (optional, for Telegram features)
- **Discord Bot Token** (optional, for Discord features)
- **SMTP Server Access** (optional, for email features)

---

## Installation

### 1. Clone Repository

```bash
cd integration-service
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Create PostgreSQL database and run migrations:

```bash
# Create database
createdb integration_service

# Initialize tables
npm run init-db
npm run add-discord-tables
npm run add-vcs-keys-table
npm run add-vcs-key-events-table
```

### 4. Environment Configuration

Create `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TEST_CHAT_ID=your_telegram_chat_id_for_testing

# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=integration_service
DB_USER=postgres
DB_PASSWORD=your_database_password

# VCS Key Management Configuration
INTEGRATION_SHARED_SECRET=your-shared-secret-min-32-chars
INTEGRATION_VCS_KEY_ENC_KEY=base64-encoded-32-byte-encryption-key
PLAYGROUND_BASE_URL=http://playground-service:8000

# VCS Rotation & Watchdog Settings
VCS_ROTATION_DAYS=30
VCS_RETAIN_INACTIVE=3
VCS_WATCHDOG_INTERVAL_SEC=300
VCS_ROTATION_CHECK_INTERVAL_HOURS=6
```

Generate encryption key:

```bash
# Linux/macOS
head -c 32 /dev/urandom | base64

# PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 5. Start Service

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

---

## Configuration

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | HTTP server port | `3000` | No |
| `NODE_ENV` | Environment mode (`development`/`production`) | `development` | No |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | - | For Telegram |
| `DISCORD_BOT_TOKEN` | Discord Bot token | - | For Discord |
| `DB_HOST` | PostgreSQL host | `localhost` | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | Yes |
| `DB_NAME` | Database name | - | Yes |
| `DB_USER` | Database user | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `INTEGRATION_SHARED_SECRET` | HMAC signature secret for key distribution | - | For VCS |
| `INTEGRATION_VCS_KEY_ENC_KEY` | Base64-encoded 32-byte AES key | - | For VCS |
| `PLAYGROUND_BASE_URL` | Playground service URL | `http://playground-service:8000` | For VCS |
| `VCS_ROTATION_DAYS` | Days before key rotation | `30` | No |
| `VCS_RETAIN_INACTIVE` | Number of inactive keys to retain | `3` | No |
| `VCS_WATCHDOG_INTERVAL_SEC` | Watchdog check interval (seconds) | `300` | No |
| `VCS_ROTATION_CHECK_INTERVAL_HOURS` | Rotation check interval (hours) | `6` | No |

---

## API Reference

Base URL: `http://localhost:3000`

### Health Check

#### `GET /api/health`

Check service health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-02T10:00:00.000Z",
  "service": "Telegram & Discord Integration Service"
}
```

---

## Telegram API

### Send Message

#### `POST /api/send-message`

Send a message to a Telegram user.

**Request Body:**
```json
{
  "message": "Hello from Integration Service!",
  "receiver": "123456789"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message text (1-4096 characters) |
| `receiver` | string | Yes | Telegram chat ID (numbers only) |

**Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "chatId": "123456789",
    "messageId": 42,
    "timestamp": "2025-12-02T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid message format
- `403` - Bot blocked by user
- `404` - Chat not found
- `500` - Internal server error

---

### Get Message History

#### `GET /api/messages/:chatId`

Retrieve message history for a specific chat.

**Parameters:**
- `chatId` (path) - Telegram chat ID
- `limit` (query, optional) - Number of messages to retrieve (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "chatId": "123456789",
    "messages": [
      {
        "id": 1,
        "chat_id": "123456789",
        "message": "Hello!",
        "sent_at": "2025-12-02T10:00:00.000Z",
        "status": "sent"
      }
    ],
    "count": 1
  }
}
```

---

### Get Bot Status

#### `GET /api/bot-status`

Get Telegram bot connection status and information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "bot": {
      "id": 123456789,
      "username": "your_bot",
      "firstName": "Your Bot Name",
      "canJoinGroups": true,
      "canReadAllGroupMessages": false,
      "supportsInlineQueries": false
    }
  }
}
```

---

## Discord API

### Send Message

#### `POST /api/discord/send-message`

Send a message to a Discord user.

**Request Body:**
```json
{
  "receiver": "123456789012345678",
  "message": "Hello from Integration Service!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `receiver` | string | Yes | Discord user ID |
| `message` | string | Yes | Message text (max 2000 characters) |

**Response (200):**
```json
{
  "success": true,
  "message": "Discord message sent successfully",
  "data": {
    "userId": "123456789012345678",
    "messageId": "987654321098765432",
    "timestamp": "2025-12-02T10:00:00.000Z",
    "demo": false
  }
}
```

---

### Get Message History

#### `GET /api/discord/messages/:userId`

Retrieve Discord message history for a user.

**Parameters:**
- `userId` (path) - Discord user ID
- `limit` (query, optional) - Number of messages (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "123456789012345678",
    "messages": [
      {
        "id": 1,
        "user_id": "123456789012345678",
        "message": "Hello!",
        "sent_at": "2025-12-02T10:00:00.000Z",
        "status": "sent"
      }
    ],
    "count": 1
  }
}
```

---

### Get Bot Status

#### `GET /api/discord/bot-status`

Get Discord bot connection status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "bot": {
      "id": "123456789012345678",
      "username": "YourBot#1234",
      "discriminator": "1234"
    }
  }
}
```

---

## Email API

### Create Sender Profile

#### `POST /api/email/sender-profiles`

Create a new email sender profile with SMTP configuration.

**Request Body:**
```json
{
  "email": "sender@example.com",
  "password": "smtp_password",
  "sender_name": "John Doe",
  "organization": "Acme Corp",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_secure": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Sender email address |
| `password` | string | Yes | SMTP password (min 8 chars) |
| `sender_name` | string | Yes | Display name (2-255 chars) |
| `organization` | string | No | Organization name |
| `smtp_host` | string | Yes | SMTP server hostname |
| `smtp_port` | number | No | SMTP port (default: 587) |
| `smtp_secure` | boolean | No | Use SSL/TLS (default: false) |

**Response (201):**
```json
{
  "success": true,
  "message": "Sender profile created successfully",
  "data": {
    "id": 1,
    "email": "sender@example.com",
    "sender_name": "John Doe",
    "organization": "Acme Corp",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "created_at": "2025-12-02T10:00:00.000Z"
  }
}
```

---

### Create Recipient Profile

#### `POST /api/email/recipient-profiles`

Create a new email recipient profile.

**Request Body:**
```json
{
  "email": "recipient@example.com",
  "name": "Jane Smith",
  "category": "customer",
  "notes": "VIP customer"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Recipient email address |
| `name` | string | No | Recipient name |
| `category` | string | No | Category (default: 'general') |
| `notes` | string | No | Additional notes (max 1000 chars) |

**Response (201):**
```json
{
  "success": true,
  "message": "Recipient profile created successfully",
  "data": {
    "id": 1,
    "email": "recipient@example.com",
    "name": "Jane Smith",
    "category": "customer",
    "created_at": "2025-12-02T10:00:00.000Z"
  }
}
```

---

### Send Email

#### `POST /api/email/send`

Send email using sender and recipient profiles.

**Request Body:**
```json
{
  "sender_profile_id": 1,
  "recipient_profile_id": 1,
  "subject": "Hello from Integration Service",
  "body": "This is a test email message."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sender_profile_id` | number | Yes | Sender profile ID |
| `recipient_profile_id` | number | Yes | Recipient profile ID |
| `subject` | string | No | Email subject (max 500 chars) |
| `body` | string | No | Email body (max 10000 chars) |

**Response (200):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<abc123@mail.example.com>",
    "from": "sender@example.com",
    "to": "recipient@example.com",
    "subject": "Hello from Integration Service",
    "timestamp": "2025-12-02T10:00:00.000Z"
  }
}
```

---

### Get Sender Profiles

#### `GET /api/email/sender-profiles`

Retrieve all sender profiles.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "sender@example.com",
      "sender_name": "John Doe",
      "organization": "Acme Corp",
      "smtp_host": "smtp.gmail.com",
      "smtp_port": 587,
      "created_at": "2025-12-02T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Recipient Profiles

#### `GET /api/email/recipient-profiles`

Retrieve all recipient profiles.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "recipient@example.com",
      "name": "Jane Smith",
      "category": "customer",
      "created_at": "2025-12-02T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Email Logs

#### `GET /api/email/logs`

Retrieve email sending history.

**Parameters:**
- `limit` (query, optional) - Number of logs (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sender_profile_id": 1,
      "recipient_profile_id": 1,
      "subject": "Hello",
      "status": "sent",
      "sent_at": "2025-12-02T10:00:00.000Z",
      "error_message": null
    }
  ],
  "count": 1
}
```

---

### Test Email Configuration

#### `POST /api/email/test-config/:profileId`

Test SMTP configuration for a sender profile.

**Response (200):**
```json
{
  "success": true,
  "message": "Email configuration test successful",
  "data": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "connection": "successful"
  }
}
```

---

## VCS Key Management API

### Generate SSH Key

#### `POST /api/vcs/generate`

Generate a new Ed25519 SSH key pair for VCS operations.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "fingerprint": "SHA256:abc123...",
    "public_key": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... codeshuriken-integration",
    "status": "pending"
  }
}
```

**Process:**
1. Generates Ed25519 key pair
2. Encrypts private key with AES-256-GCM
3. Stores metadata in database
4. Returns public key for GitHub/GitLab deployment

**Next Steps:**
- Add public key to your GitHub organization deploy keys
- Call `/api/vcs/activate/:fingerprint` to mark key as active

---

### Activate SSH Key

#### `POST /api/vcs/activate/:fingerprint`

Activate a pending SSH key after deploying to VCS provider.

**Parameters:**
- `fingerprint` (path) - Key fingerprint (SHA256:...)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fingerprint": "SHA256:abc123...",
    "status": "active",
    "activated_at": "2025-12-02T10:00:00.000Z"
  }
}
```

**Alternate Endpoint:** `POST /api/vcs/activate` (with `fingerprint` in JSON body)

**Automatic Actions:**
- Deactivates previous active key
- Distributes private key to Playground service
- Triggers watchdog monitoring

---

### Activate SSH Key (Body)

#### `POST /api/vcs/activate`

Alternative activation endpoint accepting fingerprint in request body.

**Request Body:**
```json
{
  "fingerprint": "SHA256:abc123..."
}
```

**Response:** Same as above

**Use Case:** Avoids URL encoding issues with special characters in fingerprint

---

### Distribute SSH Key

#### `POST /api/vcs/distribute/:fingerprint`

Manually distribute active key to Playground service.

**Parameters:**
- `fingerprint` (path) - Active key fingerprint

**Response (200):**
```json
{
  "success": true,
  "data": {
    "distributed": true,
    "playground_response": {
      "success": true,
      "fingerprint": "SHA256:abc123...",
      "installed": true
    }
  }
}
```

**Use Case:** Recovery after Playground service restart

---

### Get Active Key

#### `GET /api/vcs/active`

Retrieve currently active SSH key metadata.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "fingerprint": "SHA256:abc123...",
    "public_key": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...",
    "status": "active",
    "created_at": "2025-11-15T10:00:00.000Z",
    "activated_at": "2025-11-15T10:05:00.000Z",
    "last_tested_at": "2025-12-02T10:00:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "No active key"
}
```

---

### Test VCS Connection

#### `POST /api/vcs/test-connection`

Test SSH connectivity to GitHub using installed key.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "playground_status": "connected",
    "ssh_test": "successful",
    "github_auth": true
  }
}
```

**Process:**
1. Ensures Playground has active key installed
2. Delegates to Playground `/vcs/test` endpoint
3. Returns SSH connection test results

---

### Force Rotation Check

#### `POST /api/vcs/rotate-if-due`

Manually trigger rotation evaluation.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rotated": true,
    "previous": "SHA256:old123...",
    "newFingerprint": "SHA256:new456...",
    "reason": "Key age exceeded rotation threshold"
  }
}
```

**Response (if not due):**
```json
{
  "success": true,
  "data": {
    "rotated": false,
    "reason": "Active key is still within rotation period"
  }
}
```

**Rotation Triggers:**
- Active key age >= `VCS_ROTATION_DAYS`
- Manual invocation via this endpoint

---

### Force Watchdog Check

#### `POST /api/vcs/watchdog-check`

Manually trigger watchdog verification.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "action": "redistributed",
    "reason": "Key not installed on Playground",
    "result": {
      "distributed": true,
      "fingerprint": "SHA256:abc123..."
    }
  }
}
```

**Actions:**
- `none` - Key already installed
- `redistributed` - Key was missing and reinstalled
- `no_active_key` - No active key to monitor

---

### Get Prometheus Metrics

#### `GET /api/vcs/metrics`

Export VCS key management metrics in Prometheus format.

**Response (200):**
```
# HELP vcs_keys_generated_total Total number of SSH keys generated
# TYPE vcs_keys_generated_total counter
vcs_keys_generated_total 5

# HELP vcs_keys_activated_total Total number of keys activated
# TYPE vcs_keys_activated_total counter
vcs_keys_activated_total 5

# HELP vcs_keys_redistributions_total Total manual redistributions
# TYPE vcs_keys_redistributions_total counter
vcs_keys_redistributions_total 2

# HELP vcs_keys_watchdog_redistributions_total Watchdog-triggered redistributions
# TYPE vcs_keys_watchdog_redistributions_total counter
vcs_keys_watchdog_redistributions_total 1

# HELP vcs_keys_rotation_events_total Total key rotation events
# TYPE vcs_keys_rotation_events_total counter
vcs_keys_rotation_events_total 1

# HELP vcs_keys_purge_events_total Total key purge events
# TYPE vcs_keys_purge_events_total counter
vcs_keys_purge_events_total 2

# HELP vcs_active_key_age_seconds Age of active key in seconds
# TYPE vcs_active_key_age_seconds gauge
vcs_active_key_age_seconds 1234567
```

---

## Database Schema

### Telegram Tables

#### `messages`
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'sent'
);
```

#### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Discord Tables

#### `discord_messages`
```sql
CREATE TABLE discord_messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'sent'
);
```

### Email Tables

#### `sender_profiles`
```sql
CREATE TABLE sender_profiles (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `recipient_profiles`
```sql
CREATE TABLE recipient_profiles (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  category VARCHAR(100) DEFAULT 'general',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `email_logs`
```sql
CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  sender_profile_id INTEGER REFERENCES sender_profiles(id),
  recipient_profile_id INTEGER REFERENCES recipient_profiles(id),
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### VCS Tables

#### `vcs_keys`
```sql
CREATE TABLE vcs_keys (
  id SERIAL PRIMARY KEY,
  fingerprint VARCHAR(255) UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  private_key_enc BYTEA NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  last_tested_at TIMESTAMP
);
```

#### `vcs_key_events`
```sql
CREATE TABLE vcs_key_events (
  id SERIAL PRIMARY KEY,
  fingerprint VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Security Model

### VCS Key Security

#### 1. Key Generation
- **Algorithm:** Ed25519 (modern, secure SSH key type)
- **Key Size:** 256-bit (equivalent to 3072-bit RSA)
- **Format:** OpenSSH format for public key, PKCS8 PEM for private key

#### 2. Encryption at Rest
- **Algorithm:** AES-256-GCM (Authenticated Encryption)
- **Key Derivation:** SHA-256 hash of `INTEGRATION_VCS_KEY_ENC_KEY`
- **IV:** 12-byte random nonce per encryption
- **Auth Tag:** 16-byte authentication tag for integrity
- **Storage:** `IV || AUTH_TAG || CIPHERTEXT` as PostgreSQL BYTEA

#### 3. Key Distribution
- **Transport:** HTTPS POST to Playground `/vcs/install`
- **Authentication:** HMAC-SHA256 signature in `X-Integration-Signature` header
- **Payload:** JSON with `fingerprint` and `privateKey` (PEM format)
- **Validation:** Playground verifies HMAC before accepting key

#### 4. Runtime Storage
- **Location:** Playground tmpfs mount `/app/ssh` (memory-backed filesystem)
- **Permissions:** 600 (owner read/write only)
- **Lifecycle:** Ephemeral - cleared on container restart
- **Recovery:** Watchdog automatically reinstalls on detection

#### 5. Key Rotation
- **Trigger:** Key age >= `VCS_ROTATION_DAYS` (default: 30 days)
- **Process:** 
  1. Generate new key pair
  2. Activate new key (deactivates old)
  3. Distribute to Playground
  4. Purge excess inactive keys (retain `VCS_RETAIN_INACTIVE`)
- **Manual:** `POST /api/vcs/rotate-if-due`

#### 6. Access Control
- No API endpoint returns private key material
- Private keys only transmitted during initial distribution
- HMAC prevents unauthorized key installation
- Fingerprint serves as stable public identifier

---

## Usage Examples

### Telegram Workflow

```bash
# 1. Send a message
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from Integration Service!",
    "receiver": "123456789"
  }'

# 2. Get message history
curl http://localhost:3000/api/messages/123456789?limit=10

# 3. Check bot status
curl http://localhost:3000/api/bot-status
```

### Discord Workflow

```bash
# 1. Send a Discord message
curl -X POST http://localhost:3000/api/discord/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "123456789012345678",
    "message": "Hello Discord!"
  }'

# 2. Get message history
curl http://localhost:3000/api/discord/messages/123456789012345678

# 3. Check bot status
curl http://localhost:3000/api/discord/bot-status
```

### Email Workflow

```bash
# 1. Create sender profile
curl -X POST http://localhost:3000/api/email/sender-profiles \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sender@gmail.com",
    "password": "app_password",
    "sender_name": "John Doe",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587
  }'

# 2. Create recipient profile
curl -X POST http://localhost:3000/api/email/recipient-profiles \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recipient@example.com",
    "name": "Jane Smith"
  }'

# 3. Send email
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "sender_profile_id": 1,
    "recipient_profile_id": 1,
    "subject": "Test Email",
    "body": "This is a test email."
  }'

# 4. Check email logs
curl http://localhost:3000/api/email/logs?limit=10
```

### VCS Key Management Workflow

```bash
# 1. Generate new SSH key
curl -X POST http://localhost:3000/api/vcs/generate

# Output:
# {
#   "success": true,
#   "data": {
#     "fingerprint": "SHA256:abc123...",
#     "public_key": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...",
#     "status": "pending"
#   }
# }

# 2. Add public key to GitHub
# Go to: https://github.com/settings/keys
# Click "New SSH key", paste the public_key value

# 3. Activate the key
curl -X POST http://localhost:3000/api/vcs/activate \
  -H "Content-Type: application/json" \
  -d '{"fingerprint": "SHA256:abc123..."}'

# 4. Test connection
curl -X POST http://localhost:3000/api/vcs/test-connection

# 5. Check active key
curl http://localhost:3000/api/vcs/active

# 6. Monitor metrics
curl http://localhost:3000/api/vcs/metrics
```

### Python Client Example

```python
import requests

BASE_URL = "http://localhost:3000"

# Send Telegram message
def send_telegram_message(chat_id, message):
    response = requests.post(
        f"{BASE_URL}/api/send-message",
        json={"message": message, "receiver": chat_id}
    )
    return response.json()

# Send Discord message
def send_discord_message(user_id, message):
    response = requests.post(
        f"{BASE_URL}/api/discord/send-message",
        json={"receiver": user_id, "message": message}
    )
    return response.json()

# Generate VCS SSH key
def generate_vcs_key():
    response = requests.post(f"{BASE_URL}/api/vcs/generate")
    return response.json()

# Activate VCS key
def activate_vcs_key(fingerprint):
    response = requests.post(
        f"{BASE_URL}/api/vcs/activate",
        json={"fingerprint": fingerprint}
    )
    return response.json()

# Usage
result = send_telegram_message("123456789", "Hello!")
print(result)

key_data = generate_vcs_key()
print(f"Generated key: {key_data['data']['fingerprint']}")
```

---

## Troubleshooting

### Telegram Issues

**Problem:** "Chat not found" error

**Solution:**
- User must start conversation with bot first
- Send `/start` command to bot
- Verify chat ID is correct

---

**Problem:** Bot not responding

**Solution:**
- Check `TELEGRAM_BOT_TOKEN` is valid
- Verify bot is not blocked by user
- Check service logs for API errors

---

### Discord Issues

**Problem:** "User not found" error

**Solution:**
- Verify Discord user ID is correct
- Check bot has DM permissions
- User must share a server with bot

---

**Problem:** Bot offline

**Solution:**
- Check `DISCORD_BOT_TOKEN` is valid
- Verify bot has proper intents enabled
- Ensure bot is invited to server

---

### Email Issues

**Problem:** SMTP authentication failure

**Solution:**
- For Gmail: Use App Password, not regular password
- Enable "Less secure app access" (if applicable)
- Check SMTP host and port are correct

---

**Problem:** Email not delivered

**Solution:**
- Check spam/junk folder
- Verify recipient email is valid
- Check email logs for error details

---

### VCS Key Issues

**Problem:** Key distribution fails

**Solution:**
```bash
# Check shared secret matches
echo $INTEGRATION_SHARED_SECRET

# Verify Playground URL
echo $PLAYGROUND_BASE_URL

# Check Playground logs
docker logs playground-service

# Manually redistribute
curl -X POST http://localhost:3000/api/vcs/distribute/SHA256:abc123...
```

---

**Problem:** SSH test fails after activation

**Solution:**
```bash
# Verify key is installed on Playground
curl http://playground-service:8000/vcs/status

# Check GitHub deploy key is added
# Go to: https://github.com/org/repo/settings/keys

# Re-activate key
curl -X POST http://localhost:3000/api/vcs/activate \
  -H "Content-Type: application/json" \
  -d '{"fingerprint": "SHA256:abc123..."}'
```

---

**Problem:** Watchdog not redistributing key

**Solution:**
```bash
# Check watchdog is running
docker logs integration-service | grep VCS-Watchdog

# Manually trigger watchdog
curl -X POST http://localhost:3000/api/vcs/watchdog-check

# Check environment variables
echo $VCS_WATCHDOG_INTERVAL_SEC
```

---

**Problem:** Rotation not occurring

**Solution:**
```bash
# Check rotation settings
echo $VCS_ROTATION_DAYS
echo $VCS_ROTATION_CHECK_INTERVAL_HOURS

# Manually trigger rotation
curl -X POST http://localhost:3000/api/vcs/rotate-if-due

# Check active key age
curl http://localhost:3000/api/vcs/active | jq '.data.created_at'
```

---

**Problem:** Encryption key error

**Solution:**
```bash
# Generate new encryption key
head -c 32 /dev/urandom | base64

# Update .env
INTEGRATION_VCS_KEY_ENC_KEY=<new_base64_key>

# Note: Existing keys will be unrecoverable
# Regenerate all keys after changing encryption key
```

---

### Database Issues

**Problem:** Connection refused

**Solution:**
- Check PostgreSQL is running
- Verify `DB_HOST`, `DB_PORT` are correct
- Check firewall/network settings

---

**Problem:** Table doesn't exist

**Solution:**
```bash
# Run all migrations
npm run init-db
npm run add-discord-tables
npm run add-vcs-keys-table
npm run add-vcs-key-events-table
```

---

## Monitoring & Observability

### Health Checks

```bash
# Service health
curl http://localhost:3000/api/health

# Telegram bot
curl http://localhost:3000/api/bot-status

# Discord bot
curl http://localhost:3000/api/discord/bot-status

# VCS active key
curl http://localhost:3000/api/vcs/active
```

### Prometheus Metrics

```bash
# VCS key metrics
curl http://localhost:3000/api/vcs/metrics
```

Integrate with Prometheus by adding to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'integration-service'
    static_configs:
      - targets: ['integration-service:3000']
    metrics_path: '/api/vcs/metrics'
```

### Logging

Service uses Morgan for HTTP logging and console logging for events:

```bash
# View logs
docker logs -f integration-service

# Filter VCS events
docker logs integration-service | grep VCS

# Filter errors
docker logs integration-service | grep ERROR
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: ishansaha@outlook.com

---

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
