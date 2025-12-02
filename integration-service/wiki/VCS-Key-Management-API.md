# VCS Key Management API

Complete API reference for VCS (Version Control System) SSH key management.

## Overview

The VCS Key Management API provides secure SSH key generation, storage, distribution, and lifecycle management for accessing private Git repositories.

**Base Path:** `/api/vcs`

**Total Endpoints:** 10

## Security Model

All private keys are:
- Encrypted with AES-256-GCM before storage
- Distributed to Playground via HMAC-signed payload
- Stored on tmpfs (memory) in Playground
- Never returned via API endpoints

See [VCS Security Model](VCS-Security-Model) for details.

## Endpoints

### 1. Generate SSH Key

Generate a new Ed25519 SSH key pair.

**Endpoint:** `POST /api/vcs/generate`

**Request Body:** None

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "fingerprint": "SHA256:abc123def456...",
    "public_key": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... codeshuriken-integration",
    "status": "pending"
  }
}
```

**Process:**
1. Generates Ed25519 key pair (256-bit)
2. Encrypts private key with AES-256-GCM
3. Stores in `vcs_keys` table
4. Returns public key for deployment

**Next Steps:**
1. Copy `public_key` value
2. Add to GitHub/GitLab deploy keys
3. Call `/activate` endpoint

**Example:**
```bash
curl -X POST http://localhost:3000/api/vcs/generate
```

---

### 2. Activate SSH Key (Path Parameter)

Activate a pending SSH key after deploying to VCS provider.

**Endpoint:** `POST /api/vcs/activate/:fingerprint`

**Path Parameters:**
- `fingerprint` - Key fingerprint (e.g., `SHA256:abc123...`)

**Success Response (200):**
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

**Automatic Actions:**
- Deactivates previous active key
- Distributes private key to Playground
- Starts watchdog monitoring

**Example:**
```bash
curl -X POST http://localhost:3000/api/vcs/activate/SHA256:abc123...
```

---

### 3. Activate SSH Key (Body)

Alternative activation endpoint accepting fingerprint in request body.

**Endpoint:** `POST /api/vcs/activate`

**Request Body:**
```json
{
  "fingerprint": "SHA256:abc123..."
}
```

**Success Response (200):**
Same as above

**Use Case:** Avoids URL encoding issues with special characters

**Error Response (400):**
```json
{
  "success": false,
  "error": "Missing fingerprint"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/vcs/activate \
  -H "Content-Type: application/json" \
  -d '{"fingerprint": "SHA256:abc123..."}'
```

---

### 4. Get Active Key

Retrieve currently active SSH key metadata.

**Endpoint:** `GET /api/vcs/active`

**Success Response (200):**
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

**Example:**
```bash
curl http://localhost:3000/api/vcs/active
```

---

### 5. Distribute SSH Key

Manually distribute active key to Playground service.

**Endpoint:** `POST /api/vcs/distribute/:fingerprint`

**Path Parameters:**
- `fingerprint` - Active key fingerprint

**Success Response (200):**
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

**Error Response (400):**
```json
{
  "success": false,
  "error": "Fingerprint is not the active key"
}
```

**Use Case:** Recovery after Playground service restart

**Example:**
```bash
curl -X POST http://localhost:3000/api/vcs/distribute/SHA256:abc123...
```

---

### 6. Test VCS Connection

Test SSH connectivity to GitHub using installed key.

**Endpoint:** `POST /api/vcs/test-connection`

**Request Body:** None

**Success Response (200):**
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

**Error Response (500):**
```json
{
  "success": false,
  "error": "SSH connection test failed: Host key verification failed"
}
```

**Process:**
1. Ensures Playground has active key
2. Delegates to Playground `/vcs/test` endpoint
3. Tests SSH connection to `github.com`
4. Returns authentication status

**Example:**
```bash
curl -X POST http://localhost:3000/api/vcs/test-connection
```

---

### 7. Force Rotation Check

Manually trigger key rotation evaluation.

**Endpoint:** `POST /api/vcs/rotate-if-due`

**Request Body:** None

**Success Response (rotated):**
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

**Success Response (not due):**
```json
{
  "success": true,
  "data": {
    "rotated": false,
    "reason": "Active key is still within rotation period",
    "days_remaining": 15
  }
}
```

**Rotation Triggers:**
- Active key age >= `VCS_ROTATION_DAYS` (default: 30)
- Manual invocation

**Rotation Process:**
1. Generate new key pair
2. Activate new key (deactivates old)
3. Distribute to Playground
4. Test connectivity
5. Purge excess inactive keys

**Example:**
```bash
curl -X POST http://localhost:3000/api/vcs/rotate-if-due
```

---

### 8. Force Watchdog Check

Manually trigger watchdog verification.

**Endpoint:** `POST /api/vcs/watchdog-check`

**Request Body:** None

**Success Response (redistributed):**
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

**Success Response (no action):**
```json
{
  "success": true,
  "data": {
    "action": "none",
    "reason": "Key already installed"
  }
}
```

**Watchdog Actions:**
- `none` - Key already installed
- `redistributed` - Key was missing and reinstalled
- `no_active_key` - No active key to monitor

**Example:**
```bash
curl -X POST http://localhost:3000/api/vcs/watchdog-check
```

---

### 9. Get Prometheus Metrics

Export VCS key management metrics in Prometheus format.

**Endpoint:** `GET /api/vcs/metrics`

**Success Response (200):**
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

**Metrics Description:**

| Metric | Type | Description |
|--------|------|-------------|
| `vcs_keys_generated_total` | Counter | Total keys generated |
| `vcs_keys_activated_total` | Counter | Total keys activated |
| `vcs_keys_redistributions_total` | Counter | Manual redistributions |
| `vcs_keys_watchdog_redistributions_total` | Counter | Watchdog redistributions |
| `vcs_keys_rotation_events_total` | Counter | Rotation events |
| `vcs_keys_purge_events_total` | Counter | Key purge events |
| `vcs_active_key_age_seconds` | Gauge | Active key age |

**Example:**
```bash
curl http://localhost:3000/api/vcs/metrics
```

---

## Complete Workflow

### Initial Setup

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

# 2. Copy public_key and add to GitHub
# Go to: https://github.com/org/repo/settings/keys
# Click "Add deploy key"
# Paste public_key
# Check "Allow write access" if needed

# 3. Activate the key
curl -X POST http://localhost:3000/api/vcs/activate \
  -H "Content-Type: application/json" \
  -d '{"fingerprint": "SHA256:abc123..."}'

# 4. Test connection
curl -X POST http://localhost:3000/api/vcs/test-connection

# 5. Verify active key
curl http://localhost:3000/api/vcs/active
```

### Monitoring

```bash
# Check active key status
curl http://localhost:3000/api/vcs/active

# Force watchdog check
curl -X POST http://localhost:3000/api/vcs/watchdog-check

# Check rotation status
curl -X POST http://localhost:3000/api/vcs/rotate-if-due

# Export metrics
curl http://localhost:3000/api/vcs/metrics
```

### Recovery

```bash
# If Playground lost key (after restart)
FINGERPRINT=$(curl -s http://localhost:3000/api/vcs/active | jq -r '.data.fingerprint')
curl -X POST http://localhost:3000/api/vcs/distribute/$FINGERPRINT

# Or use body method
curl -X POST http://localhost:3000/api/vcs/distribute \
  -H "Content-Type: application/json" \
  -d "{\"fingerprint\": \"$FINGERPRINT\"}"

# Test connection
curl -X POST http://localhost:3000/api/vcs/test-connection
```

---

## Python Client

```python
import requests

BASE_URL = "http://localhost:3000"

class VCSKeyClient:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
    
    def generate_key(self):
        """Generate new SSH key"""
        response = requests.post(f"{self.base_url}/api/vcs/generate")
        return response.json()
    
    def activate_key(self, fingerprint):
        """Activate SSH key"""
        response = requests.post(
            f"{self.base_url}/api/vcs/activate",
            json={"fingerprint": fingerprint}
        )
        return response.json()
    
    def get_active_key(self):
        """Get active key info"""
        response = requests.get(f"{self.base_url}/api/vcs/active")
        return response.json()
    
    def test_connection(self):
        """Test SSH connection"""
        response = requests.post(f"{self.base_url}/api/vcs/test-connection")
        return response.json()
    
    def rotate_if_due(self):
        """Check and rotate if needed"""
        response = requests.post(f"{self.base_url}/api/vcs/rotate-if-due")
        return response.json()
    
    def get_metrics(self):
        """Get Prometheus metrics"""
        response = requests.get(f"{self.base_url}/api/vcs/metrics")
        return response.text

# Usage
client = VCSKeyClient()

# Generate and setup new key
result = client.generate_key()
fingerprint = result['data']['fingerprint']
public_key = result['data']['public_key']

print(f"Generated key: {fingerprint}")
print(f"Public key: {public_key}")
print("Add this public key to GitHub, then activate:")

# After adding to GitHub
activate_result = client.activate_key(fingerprint)
print(f"Activated: {activate_result}")

# Test connection
test_result = client.test_connection()
print(f"Connection test: {test_result}")

# Monitor
active = client.get_active_key()
print(f"Active key: {active['data']['fingerprint']}")

metrics = client.get_metrics()
print("Metrics:", metrics)
```

---

## Related Pages

- [VCS Security Model](VCS-Security-Model)
- [Key Rotation & Watchdog](Key-Rotation-Watchdog)
- [Monitoring & Metrics](Monitoring-Metrics)
- [Troubleshooting](Troubleshooting)
