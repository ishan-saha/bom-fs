# BOM - Complete VCS Integration

## 🎉 Integration Complete!

The frontend is now fully connected to the VCS consent tracking and SSH key management backends.

## 📦 What's Been Implemented

### Backend Services

#### 1. **Authentication Service (bom-be)** - Port 8001
- ✅ VCS consent tracking
- ✅ Repository scan recording
- ✅ Scan history tracking
- ✅ Consent revocation
- ✅ Database schema with 6 new fields

#### 2. **Integration Service** - Port 3001
- ✅ SSH key generation (Ed25519)
- ✅ Key activation
- ✅ Key distribution to Playground
- ✅ Connection testing
- ✅ Complete setup endpoint

### Frontend (sbom-fe) - Port 3000

#### New Components
1. **`lib/vcs-api.ts`** - API integration layer
2. **`app/settings/github/page.tsx`** - GitHub connection page
3. **Updated `components/vcs-consent-modal.tsx`** - Backend integration
4. **Updated `app/dashboard/page.tsx`** - Consent checking

## 🚀 Quick Start

### 1. Start Backend Services

```bash
# Terminal 1 - Auth Backend
cd bom-be
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001

# Terminal 2 - Integration Service
cd integration-service
npm install
npm start

# Terminal 3 - Frontend
cd sbom-fe
npm install
npm run dev
```

### 2. Setup Database Migration

```sql
-- Add VCS consent fields to users table
ALTER TABLE users 
ADD COLUMN vcs_consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN vcs_consent_timestamp TIMESTAMP,
ADD COLUMN vcs_provider VARCHAR(50),
ADD COLUMN vcs_consent_ip VARCHAR(45),
ADD COLUMN last_repo_scan TIMESTAMP,
ADD COLUMN repo_scan_count INTEGER DEFAULT 0;
```

### 3. Configure Environment Variables

**bom-be/.env:**
```bash
DATABASE_URL=postgresql://user:pass@localhost/bomdb
SECRET_KEY=your-secret-key-change-in-production
BASE_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**integration-service/.env:**
```bash
DATABASE_URL=postgresql://user:pass@localhost/integration
INTEGRATION_VCS_KEY_ENC_KEY=your-32-char-encryption-key-here
INTEGRATION_SHARED_SECRET=your-shared-secret-here
PLAYGROUND_BASE_URL=http://localhost:8000
```

### 4. Test the Integration

```bash
# Run automated test script
cd integration-service
npm run setup-vcs-key

# Or using PowerShell
.\scripts\test-vcs-key.ps1
```

## 📱 User Flow

### First-Time Connection

1. **User logs in** → Dashboard
2. **Clicks repository** → VCS Consent Modal appears
3. **Reads terms** → Checks consent checkbox
4. **Clicks "Connect GitHub"** → Backend records consent
5. **SSH key auto-generated** → Displayed to user
6. **User adds key to GitHub** → Deploy Keys settings
7. **User starts scanning** → Repositories tracked

### Subsequent Scans

1. **User selects repository** → Consent already given
2. **Scan recorded automatically** → Backend tracks count
3. **SBOM generated** → Results displayed
4. **History updated** → Scan statistics shown

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **Consent Tracking** | Timestamp, IP address, provider |
| **SSH Key Encryption** | AES-256-GCM at rest |
| **Key Distribution** | HMAC-signed payload, one-time use |
| **Token Auth** | JWT bearer tokens |
| **GDPR Compliant** | Explicit consent, revocation |
| **Audit Trail** | All events logged |

## 📊 API Endpoints

### VCS Consent (Auth Backend - Port 8001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/vcs/consent` | Record consent |
| `GET` | `/vcs/consent` | Get consent status |
| `POST` | `/vcs/revoke-consent` | Revoke consent |
| `POST` | `/vcs/record-scan` | Record repo scan |
| `GET` | `/vcs/scan-history` | Get scan history |

### SSH Keys (Integration Service - Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/vcs/setup-complete` | Complete setup (all-in-one) |
| `POST` | `/vcs/generate` | Generate key |
| `POST` | `/vcs/activate` | Activate key |
| `GET` | `/vcs/active` | Get active key |
| `POST` | `/vcs/test-connection` | Test connection |

## 📖 Documentation

- **`VCS_CONSENT_TRACKING.md`** - Backend consent system
- **`VCS_KEY_SETUP_GUIDE.md`** - SSH key management
- **`VCS_IMPLEMENTATION_SUMMARY.md`** - Backend implementation
- **`FRONTEND_VCS_INTEGRATION.md`** - Frontend integration
- **`VCS_KEY_EXAMPLES.md`** - Quick examples

## 🧪 Testing

### Test Consent Flow
```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:8001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}' \
  | jq -r '.access_token')

# Give consent
curl -X POST http://localhost:8001/vcs/consent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"github","consent_given":true}'

# Check status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/vcs/consent
```

