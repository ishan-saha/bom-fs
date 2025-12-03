# Frontend Scan Integration - Complete Setup Guide

## Overview
The frontend has been fully integrated with the tier-based scanning system. Users can now scan repositories, view scan history, and manage their tier status through a modern, intuitive interface.

## What's New

### 1. **New Scan Page** (`/scan`)
- **Tier Status Display**: Shows current tier (Free/Premium), scans used, and remaining scans
- **Progress Indicator**: Real-time visual feedback during scanning with stage updates
- **Repository Selector**: Browse GitHub repositories with branch selection
- **Comprehensive Results**: Displays metadata, SBOM, and vulnerability analysis
- **Error Handling**: Handles scan limits, VCS consent requirements, and API failures

### 2. **Modernized Dashboard** (`/dashboard`)
- **Tier Overview Card**: Prominent display of tier status and upgrade option
- **Quick Action Cards**: Direct navigation to scan and history pages
- **Recent Scans List**: Shows last 5 scans with vulnerability counts
- **GitHub Connection Status**: Alert when GitHub account not connected
- **User Menu**: Profile dropdown with tier badge and settings access

### 3. **Scan History Page** (`/scan/history`)
- **Paginated History**: View all scans with 20 per page
- **Statistics Dashboard**: Total scans, clean repositories, critical issues
- **Risk Badges**: Visual indication of scan results (Critical/High/Medium/Low/Safe)
- **Detailed Metadata**: Repository URL, branch, timestamps, scan IDs
- **Click-through**: Navigate to detailed scan results (TODO: details page)

## Page Structure

```
/dashboard              → Main hub with tier status and recent scans
/scan                   → New scan initiation and results display
/scan/history           → Paginated scan history
/scan/details/:id       → Detailed scan results (TODO: to be implemented)
```

## Features

### Tier Management
```typescript
// Tier Status Display
- Free Tier: Shows "X of Y scans remaining this month"
- Premium Tier: Shows "Unlimited repository scans"
- Upgrade Button: Visible for free tier users
- Scan Limits: Enforced with clear error messages
```

### Scan Workflow
```
1. User clicks "Scan Repository" on dashboard
2. Redirected to /scan page
3. Tier status loaded and displayed
4. User clicks "Browse GitHub Repositories"
5. Repository selector modal opens
6. User selects repository and branch
7. Backend checks tier and enforces limits
8. Scan progresses through stages:
   - Cloning repository (10%)
   - Analyzing files (30%)
   - Generating SBOM (50%)
   - Scanning vulnerabilities (70%)
   - Complete (100%)
9. Results displayed with:
   - Summary cards (files, lines, components, vulnerabilities)
   - Risk level badge
   - Vulnerability breakdown by severity
   - Repository details and hashes
   - SBOM component list
   - Language detection
```

### Error Handling
```typescript
// Scan Limit Reached
if (tierStatus.scans_remaining === 0) {
  showError("Scan limit reached. Upgrade to Premium for unlimited scans.")
  showUpgradeButton()
}

// VCS Consent Required
if (!vcsConsent.consent_given) {
  showError("Please provide VCS consent before scanning repositories.")
  redirectTo("/settings/vcs-consent")
}

// API Errors
try {
  const result = await scanApi.startScan(...)
} catch (err) {
  if (err.message === 'SCAN_LIMIT_REACHED') {
    showUpgradeModal()
  } else if (err.message === 'VCS_CONSENT_REQUIRED') {
    showConsentModal()
  } else {
    showError(err.message)
  }
}
```

## API Integration

### Scan API Client (`lib/scan-api.ts`)
```typescript
// Available Methods
scanApi.getTierStatus(token)              // Get user's tier status
scanApi.startScan(token, repoUrl, branch) // Initiate new scan
scanApi.getScanHistory(token, limit, offset) // Get scan history
scanApi.getScanDetails(token, scanId)     // Get detailed scan results
scanApi.upgradeTier(token)                // Upgrade to premium

// Helper Functions
canUserScan(tierStatus)                   // Check if user can scan
formatScanDate(dateStr)                   // Format timestamps
getSeverityColor(severity)                // Get color for severity badge
calculateVulnerabilityScore(summary)      // Calculate overall score
getRiskLevel(summary)                     // Determine risk level
```

### Data Flow
```
Frontend             Backend              Services
--------             -------              --------
Click Scan    →      POST /scan/start  →  Check tier limits
                     ↓                     Clone repository
                     Call playground      Generate metadata
                     /clone, /generate,   Create SBOM
                     /bom                 Scan vulnerabilities
                     ↓                     (OSV, NVD, GitHub)
                     Save to DB            
                     scan_history table    
                     ↓
Receive Results  ←   Return ScanResponse
Display UI
```

## Component Breakdown

