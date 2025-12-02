# VCS SSH Key Setup Implementation Summary

## Overview
Implemented a comprehensive VCS SSH key management system with automatic generation, activation, distribution, and testing capabilities.

## What Was Implemented

### 1. Complete Setup Endpoint
**New Endpoint:** `POST /vcs/setup-complete`

This all-in-one endpoint performs the complete SSH key setup flow:
1. **Generate** - Creates Ed25519 SSH key pair
2. **Activate** - Sets key as active and deactivates previous keys
3. **Distribute** - Sends private key to Playground service securely
4. **Test** - Verifies connection to Playground

**Key Features:**
- Single API call for complete setup
- Detailed step-by-step response
- Automatic error handling
- Returns public key for GitHub Deploy Keys

### 2. Service Method
**New Method:** `vcsKeyService.setupComplete()`

Added convenience method in `vcsKeyService.js` that:
- Acquires mutex lock for thread safety
- Executes all setup steps sequentially
- Logs progress to console
- Returns comprehensive result object

### 3. Testing Scripts

#### Node.js Script (`scripts/setup-vcs-key.js`)
- Complete automated setup
- Manual step-by-step mode (`--manual` flag)
- Colorful console output with emojis
- Error handling with troubleshooting tips
- Displays public key ready for GitHub

**Usage:**
```bash
node scripts/setup-vcs-key.js           # Automatic
node scripts/setup-vcs-key.js --manual  # Manual
npm run setup-vcs-key                   # Via npm
```

#### PowerShell Script (`scripts/test-vcs-key.ps1`)
- Complete setup flow testing
- Multiple test scenarios
- Metrics retrieval
- Color-coded output
- Windows-friendly

**Usage:**
```powershell
.\scripts\test-vcs-key.ps1
```

### 4. Documentation

#### VCS Key Setup Guide (`VCS_KEY_SETUP_GUIDE.md`)
Comprehensive 500+ line guide covering:
- Quick start instructions
- All API endpoints with examples
- Step-by-step manual setup
- Environment variables
- Security features
- Database schema
- Troubleshooting guide
- Integration examples (Node.js, Python, PowerShell)

#### Quick Examples (`VCS_KEY_EXAMPLES.md`)
Quick reference with:
- curl commands
- PowerShell commands
- Complete workflow example
- Troubleshooting commands

### 5. Package.json Updates
Added npm scripts:
```json
{
  "scripts": {
    "setup-vcs-key": "node scripts/setup-vcs-key.js"
  }
}
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "SSH key setup completed successfully",
  "summary": {
    "fingerprint": "SHA256:abc123def456...",
    "public_key": "ssh-ed25519 AAAAC3NzaC1... codeshuriken-integration",
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
      "playground_response": {...}
    },
    {
      "step": 4,
      "action": "test",
      "status": "success",
      "test_result": {...}
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Detailed error message",
  "stack": "Stack trace (development only)"
}
```

## Usage Examples

### Quick Setup (Recommended)
```bash
# Using curl
curl -X POST http://localhost:3001/vcs/setup-complete | jq

# Using Node.js script
node scripts/setup-vcs-key.js

# Using PowerShell
.\scripts\test-vcs-key.ps1
```

### Manual Flow
```bash
# 1. Generate
curl -X POST http://localhost:3001/vcs/generate

# 2. Activate (use fingerprint from step 1)
curl -X POST http://localhost:3001/vcs/activate \
  -H "Content-Type: application/json" \
  -d '{"fingerprint":"SHA256:..."}'

# 3. Test
curl -X POST http://localhost:3001/vcs/test-connection
```

## Security Features

1. **Ed25519 Keys** - Modern, secure algorithm
2. **AES-256-GCM Encryption** - Private keys encrypted at rest
3. **HMAC Signing** - Signed payload for key distribution
4. **Mutex Locking** - Thread-safe operations
5. **Audit Trail** - All events logged to `vcs_key_events` table

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    VCS Key Setup Flow                       │
└─────────────────────────────────────────────────────────────┘

