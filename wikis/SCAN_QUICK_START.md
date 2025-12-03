# 🚀 Tier-Based Scanning Quick Start Guide

## Setup (5 Minutes)

### Step 1: Run Database Migration

```bash
cd bom-be
python migrate_database.py
```

Expected output:
```
✅ Database migration completed successfully!
📋 Summary:
  - Added user_tier, scans_this_month, last_scan_reset to users table
  - Created scan_history table
  - Created indexes for performance
```

### Step 2: Verify Environment Variables

Add to `bom-be/.env`:

```env
# Playground Service URL
PLAYGROUND_SERVICE_URL=http://localhost:9000

# NVD API Key (optional but recommended)
NVD_API_KEY=your_nvd_api_key_here
```

Get NVD API key (optional): https://nvd.nist.gov/developers/request-an-api-key

### Step 3: Start All Services

```bash
# Terminal 1: Backend
cd bom-be
python main.py

# Terminal 2: Playground Service  
cd playground-service
python main.py

# Terminal 3: Frontend
cd sbom-fe
npm run dev
```

## 🧪 Testing the Scan System

### 1. Check Your Tier Status

```bash
# Get JWT token first (login)
TOKEN="your_jwt_token_here"

# Check tier status
curl -X GET http://localhost:8001/scan/tier-status \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "tier": "free",
  "scan_limit": 1,
  "scans_used": 0,
  "scans_remaining": 1,
  "can_scan": true,
  "next_reset": "2025-01-01T00:00:00"
}
```

### 2. Start Your First Scan

```bash
curl -X POST http://localhost:8001/scan/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/pallets/flask",
    "branch": "main"
  }'
```

**This will:**
1. ✅ Check your tier (free = 1/month, premium = unlimited)
2. ✅ Clone the repository
3. ✅ Analyze files (lines, languages, types)
4. ✅ Generate SBOM using cdxgen
5. ✅ Scan for vulnerabilities (OSV, NVD, GitHub Advisory)
6. ✅ Save scan to history
7. ✅ Return comprehensive results

**Sample Response:**
```json
{
  "success": true,
  "scan_id": "scan_123_1701619200",
  "metadata": {
    "total_lines": 15420,
    "total_files": 142,
    "languages": {"Python": 85, "JavaScript": 15}
  },
  "sbom": {
    "total_components": 42
  },
  "vulnerabilities": {
    "total_vulnerabilities": 15,
    "summary": {
      "critical": 2,
      "high": 5,
      "medium": 6,
      "low": 2
    }
  },
  "user_tier": "free",
  "scans_remaining": 0
}
```

### 3. Try to Scan Again (Should Fail - Free Tier Limit)

```bash
curl -X POST http://localhost:8001/scan/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/django/django",
    "branch": "main"
  }'
```

**Expected Response (403 Forbidden):**
```json
{
  "detail": {
    "error": "Free tier scan limit reached",
    "message": "You have reached your monthly scan limit (1 scan per month). Upgrade to Premium for unlimited scans.",
    "tier": "free",
    "scans_used": 1,
    "scans_limit": 1,
    "upgrade_url": "/premium"
  }
}
```

### 4. Upgrade to Premium

```bash
curl -X POST http://localhost:8001/scan/upgrade-tier \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully upgraded to Premium tier",
  "tier": "premium",
  "benefits": [
    "Unlimited scans per month",
    "Priority support",
    "Advanced vulnerability analysis",
    "API access"
  ]
}
```

### 5. Scan Again (Should Work - Premium Tier)

```bash
curl -X POST http://localhost:8001/scan/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/django/django",
    "branch": "main"
  }'
```

Now it works! 🎉

### 6. View Scan History

```bash
curl -X GET "http://localhost:8001/scan/history?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "scans": [
    {
      "scan_id": "scan_123_1701619200",
      "repository_url": "https://github.com/pallets/flask",
      "branch": "main",
      "total_vulnerabilities": 15,
      "critical_vulns": 2,
      "high_vulns": 5,
      "created_at": "2024-12-03T10:30:00"
    }
  ],
  "total": 2,
  "has_more": false
}
```