### Test SSH Key Setup
```bash
# Complete setup
curl -X POST http://localhost:3001/vcs/setup-complete | jq

# Get active key
curl http://localhost:3001/vcs/active | jq
```

### Frontend Testing
1. Open `http://localhost:3000/dashboard`
2. Login with credentials
3. Click any repository
4. Should see VCS Consent Modal
5. Accept consent
6. SSH key should be generated
7. Navigate to `/settings/github` to view key

## 🎯 Key Features

### ✅ Consent Management
- **Record consent** with timestamp and IP
- **Check consent** before repository scans
- **Revoke consent** anytime
- **Track scans** with count and history

### ✅ SSH Key Management
- **Auto-generate** Ed25519 keys
- **Auto-activate** and distribute
- **Auto-test** connection
- **Display** public key for GitHub

### ✅ Frontend Integration
- **Consent modal** with backend API
- **GitHub settings** page
- **Dashboard** integration
- **Automatic** consent checking
- **Scan recording** on every scan

### ✅ User Experience
- **One-click** GitHub connection
- **Automatic** SSH key setup
- **Copy-paste** public key
- **Real-time** connection status
- **Scan statistics** display

## 🔧 Troubleshooting

### Issue: Consent Modal Not Appearing
**Solution:** Check if consent already given
```typescript
const consent = await vcsConsentApi.getConsent(token)
console.log('Consent status:', consent.consent_given)
```

### Issue: SSH Key Setup Fails
**Solutions:**
1. Check Integration Service logs: `docker logs integration-service`
2. Verify environment variables set
3. Check database connection
4. Ensure Playground service running

### Issue: "Not Authenticated" Error
**Solution:** 
```typescript
const token = tokenManager.getToken()
if (!token) {
  router.push('/auth/login')
}
```

### Issue: Scan Not Recording
**Solution:** Check if consent given and token valid
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/vcs/consent
```

## 📈 Monitoring

### Check Metrics
```bash
# VCS metrics (Integration Service)
curl http://localhost:3001/vcs/metrics

# Expected output:
vcs_keys_generated_total 5
vcs_keys_activated_total 3
vcs_keys_redistributions_total 8
vcs_active_key_age_seconds 86400
```

### View Scan History
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/vcs/scan-history | jq
```

## 🎨 UI Screenshots Flow

1. **Dashboard** → "Select Repository" → Consent Modal appears
2. **Consent Modal** → "I acknowledge..." checkbox → "Connect GitHub"
3. **GitHub Settings** → SSH Key displayed → "Copy Full Key"
4. **GitHub Deploy Keys** → Add new deploy key → Paste key
5. **Dashboard** → Repository scan → Success!

## 🚢 Deployment

### Docker Compose (Production)

```yaml
services:
  bom-be:
    environment:
      - DATABASE_URL=postgresql://...
      - SECRET_KEY=${SECRET_KEY}
      - BASE_URL=${BASE_URL}
    ports:
      - "8001:8001"

  integration-service:
    environment:
      - INTEGRATION_VCS_KEY_ENC_KEY=${VCS_KEY_ENC_KEY}
      - INTEGRATION_SHARED_SECRET=${SHARED_SECRET}
      - PLAYGROUND_BASE_URL=http://playground-service:8000
    ports:
      - "3001:3001"

  sbom-fe:
    environment:
      - NEXT_PUBLIC_AUTH_API_URL=${AUTH_API_URL}
      - NEXT_PUBLIC_INTEGRATION_API_URL=${INTEGRATION_API_URL}
    ports:
      - "3000:3000"
```

### Environment Variables (Production)

```bash
# Generate secure keys
openssl rand -hex 32  # SECRET_KEY
openssl rand -hex 32  # VCS_KEY_ENC_KEY
openssl rand -hex 32  # SHARED_SECRET

# Set in production environment
export SECRET_KEY="..."
export VCS_KEY_ENC_KEY="..."
export SHARED_SECRET="..."
```

## 📚 Additional Resources

- [Backend Consent API Documentation](./bom-be/VCS_CONSENT_TRACKING.md)
- [SSH Key Setup Guide](./integration-service/VCS_KEY_SETUP_GUIDE.md)
- [Frontend Integration Guide](./FRONTEND_VCS_INTEGRATION.md)
- [Quick Examples](./integration-service/VCS_KEY_EXAMPLES.md)

## ✨ What's Next?

### Future Enhancements
1. **OAuth Integration** - GitHub OAuth for automatic Deploy Key creation
2. **Multiple Providers** - GitLab, Bitbucket support
3. **Detailed Scan Logs** - Per-repository history with charts
4. **Consent Expiry** - Auto-expire and re-consent flow
5. **Granular Permissions** - Per-repo consent tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

---

**Implementation Complete:** December 3, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Tested:** ✅ All flows working