### Dashboard Components
```tsx
// Tier Status Card
<Card>
  {tier === 'premium' ? (
    <Crown /> Unlimited scans
  ) : (
    X of Y scans remaining
    <UpgradeButton />
  )}
</Card>

// Quick Actions
<Card onClick={() => router.push('/scan')}>
  <GitBranch /> Scan Repository
  {!canScan && <Badge>Scan limit reached</Badge>}
</Card>

// Recent Scans
{recentScans.map(scan => (
  <ScanCard
    url={scan.repository_url}
    branch={scan.branch}
    vulnerabilities={scan.total_vulnerabilities}
    onClick={() => router.push(`/scan/details/${scan.scan_id}`)}
  />
))}
```

### Scan Page Components
```tsx
// Progress Indicator (during scan)
<Card>
  <RefreshCw className="animate-spin" />
  <Progress value={scanProgress} />
  <p>{scanStage}</p> // "Cloning repository...", etc.
</Card>

// Results Display (after scan)
<SummaryCards>
  <Card>Total Files: {metadata.total_files}</Card>
  <Card>Total Lines: {metadata.total_lines}</Card>
  <Card>Components: {sbom.total_components}</Card>
  <Card>Vulnerabilities: {vulnerabilities.total}</Card>
</SummaryCards>

<RiskLevelCard>
  {critical > 0 ? "Critical Risk" : ...}
  <Badges>
    <Badge>Critical: {summary.critical}</Badge>
    <Badge>High: {summary.high}</Badge>
    ...
  </Badges>
</RiskLevelCard>

<SBOMTable>
  {sbom.components.map(comp => (
    <tr>
      <td>{comp.name}</td>
      <td>{comp.version}</td>
      <td>{comp.type}</td>
    </tr>
  ))}
</SBOMTable>
```

## User Flows

### New User Flow
```
1. Register → Login → Dashboard (shows Free Tier, 0/1 scans)
2. Click "Scan Repository"
3. Connect GitHub (if not connected)
4. Browse repositories → Select one → Select branch
5. Scan runs → Results displayed
6. Dashboard now shows "0/1 scans remaining"
7. Try to scan again → "Scan limit reached" error
8. Click "Upgrade to Premium"
9. Upgraded → "Unlimited scans" displayed
10. Can now scan unlimited repositories
```

### Premium User Flow
```
1. Login → Dashboard (shows Premium Tier, Unlimited scans)
2. Click "Scan Repository"
3. Select repository and branch
4. Scan runs without limit checks
5. View results
6. Repeat unlimited times
7. View history with all scans
```

## Backend Integration Points

### Endpoints Used
```python
# Backend (bom-be/main.py)
POST   /scan/start              # Initiate scan (tier check + orchestration)
GET    /scan/tier-status        # Get user's tier status
POST   /scan/upgrade-tier       # Upgrade to premium
GET    /scan/history            # Get paginated scan history
GET    /scan/history/{scan_id}  # Get detailed scan results

# Playground Service
POST   /clone                   # Clone repository
POST   /generate                # Generate metadata
POST   /bom                     # Generate SBOM

# VCS Service (integration-service)
GET    /api/vcs/consent         # Check VCS consent
POST   /api/vcs/consent         # Give VCS consent
POST   /api/vcs/scan            # Record scan event
```

### Database Tables
```sql
-- Users table (modified)
ALTER TABLE users ADD COLUMN user_tier VARCHAR(10) DEFAULT 'free';
ALTER TABLE users ADD COLUMN scans_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_scan_reset TIMESTAMP;

-- Scan history table (new)
CREATE TABLE scan_history (
  scan_id UUID PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  repository_url TEXT NOT NULL,
  branch VARCHAR(255) DEFAULT 'main',
  total_lines INTEGER,
  total_files INTEGER,
  total_components INTEGER,
  total_vulnerabilities INTEGER,
  critical_vulnerabilities INTEGER,
  high_vulnerabilities INTEGER,
  medium_vulnerabilities INTEGER,
  low_vulnerabilities INTEGER,
  scan_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_scans (user_id, created_at DESC)
);
```

## Testing Checklist

### Tier System
- [ ] Free user starts with 1 scan per month
- [ ] Scan counter increments after successful scan
- [ ] Scan limit enforced (error shown when limit reached)
- [ ] Monthly reset works (1st of each month)
- [ ] Premium users have unlimited scans
- [ ] Upgrade flow works correctly

### Scan Workflow
- [ ] Repository selector loads GitHub repos
- [ ] Branch selection works
- [ ] Scan progress updates shown
- [ ] Results displayed correctly
- [ ] SBOM components listed
- [ ] Vulnerabilities categorized by severity
- [ ] Metadata (files, lines, languages) shown
- [ ] Hashes (MD5, SHA256) displayed

### Navigation
- [ ] Dashboard → Scan page
- [ ] Dashboard → History page
- [ ] Scan page → Dashboard
- [ ] History page → Dashboard
- [ ] History → Scan details (when implemented)
- [ ] Recent scans → Scan details (when implemented)

### Error Handling
- [ ] Scan limit reached error
- [ ] VCS consent required error
- [ ] Repository clone failure
- [ ] Network errors
- [ ] Invalid repository URLs
- [ ] Expired authentication tokens

## Known Issues / TODOs

