# VCS SSH Key Setup Guide

## Overview
This guide explains how to generate, activate, and test SSH keys for VCS (Version Control System) integration. The system uses Ed25519 SSH keys for secure repository access.

## Table of Contents
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Step-by-Step Setup](#step-by-step-setup)
- [Testing Scripts](#testing-scripts)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Option 1: Complete Setup (Recommended)
Use the all-in-one endpoint that performs all steps automatically:

```bash
# Using curl
curl -X POST http://localhost:3001/vcs/setup-complete

# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/vcs/setup-complete" -Method Post
```

### Option 2: Node.js Script
```bash
node scripts/setup-vcs-key.js
```

### Option 3: PowerShell Script
```powershell
.\scripts\test-vcs-key.ps1
```

## API Endpoints

### 1. Complete Setup Flow
**POST** `/vcs/setup-complete`

Performs all setup steps in one request:
1. Generate SSH key pair
2. Activate the key
3. Distribute to Playground service
4. Test the connection

**Response:**
```json
{
  "success": true,
  "message": "SSH key setup completed successfully",
  "summary": {
    "fingerprint": "SHA256:abc123...",
    "public_key": "ssh-ed25519 AAAAC3... codeshuriken-integration",
    "status": "active",
    "tested": true
  },
  "steps": [
    {
      "step": 1,
      "action": "generate",
      "status": "success",
      "fingerprint": "SHA256:abc123...",
      "public_key": "ssh-ed25519 AAAAC3..."
    },
    {
      "step": 2,
      "action": "activate",
      "status": "success",
      "fingerprint": "SHA256:abc123...",
      "active": true
    },
    {
      "step": 3,
      "action": "distribute",
      "status": "success",
      "fingerprint": "SHA256:abc123...",
      "playground_response": {}
    },
    {
      "step": 4,
      "action": "test",
      "status": "success",
      "test_result": {}
    }
  ]
}
```

---

### 2. Generate SSH Key
**POST** `/vcs/generate`

Generates a new Ed25519 SSH key pair and stores it in the database.

**Response:**
```json
{
  "success": true,
  "data": {
    "fingerprint": "SHA256:abc123...",
    "public_key": "ssh-ed25519 AAAAC3... codeshuriken-integration",
    "status": "pending"
  }
}
```

---

### 3. Activate Key
**POST** `/vcs/activate/:fingerprint`

Or with JSON body:

**POST** `/vcs/activate`
```json
{
  "fingerprint": "SHA256:abc123..."
}
```

Activates a key and automatically distributes it to Playground.

**Response:**
```json
{
  "success": true,
  "data": {
    "fingerprint": "SHA256:abc123...",
    "active": true,
    "status": "active"
  }
}
```

---

### 4. Get Active Key
**GET** `/vcs/active`

Retrieves the currently active SSH key.

**Response:**
```json
{
  "success": true,
  "data": {
    "fingerprint": "SHA256:abc123...",
    "public_key": "ssh-ed25519 AAAAC3...",
    "status": "active",
    "active": true
  }
}
```

---

### 5. Test Connection
**POST** `/vcs/test-connection`

Tests the connection to Playground service and verifies SSH key installation.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Connection successful"
  }
}
```

---

### 6. Distribute Key
**POST** `/vcs/distribute/:fingerprint`

Manually distributes the active key to Playground service.

**Response:**
```json
{
  "success": true,
  "data": {
    "redistributed": true,
    "fingerprint": "SHA256:abc123...",
    "playground": {}
  }
}
```

---

### 7. Rotate Key (If Due)
**POST** `/vcs/rotate-if-due`

Checks if key rotation is due based on `VCS_ROTATION_DAYS` and rotates if necessary.

**Response:**
```json
{
  "success": true,
  "data": {
    "rotated": false,
    "fingerprint": "SHA256:abc123..."
  }
}
```

Or if rotated:
```json
{
  "success": true,
  "data": {
    "rotated": true,
    "newFingerprint": "SHA256:xyz789...",
    "previous": "SHA256:abc123..."
  }
}
```

---

### 8. Watchdog Check
**POST** `/vcs/watchdog-check`

Verifies Playground has the key installed and redistributes if missing.

**Response:**
```json
{
  "success": true,
  "data": {
    "action": "none"
  }
}
```

Or if redistributed:
```json
{
  "success": true,
  "data": {
    "action": "redistributed"
  }
}
```

---

### 9. Metrics
**GET** `/vcs/metrics`

Returns Prometheus-format metrics.

**Response:**
```
vcs_keys_generated_total 5
vcs_keys_activated_total 3
vcs_keys_redistributions_total 8
vcs_keys_watchdog_redistributions_total 2
vcs_keys_rotation_events_total 1
vcs_keys_purge_events_total 2
vcs_active_key_age_seconds 86400
```

## Step-by-Step Setup

### Manual Flow

#### Step 1: Generate Key
```bash
curl -X POST http://localhost:3001/vcs/generate
```

Save the `fingerprint` and `public_key` from the response.

#### Step 2: Add to GitHub
1. Go to your GitHub repository
2. Navigate to **Settings** → **Deploy Keys**
3. Click **Add deploy key**
4. Paste the public key
5. Check "Allow read access"
6. Click **Add key**

#### Step 3: Activate Key
```bash
curl -X POST http://localhost:3001/vcs/activate \
  -H "Content-Type: application/json" \
  -d '{"fingerprint":"SHA256:your-fingerprint-here"}'
