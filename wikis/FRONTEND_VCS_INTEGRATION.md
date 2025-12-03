# Frontend VCS Integration Guide

## Overview
This guide explains how the frontend is connected to the VCS consent tracking and SSH key management backends.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Dashboard   │  │ GitHub Page  │  │ VCS Consent  │    │
│  │    Page      │  │  /settings/  │  │    Modal     │    │
│  └──────────────┘  │   github     │  └──────────────┘    │
│         │          └──────────────┘          │            │
│         └──────────────┬────────────────────┘             │
│                        │                                   │
│                  ┌─────▼──────┐                           │
│                  │  vcs-api.ts │                           │
│                  └─────┬──────┘                           │
└────────────────────────┼──────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
    ┌───────▼────────┐       ┌───────▼────────────┐
    │  Auth Backend  │       │ Integration Service │
    │ (port 8001)    │       │   (port 3001)       │
    │                │       │                     │
    │ - VCS Consent  │       │ - SSH Key Gen       │
    │ - Scan Track   │       │ - Key Activation    │
    │ - Scan History │       │ - Key Distribution  │
    └────────────────┘       └─────────────────────┘
```

## Files Created/Modified

### New Files

1. **`lib/vcs-api.ts`** - VCS API integration layer
   - `vcsConsentApi` - Consent tracking functions
   - `sshKeyApi` - SSH key management functions
   - Helper functions for consent checking

2. **`app/settings/github/page.tsx`** - GitHub connection page
   - Check consent status
   - Connect/disconnect GitHub
   - Display SSH key
   - Copy key to clipboard
   - Link to GitHub

### Modified Files

1. **`components/vcs-consent-modal.tsx`**
   - Added backend API integration
   - Loading states
   - Error handling
   - Automatic consent recording

2. **`app/dashboard/page.tsx`**
   - VCS consent checking before scan
   - Automatic scan recording
   - GitHub connection status display
   - Link to GitHub settings

## API Integration

### VCS Consent API (`lib/vcs-api.ts`)

#### Get Consent Status
```typescript
const consent = await vcsConsentApi.getConsent(token)
// Returns: { consent_given, provider, consent_timestamp, repo_scan_count, last_repo_scan }
```

#### Give Consent
```typescript
const result = await vcsConsentApi.giveConsent(token, 'github')
// Records consent in backend
```

#### Revoke Consent
```typescript
await vcsConsentApi.revokeConsent(token)
// Revokes consent and clears data
```

#### Record Repository Scan
```typescript
const scan = await vcsConsentApi.recordScan(token, repoUrl, branch)
// Throws 'VCS_CONSENT_REQUIRED' if consent not given
```

#### Get Scan History
```typescript
const history = await vcsConsentApi.getScanHistory(token)
// Returns scan count and history
```

### SSH Key API (`lib/vcs-api.ts`)

#### Complete Setup
```typescript
const result = await sshKeyApi.setupComplete()
// Generates, activates, distributes, and tests SSH key
// Returns: { success, message, summary: { fingerprint, public_key, status, tested }, steps }
```

#### Get Active Key
```typescript
const key = await sshKeyApi.getActiveKey()
// Returns: { success, data: { fingerprint, public_key, status, active } }
```

#### Test Connection
```typescript
await sshKeyApi.testConnection()
// Tests Playground service connection
```

## User Flows

### Flow 1: First-Time GitHub Connection

1. User clicks "Connect GitHub" button
2. VCS Consent Modal appears
3. User reads terms and checks consent checkbox
4. User clicks "Connect GitHub"
5. Frontend calls `vcsConsentApi.giveConsent()`
6. Backend records consent with timestamp and IP
7. Frontend calls `sshKeyApi.setupComplete()`
8. Integration service generates SSH key
9. Integration service activates key
10. Integration service distributes to Playground
11. Integration service tests connection
12. Frontend displays SSH public key
13. User adds key to GitHub Deploy Keys
14. User starts scanning repositories

### Flow 2: Repository Scanning with Consent Check

1. User selects repository to scan
2. Frontend checks if consent given
3. If no consent → Show VCS Consent Modal
4. If consent given → Record scan via `vcsConsentApi.recordScan()`
5. Backend increments scan count
6. Frontend proceeds with scan
7. Display SBOM results

### Flow 3: Disconnect GitHub

1. User navigates to Settings → GitHub
2. User clicks "Disconnect GitHub"
3. Confirmation dialog appears
4. User confirms
5. Frontend calls `vcsConsentApi.revokeConsent()`
6. Backend clears consent data (keeps scan history)
7. User can no longer scan until re-consenting

## Components

### VCS Consent Modal (`components/vcs-consent-modal.tsx`)

**Props:**
- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close handler
- `onConsent: () => void` - Consent given callback
- `provider: string` - VCS provider name (e.g., "GitHub")

**Features:**
- Data privacy policy display
- Consent checkbox
- Loading state during API call
- Error message display
- Backend integration

**Usage:**
```tsx
<VCSConsentModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConsent={handleConsentGiven}
  provider="GitHub"
