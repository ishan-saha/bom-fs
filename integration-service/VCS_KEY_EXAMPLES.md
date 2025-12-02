# VCS Key Setup - Quick Test Examples

## Complete Setup (All-in-One)
```bash
curl -X POST http://localhost:3001/vcs/setup-complete | jq
```

Expected output:
```json
{
  "success": true,
  "message": "SSH key setup completed successfully",
  "summary": {
    "fingerprint": "SHA256:...",
    "public_key": "ssh-ed25519 AAAAC3...",
    "status": "active",
    "tested": true
  },
  "steps": [...]
}
```

---

## Manual Step-by-Step

### Step 1: Generate Key
```bash
curl -X POST http://localhost:3001/vcs/generate | jq
```

Save the fingerprint:
```bash
FINGERPRINT=$(curl -s -X POST http://localhost:3001/vcs/generate | jq -r '.data.fingerprint')
echo "Fingerprint: $FINGERPRINT"
```

### Step 2: Activate Key
```bash
curl -X POST http://localhost:3001/vcs/activate \
  -H "Content-Type: application/json" \
  -d "{\"fingerprint\":\"$FINGERPRINT\"}" | jq
```

### Step 3: Get Active Key
```bash
curl http://localhost:3001/vcs/active | jq
```

### Step 4: Test Connection
```bash
curl -X POST http://localhost:3001/vcs/test-connection | jq
```

---

## Monitoring

### Get Metrics
```bash
curl http://localhost:3001/vcs/metrics
```

### Check Watchdog
```bash
curl -X POST http://localhost:3001/vcs/watchdog-check | jq
```

### Check Rotation Status
```bash
curl -X POST http://localhost:3001/vcs/rotate-if-due | jq
```

---

## PowerShell Examples

### Complete Setup
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/vcs/setup-complete" -Method Post | ConvertTo-Json -Depth 10
```

### Get Active Key
```powershell
$activeKey = Invoke-RestMethod -Uri "http://localhost:3001/vcs/active" -Method Get
Write-Host "Fingerprint: $($activeKey.data.fingerprint)"
Write-Host "Public Key: $($activeKey.data.public_key)"
```

### Test Connection
```powershell
$test = Invoke-RestMethod -Uri "http://localhost:3001/vcs/test-connection" -Method Post
if ($test.success) {
    Write-Host "✅ Connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ Connection failed" -ForegroundColor Red
}
```

---

## Complete Workflow Example

```bash
#!/bin/bash

echo "🚀 Starting VCS Key Setup..."

# 1. Generate and activate key
echo "Step 1: Complete setup..."
RESPONSE=$(curl -s -X POST http://localhost:3001/vcs/setup-complete)

# Extract public key
PUBLIC_KEY=$(echo $RESPONSE | jq -r '.summary.public_key')
FINGERPRINT=$(echo $RESPONSE | jq -r '.summary.fingerprint')

echo "✅ Setup complete!"
echo "Fingerprint: $FINGERPRINT"
echo ""
echo "📋 Public Key (add to GitHub):"
echo "================================"
echo "$PUBLIC_KEY"
echo "================================"
echo ""

# 2. Wait for user to add key to GitHub
echo "⏸️  Add the public key to your GitHub repository's Deploy Keys"
read -p "Press Enter when done..."

# 3. Test the key
echo ""
echo "Step 2: Testing connection..."
TEST_RESULT=$(curl -s -X POST http://localhost:3001/vcs/test-connection)

if echo $TEST_RESULT | jq -e '.success' > /dev/null; then
    echo "✅ Connection test successful!"
else
    echo "❌ Connection test failed"
    echo $TEST_RESULT | jq
fi
```

---

## Troubleshooting Commands

### Check if Integration Service is Running
```bash
curl http://localhost:3001/vcs/active
```

### Check Database Tables
```bash
# Connect to PostgreSQL
docker exec -it postgres-integration psql -U postgres -d integration

# List keys
SELECT fingerprint, status, active, created_at FROM vcs_keys ORDER BY created_at DESC;

# List events
SELECT * FROM vcs_key_events ORDER BY created_at DESC LIMIT 10;
```

### View Service Logs
```bash
docker logs integration-service -f
```

### Regenerate Key (if needed)
```bash
# Deactivate current key (optional)
curl -X POST http://localhost:3001/vcs/generate | jq

# Then run complete setup again
curl -X POST http://localhost:3001/vcs/setup-complete | jq
```