```

#### Step 4: Test Connection
```bash
curl -X POST http://localhost:3001/vcs/test-connection
```

## Testing Scripts

### Node.js Script

**Location:** `scripts/setup-vcs-key.js`

**Usage:**
```bash
# Complete automatic setup
node scripts/setup-vcs-key.js

# Manual step-by-step
node scripts/setup-vcs-key.js --manual
```

**Features:**
- Automatic complete setup flow
- Detailed step logging
- Error handling with troubleshooting tips
- Displays public key for GitHub

### PowerShell Script

**Location:** `scripts/test-vcs-key.ps1`

**Usage:**
```powershell
.\scripts\test-vcs-key.ps1
```

**Features:**
- Complete setup flow
- Multiple test scenarios
- Metrics retrieval
- Color-coded output

## Environment Variables

Required environment variables:

```bash
# Encryption key for private keys (32+ characters recommended)
INTEGRATION_VCS_KEY_ENC_KEY=your-encryption-key-here

# Shared secret for HMAC signing
INTEGRATION_SHARED_SECRET=your-shared-secret-here

# Playground service URL
PLAYGROUND_BASE_URL=http://playground-service:8000

# Optional: Key rotation interval (default: 30 days)
VCS_ROTATION_DAYS=30

# Optional: Watchdog check interval (default: 300 seconds)
VCS_WATCHDOG_INTERVAL_SEC=300