/>
```

### GitHub Connection Page (`app/settings/github/page.tsx`)

**Features:**
- Connection status display
- Connect/Disconnect buttons
- SSH key display with copy
- Scan statistics
- Loading states
- Error handling
- GitHub setup instructions

**URL:** `/settings/github`

## Dashboard Integration (`app/dashboard/page.tsx`)

**New Features:**

1. **VCS Consent Check on Startup**
   ```typescript
   useEffect(() => {
     checkVCSConsent()
   }, [])
   ```

2. **Consent Check Before Scan**
   ```typescript
   if (!vcsConsent?.consent_given) {
     setShowVCSConsentModal(true)
     return
   }
   ```

3. **Automatic Scan Recording**
   ```typescript
   await vcsConsentApi.recordScan(token, repoUrl, 'main')
   ```

4. **GitHub Connection Status Badge**
   - Shows in user menu dropdown
   - Green checkmark when connected

5. **Link to GitHub Settings**
   - Added in user menu
   - Direct access to `/settings/github`

## Environment Configuration

### Frontend (`.env.local`)
```bash
# API URLs (auto-detected for localhost)
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8001
NEXT_PUBLIC_INTEGRATION_API_URL=http://localhost:3001
```

### Backend Auth Service (`.env`)
```bash
# Required for VCS consent tracking
BASE_URL=http://localhost:3000
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://...
```

### Integration Service (`.env`)
```bash
# Required for SSH key management
INTEGRATION_VCS_KEY_ENC_KEY=your-32-char-encryption-key
INTEGRATION_SHARED_SECRET=your-shared-secret
PLAYGROUND_BASE_URL=http://playground-service:8000
```

## Testing

### Test VCS Consent Flow

1. **Start Services:**
   ```bash
   # Auth backend
   cd bom-be
   uvicorn main:app --port 8001

   # Integration service
   cd integration-service
   npm start

   # Frontend
   cd sbom-fe
   npm run dev
   ```

2. **Test Connection:**
   - Open `http://localhost:3000/dashboard`
   - Log in with credentials
   - Click repository (should show consent modal)
   - Check consent checkbox
   - Click "Connect GitHub"
   - Should see SSH key displayed

3. **Verify Backend:**
   ```bash
   # Check consent status
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8001/vcs/consent

   # Check scan history
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8001/vcs/scan-history

   # Check SSH key
   curl http://localhost:3001/vcs/active
   ```

### Test Scan Recording

```bash
# After giving consent
curl -X POST http://localhost:8001/vcs/record-scan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repository_url": "https://github.com/user/repo",
    "branch": "main"
  }'
```

### Test Consent Revocation

1. Navigate to `/settings/github`
2. Click "Disconnect GitHub"
3. Confirm
4. Try to scan repository → Should show consent modal again

## Error Handling

### Consent Required Error
```typescript
try {
  await vcsConsentApi.recordScan(token, repoUrl, branch)
} catch (error: any) {
  if (error.message === 'VCS_CONSENT_REQUIRED') {
    setShowVCSConsentModal(true)
  }
}
```

### Network Errors
```typescript
try {
  await sshKeyApi.setupComplete()
} catch (error: any) {
  setError(error.message || 'Setup failed')
}
```

### Authentication Errors
```typescript
const token = tokenManager.getToken()
if (!token) {
  router.push('/auth/login')
  return
}
```

## Security Considerations

1. **Token Management**
   - Tokens stored in localStorage
   - Sent in Authorization header
   - Automatically checked before API calls

2. **Consent Recording**
   - IP address captured server-side
   - Timestamp recorded
   - Cannot be bypassed

3. **SSH Key Security**
   - Private key encrypted at rest (AES-256-GCM)
   - Only public key shown to user
   - Private key distributed once via HMAC-signed payload

4. **CORS**
   - Configure backend CORS for frontend domain
   - Use environment variables for API URLs

## Troubleshooting

### "Not authenticated" Error
**Solution:** Check if token exists and is valid
```typescript
const token = tokenManager.getToken()
if (!token) {
  router.push('/auth/login')
}
```

### "VCS consent required" Error
**Solution:** Show consent modal
```typescript
setShowVCSConsentModal(true)
```

### SSH Key Setup Fails
**Solutions:**
1. Check Integration Service is running
2. Verify environment variables set
3. Check database connection
4. Verify Playground service accessible

### Consent Not Persisting
**Solutions:**
1. Check auth token valid
2. Verify backend database connection
3. Check browser console for errors
4. Verify API endpoints accessible

## Best Practices

1. **Always Check Consent First**
   ```typescript
   const consent = await vcsConsentApi.getConsent(token)
   if (!consent.consent_given) {
     // Show modal
   }
   ```

2. **Handle Loading States**
   ```typescript
   const [isLoading, setIsLoading] = useState(false)
   // Show loading spinner during API calls
   ```

3. **Show Meaningful Errors**
   ```typescript
   const [error, setError] = useState<string | null>(null)
   {error && <div className="text-red-600">{error}</div>}
   ```

4. **Confirm Destructive Actions**
   ```typescript
   if (!confirm('Are you sure?')) return
   ```

5. **Update UI After API Calls**
   ```typescript
   await vcsConsentApi.giveConsent(token, provider)
   await checkVCSConsent() // Refresh state
   ```

## Future Enhancements

1. **Multiple VCS Providers**
   - GitLab support
   - Bitbucket support
   - Provider selection in modal

2. **Detailed Scan Logs**
   - Per-repository scan history
   - Vulnerability trend charts
   - Export scan reports

3. **Consent Expiry**
   - Auto-expire after X months
   - Reminder notifications

4. **Granular Permissions**
   - Per-repository consent
   - Read/write access levels

5. **OAuth Integration**
   - GitHub OAuth flow
   - Automatic Deploy Key creation
   - No manual key copying needed

---

**Implementation Date:** December 3, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