### To Be Implemented
1. **Scan Details Page** (`/scan/details/:id`)
   - Full vulnerability list with descriptions
   - CVE links and CVSS scores
   - Remediation suggestions
   - Export functionality (PDF, JSON, CSV)

2. **Vulnerability Deep Dive**
   - Individual vulnerability pages
   - Affected package versions
   - Fix recommendations
   - Related vulnerabilities

3. **Advanced Filtering**
   - Filter by severity
   - Filter by date range
   - Search by repository
   - Export filtered results

4. **Notifications**
   - Email alerts for critical vulnerabilities
   - Scan completion notifications
   - Monthly usage reports

5. **Analytics**
   - Vulnerability trends over time
   - Most scanned repositories
   - Common vulnerability types
   - Security score history

### Current Limitations
- Scan details page not implemented (redirects show placeholder)
- No export functionality yet
- No email notifications
- No vulnerability remediation guidance
- Maximum 50 SBOM components shown in UI (pagination needed)

## Environment Variables

### Frontend (.env.local)
```bash
# No additional variables needed
# API URL is auto-detected (localhost:8001 or production URL)
```

### Backend (bom-be/.env)
```bash
# Already configured
DATABASE_URL=postgresql://user:password@localhost/dbname
JWT_SECRET=your-jwt-secret
PLAYGROUND_SERVICE_URL=http://localhost:5002
```

## Performance Considerations

### Optimization Strategies
```typescript
// Debounced search in repository selector
const debouncedSearch = debounce((query) => searchRepos(query), 300)

// Lazy loading for large SBOM lists
{sbom.components.slice(0, 50).map(...)}
{sbom.total_components > 50 && <ShowMoreButton />}

// Cached tier status (refresh on demand)
const [tierStatus, setTierStatus] = useState(getCachedTierStatus())

// Pagination for scan history (20 per page)
const history = await scanApi.getScanHistory(token, 20, offset)
```

## Security Considerations

### Token Management
```typescript
// Tokens stored in memory and sessionStorage (not localStorage for auth)
const token = tokenManager.getToken() // From sessionStorage
if (!token) router.push('/auth/login')

// GitHub token in localStorage (less sensitive)
const githubToken = localStorage.getItem('github_token')
```

### API Error Handling
```typescript
// Never expose sensitive error details to user
catch (err) {
  console.error('Detailed error:', err) // For developers
  setError('Scan failed. Please try again.') // For users
}
```

## Monitoring & Debugging

### Browser Console Logs
```javascript
// Check tier status
localStorage.getItem('user') // User info
sessionStorage.getItem('auth_token') // Auth token

// Check API calls
Network tab → Filter by 'scan' → Inspect requests/responses

// Check state
React DevTools → Dashboard component → State
```

### Backend Monitoring
```sql
-- Check scan history
SELECT * FROM scan_history ORDER BY created_at DESC LIMIT 10;

-- Check user tiers
SELECT username, email, user_tier, scans_this_month 
FROM users 
WHERE scans_this_month > 0;

-- Check vulnerability stats
SELECT 
  AVG(total_vulnerabilities) as avg_vulns,
  MAX(critical_vulnerabilities) as max_critical,
  COUNT(*) as total_scans
FROM scan_history
WHERE created_at > NOW() - INTERVAL '7 days';
```

## Quick Reference

### File Locations
```
sbom-fe/
├── app/
│   ├── dashboard/page.tsx        # Main dashboard (NEW)
│   ├── scan/page.tsx              # Scan page (NEW)
│   └── scan/history/page.tsx      # History page (NEW)
├── lib/
│   ├── scan-api.ts                # Scan API client (NEW)
│   ├── auth-api.ts                # Auth API (existing)
│   └── vcs-api.ts                 # VCS API (existing)
└── components/
    ├── repository-selector.tsx    # GitHub repo browser (existing)
    └── ui/                        # Shadcn components

bom-be/
├── main.py                        # FastAPI app with scan endpoints
├── scanner_service.py             # Vulnerability scanner (NEW)
└── migrate_database.py            # DB migration script (NEW)
```

### Quick Commands
```bash
# Start frontend
cd sbom-fe
npm run dev  # http://localhost:3000

# Start backend
cd bom-be
python main.py  # http://localhost:8001

# Run database migration
cd bom-be
python migrate_database.py

# Check dependencies
cd sbom-fe
npm list @/components/ui/card  # Verify UI components

cd bom-be
pip list | grep fastapi  # Verify backend packages
```

## Summary

The frontend is now fully integrated with the tier-based scanning system:

✅ **Dashboard**: Modern UI with tier status, quick actions, recent scans
✅ **Scan Page**: Complete scan workflow with progress, results, error handling  
✅ **History Page**: Paginated scan history with statistics
✅ **API Integration**: Full integration with backend scan endpoints
✅ **Tier Management**: Free/Premium tiers with limit enforcement
✅ **Error Handling**: Comprehensive error handling for all scenarios
✅ **User Experience**: Intuitive navigation, clear visual feedback
✅ **Type Safety**: Full TypeScript types for all API responses

**Next Steps**: Implement scan details page for deep-dive vulnerability analysis.