# Optional: Number of inactive keys to retain (default: 3)
VCS_RETAIN_INACTIVE=3
```

## Security Features

### Key Generation
- **Algorithm:** Ed25519 (modern, secure)
- **Format:** OpenSSH format for public key, PKCS8 PEM for private
- **Fingerprint:** SHA256 hash for identification

### Key Storage
- **Encryption:** AES-256-GCM for private keys
- **Database:** PostgreSQL with encrypted columns
- **Access:** Private keys decrypted only for distribution

### Key Distribution
- **HMAC Signing:** Signed payload using shared secret
- **One-time Use:** Private key sent once during activation
- **Secure Transport:** HTTPS recommended for production

### Key Rotation
- **Automatic:** Based on `VCS_ROTATION_DAYS`
- **Manual:** Via `/vcs/rotate-if-due` endpoint
- **History:** Old keys retained based on `VCS_RETAIN_INACTIVE`

## Database Schema

### vcs_keys Table
```sql
CREATE TABLE vcs_keys (
  id SERIAL PRIMARY KEY,
  fingerprint VARCHAR(255) UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  private_key_enc BYTEA NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rotated_at TIMESTAMP
);
```

### vcs_key_events Table
```sql
CREATE TABLE vcs_key_events (
  id SERIAL PRIMARY KEY,
  fingerprint VARCHAR(255),
  event_type VARCHAR(50),
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Error: "Encryption key not configured"
**Solution:** Set `INTEGRATION_VCS_KEY_ENC_KEY` environment variable with 32+ characters.

```bash
export INTEGRATION_VCS_KEY_ENC_KEY="your-secure-random-key-here-min-32-chars"
```

### Error: "INTEGRATION_SHARED_SECRET not configured"
**Solution:** Set `INTEGRATION_SHARED_SECRET` for HMAC signing.

```bash
export INTEGRATION_SHARED_SECRET="your-shared-secret-here"
```

### Error: "No active key"
**Solution:** Generate and activate a key first.

```bash
curl -X POST http://localhost:3001/vcs/setup-complete
```

### Error: "Failed to connect to Playground"
**Solutions:**
1. Verify Playground service is running
2. Check `PLAYGROUND_BASE_URL` environment variable
3. Ensure network connectivity between services
4. Check Playground service logs

### Error: "Fingerprint not found"
**Solution:** Generate a new key first, then use the correct fingerprint.

```bash
# Generate
RESPONSE=$(curl -X POST http://localhost:3001/vcs/generate)
FINGERPRINT=$(echo $RESPONSE | jq -r '.data.fingerprint')

# Activate
curl -X POST http://localhost:3001/vcs/activate \
  -H "Content-Type: application/json" \
  -d "{\"fingerprint\":\"$FINGERPRINT\"}"
```

### Database Connection Issues
**Solutions:**
1. Check PostgreSQL is running
2. Verify database credentials in environment
3. Ensure `vcs_keys` and `vcs_key_events` tables exist
4. Run database migrations if needed

### Key Not Working in GitHub
**Solutions:**
1. Verify public key was copied correctly (no extra spaces/newlines)
2. Check Deploy Key has read access enabled
3. Ensure Deploy Key is added to correct repository
4. Test SSH connection manually:
   ```bash
   ssh -T git@github.com -i /path/to/private/key
   ```

## Best Practices

1. **Initial Setup:** Use `/vcs/setup-complete` for first-time setup
2. **Key Rotation:** Enable automatic rotation with `VCS_ROTATION_DAYS=30`
3. **Monitoring:** Set up alerts on `/vcs/metrics` endpoint
4. **Backup:** Backup database including encrypted private keys
5. **Security:** Use strong encryption keys (32+ random characters)
6. **Production:** Use HTTPS for all API communications
7. **Watchdog:** Enable periodic watchdog checks to ensure key availability

## Integration Examples

### Node.js
```javascript
const http = require('http');

async function setupVCSKey() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/vcs/setup-complete',
      method: 'POST'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

const result = await setupVCSKey();
console.log('Public Key:', result.summary.public_key);
```

### Python
```python
import requests

response = requests.post('http://localhost:3001/vcs/setup-complete')
data = response.json()

if data['success']:
    print('Fingerprint:', data['summary']['fingerprint'])
    print('Public Key:', data['summary']['public_key'])
```

### PowerShell
```powershell
$result = Invoke-RestMethod -Uri "http://localhost:3001/vcs/setup-complete" -Method Post
Write-Host "Fingerprint: $($result.summary.fingerprint)"
Write-Host "Public Key: $($result.summary.public_key)"
```

## Support

For issues or questions:
- Check logs: `docker logs integration-service`
- Review database: Query `vcs_keys` and `vcs_key_events` tables
- Test manually: Use curl/Postman to test individual endpoints
- Verify environment: Ensure all required variables are set

---

**Last Updated:** December 3, 2025  
**Version:** 1.0.0