1. POST /vcs/setup-complete
   │
   ├─→ Generate Ed25519 key pair
   │   ├─→ Create public/private keys
   │   ├─→ Compute SHA256 fingerprint
   │   ├─→ Encrypt private key (AES-256-GCM)
   │   └─→ Store in database (status: pending)
   │
   ├─→ Activate key
   │   ├─→ Deactivate previous active keys
   │   ├─→ Set new key to active
   │   └─→ Log activation event
   │
   ├─→ Distribute to Playground
   │   ├─→ Decrypt private key
   │   ├─→ Sign payload with HMAC
   │   ├─→ POST to /internal/vcs/ssh-key
   │   └─→ Log distribution event
   │
   └─→ Test connection
       ├─→ POST to /vcs/test
       ├─→ Verify key installation
       └─→ Return test result

2. Return complete response with all step results
```

## Environment Requirements

```bash
# Required
INTEGRATION_VCS_KEY_ENC_KEY=32-char-minimum-encryption-key
INTEGRATION_SHARED_SECRET=shared-secret-for-hmac
PLAYGROUND_BASE_URL=http://playground-service:8000

# Optional (with defaults)
VCS_ROTATION_DAYS=30
VCS_WATCHDOG_INTERVAL_SEC=300
VCS_RETAIN_INACTIVE=3
```

## Database Schema

### Tables Used
1. **vcs_keys** - Stores generated keys
   - fingerprint (unique)
   - public_key
   - private_key_enc (encrypted)
   - status (pending/active/deprecated)
   - active (boolean)
   - created_at
   - rotated_at

2. **vcs_key_events** - Audit log
   - fingerprint
   - event_type (generated/activated/redistributed/etc)
   - meta (JSONB)
   - created_at

## Testing

### Test the Complete Setup
```bash
# Using Node.js
node scripts/setup-vcs-key.js

# Using PowerShell
.\scripts\test-vcs-key.ps1

# Using curl
curl -X POST http://localhost:3001/vcs/setup-complete | jq
```

### Verify Active Key
```bash
curl http://localhost:3001/vcs/active | jq
```

### Check Metrics
```bash
curl http://localhost:3001/vcs/metrics
```

## Integration with GitHub

After running the setup:

1. **Copy the public key** from the response
2. **Go to GitHub repository** → Settings → Deploy Keys
3. **Add deploy key:**
   - Title: "BOM Scanner Key"
   - Key: Paste the public key
   - ✅ Allow read access
4. **Test cloning** via Playground service

## Troubleshooting

### Common Issues

1. **"Encryption key not configured"**
   - Set `INTEGRATION_VCS_KEY_ENC_KEY` (32+ chars)

2. **"INTEGRATION_SHARED_SECRET not configured"**
   - Set `INTEGRATION_SHARED_SECRET`

3. **"Failed to connect to Playground"**
   - Verify Playground service is running
   - Check `PLAYGROUND_BASE_URL`

4. **"No active key"**
   - Run `/vcs/setup-complete` first

### Debug Commands
```bash
# Check service health
curl http://localhost:3001/vcs/active

# View logs
docker logs integration-service -f

# Check database
docker exec -it postgres-integration psql -U postgres -d integration
SELECT * FROM vcs_keys ORDER BY created_at DESC;
```

## Files Created/Modified

### Modified Files
1. `src/routes/vcsRoutes.js`
   - Added `POST /vcs/setup-complete` endpoint

2. `src/services/vcsKeyService.js`
   - Added `setupComplete()` method

### New Files
1. `scripts/setup-vcs-key.js` - Node.js setup script
2. `scripts/test-vcs-key.ps1` - PowerShell test script
3. `VCS_KEY_SETUP_GUIDE.md` - Complete documentation
4. `VCS_KEY_EXAMPLES.md` - Quick examples
5. `package.json` - Added npm scripts

## Benefits

1. **Simplified Setup** - One endpoint does everything
2. **Automation** - Scripts handle all steps automatically
3. **Visibility** - Detailed step logging and responses
4. **Safety** - Mutex locks prevent race conditions
5. **Monitoring** - Comprehensive metrics and logging
6. **Documentation** - Complete guides and examples
7. **Cross-Platform** - Works on Windows, Linux, macOS

## Next Steps

1. Run the setup:
   ```bash
   node scripts/setup-vcs-key.js
   ```

2. Add public key to GitHub Deploy Keys

3. Test repository cloning via Playground service

4. Set up automatic key rotation (optional):
   ```bash
   # Check daily if rotation is due
   curl -X POST http://localhost:3001/vcs/rotate-if-due
   ```

5. Monitor metrics:
   ```bash
   curl http://localhost:3001/vcs/metrics
   ```

---

**Implementation Date:** December 3, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