## 📱 Frontend Integration Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import { scanApi, type TierStatus, type ScanResponse } from '@/lib/scan-api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ScanPage() {
  const [authToken] = useState('YOUR_JWT_TOKEN');
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTierStatus();
  }, []);

  const loadTierStatus = async () => {
    try {
      const status = await scanApi.getTierStatus(authToken);
      setTierStatus(status);
    } catch (err: any) {
      console.error('Failed to load tier status:', err);
    }
  };

  const handleScan = async () => {
    if (!tierStatus?.can_scan) {
      setError('Scan limit reached. Please upgrade to Premium.');
      return;
    }

    setScanning(true);
    setError(null);

    try {
      const result = await scanApi.startScan(
        authToken,
        'https://github.com/pallets/flask',
        'main'
      );
      setResults(result);
      await loadTierStatus(); // Refresh tier status
    } catch (err: any) {
      if (err.message === 'SCAN_LIMIT_REACHED') {
        setError('You have reached your monthly scan limit. Upgrade to Premium for unlimited scans.');
      } else if (err.message === 'VCS_CONSENT_REQUIRED') {
        setError('Please provide VCS consent before scanning repositories.');
      } else {
        setError(err.message);
      }
    } finally {
      setScanning(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      await scanApi.upgradeTier(authToken);
      await loadTierStatus();
      alert('Successfully upgraded to Premium!');
    } catch (err: any) {
      alert('Upgrade failed: ' + err.message);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Tier Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {tierStatus?.tier?.toUpperCase()} Tier
            </h2>
            <p className="text-muted-foreground mt-1">
              Scans: {tierStatus?.scans_used}/{tierStatus?.scan_limit}
              {tierStatus?.tier === 'free' && (
                <span className="ml-2">
                  (Resets: {new Date(tierStatus.next_reset).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
          {tierStatus?.tier === 'free' && (
            <Button onClick={handleUpgrade}>
              Upgrade to Premium
            </Button>
          )}
        </div>
      </Card>

      {/* Scan Button */}
      <Card className="p-6">
        <Button
          onClick={handleScan}
          disabled={scanning || !tierStatus?.can_scan}
          className="w-full"
        >
          {scanning ? 'Scanning...' : 'Start Repository Scan'}
        </Button>
        
        {!tierStatus?.can_scan && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>
              Scan limit reached. Upgrade to Premium for unlimited scans.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {results && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Scan Results</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold">{results.metadata.total_files}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Lines</p>
              <p className="text-2xl font-bold">{results.metadata.total_lines}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Components</p>
              <p className="text-2xl font-bold">{results.sbom.total_components}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vulnerabilities</p>
              <p className="text-2xl font-bold text-red-600">
                {results.vulnerabilities.total_vulnerabilities}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Vulnerability Breakdown:</h4>
            <div className="flex gap-2">
              <Badge variant="destructive">
                Critical: {results.vulnerabilities.summary.critical}
              </Badge>
              <Badge className="bg-orange-600">
                High: {results.vulnerabilities.summary.high}
              </Badge>
              <Badge className="bg-yellow-600">
                Medium: {results.vulnerabilities.summary.medium}
              </Badge>
              <Badge variant="secondary">
                Low: {results.vulnerabilities.summary.low}
              </Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

## 🔧 Troubleshooting

### Error: "Failed to clone repository"

**Cause:** Playground service not running or wrong URL

**Fix:**
```bash
# Check playground service
curl http://localhost:9000/health

# If not running, start it:
cd playground-service
python main.py
```

### Error: "VCS consent required"

**Cause:** User hasn't given VCS consent

**Fix:**
```bash
curl -X POST http://localhost:8001/vcs/consent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "github", "consent_given": true}'
```

### Error: "Table scan_history doesn't exist"

**Cause:** Database migration not run

**Fix:**
```bash
cd bom-be
python migrate_database.py
```

### Scan takes too long (>5 minutes)

**Cause:** Large repository or slow vulnerability API responses

**Fix:**
- Use smaller repositories for testing
- Check network connectivity
- Increase timeout in scanner_service.py

## 📊 Monitoring Scans

### Check scan statistics:

```bash
# Total scans by tier
sqlite3 bom_users.db "SELECT user_tier, COUNT(*) FROM scan_history h JOIN users u ON h.user_id = u.id GROUP BY user_tier;"

# Average vulnerabilities per scan
sqlite3 bom_users.db "SELECT AVG(total_vulnerabilities) FROM scan_history;"

# Most scanned repositories
sqlite3 bom_users.db "SELECT repository_url, COUNT(*) as scan_count FROM scan_history GROUP BY repository_url ORDER BY scan_count DESC LIMIT 10;"
```

## ✅ Verification Checklist

- [ ] Database migration completed successfully
- [ ] Tier status endpoint returns data
- [ ] Free tier can scan once per month
- [ ] Free tier blocked after reaching limit
- [ ] Premium upgrade works
- [ ] Premium tier has unlimited scans
- [ ] Scan results include metadata, SBOM, and vulnerabilities
- [ ] Scan history saves correctly
- [ ] Monthly counter resets on 1st of month

## 🎉 Success!

You now have a fully functional tier-based scanning system with:
- ✅ Monthly limits for free users
- ✅ Vulnerability detection from multiple sources
- ✅ Complete scan history tracking
- ✅ Upgrade path to premium
- ✅ Frontend API client ready

**Next Steps:**
1. Integrate into your dashboard UI
2. Add payment processing for premium upgrades
3. Set up email notifications for scan completion
4. Add scheduled scans for premium users
5. Create reports and analytics dashboard

---

Need help? Check `SCAN_SYSTEM_IMPLEMENTATION.md` for complete documentation.
