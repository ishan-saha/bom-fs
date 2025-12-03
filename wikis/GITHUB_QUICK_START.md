# Quick Setup & Testing Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Backend Dependencies
```bash
cd bom-be
pip install requests==2.31.0
```

### Step 2: Get GitHub Personal Access Token
1. Go to https://github.com/settings/tokens/new
2. Name: "BOM Scanner"
3. Expiration: 90 days (or your preference)
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:user` (Read user profile data)
5. Click "Generate token"
6. **Copy token** (you'll only see it once!)

### Step 3: Test Backend API

#### Option A: Using Test Script
```bash
cd bom-be

# Edit test_github_api.py
# Set GITHUB_TOKEN = "ghp_your_token_here"
# Set JWT_TOKEN = "your_jwt_token" (from login)

python test_github_api.py
```

#### Option B: Using curl
```bash
# 1. Get JWT token (login first)
curl -X POST http://localhost:8001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "yourpassword"}'

# Copy the "access_token" from response

# 2. Test GitHub token verification
curl -X POST http://localhost:8001/github/verify-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "ghp_YOUR_GITHUB_TOKEN"}'

# 3. List repositories
curl -X POST http://localhost:8001/github/repositories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ghp_YOUR_GITHUB_TOKEN",
    "visibility": "all",
    "sort": "updated"
  }'
```

### Step 4: Install Frontend Components (if needed)
```bash
cd sbom-fe

# Install missing shadcn/ui components
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton  
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add select
```

### Step 5: Test Frontend Component

Add to your dashboard or scan page:

```tsx
'use client';

import { useState } from 'react';
import { RepositorySelector } from '@/components/repository-selector';

export default function TestPage() {
  const [authToken] = useState('YOUR_JWT_TOKEN');
  const [githubToken] = useState('ghp_YOUR_GITHUB_TOKEN');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Repository Selector</h1>
      
      <RepositorySelector
        token={authToken}
        githubToken={githubToken}
        onSelect={(repo, branch) => {
          console.log('Selected:', repo.full_name, branch.name);
          alert(`Selected: ${repo.full_name} (${branch.name})`);
        }}
        onConsentRequired={() => {
          alert('VCS consent required!');
        }}
      />
    </div>
  );
}
```

## 🔍 Verification Checklist

### Backend Verification
- [ ] Backend server running (`python main.py`)
- [ ] `requests` library installed
- [ ] GitHub token is valid (test with curl)
- [ ] User has given VCS consent
- [ ] JWT token is valid and not expired

### Frontend Verification
- [ ] Frontend dev server running (`npm run dev`)
- [ ] shadcn/ui components installed
- [ ] RepositorySelector component imported
- [ ] No TypeScript errors
- [ ] Repositories display in browser

### Integration Verification
- [ ] Repository list loads
- [ ] Search/filter works
- [ ] Branches load when repo selected
- [ ] Default branch auto-selected
- [ ] Selection callback triggers
- [ ] Error messages display correctly

## 🐛 Troubleshooting

### "Invalid or expired GitHub token"
**Cause:** Token is wrong, revoked, or lacks permissions

**Fix:**
1. Generate new token at https://github.com/settings/tokens
2. Ensure `repo` scope is selected
3. Copy token correctly (no extra spaces)
4. Update token in test script/frontend

### "VCS consent required"
**Cause:** User hasn't given VCS consent

**Fix:**
```bash
# Give consent via API
curl -X POST http://localhost:8001/vcs/consent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "github", "consent_given": true}'
```

### "GitHub API rate limit exceeded"
**Cause:** Hit 5000 requests/hour limit

**Fix:**
- Wait for rate limit reset (check headers)
- Use authenticated requests (higher limit)
- Implement caching to reduce requests

### "Repository not found"
**Cause:** Repository doesn't exist or token lacks access

**Fix:**
- Verify repository name spelling
- Check if repository is private (token needs `repo` scope)
- Ensure token owner has access to repository

### "Module not found: requests"
**Cause:** Python `requests` library not installed

**Fix:**
```bash
pip install requests==2.31.0
```

### Frontend: "Cannot find module '@/components/ui/...'"
**Cause:** shadcn/ui components not installed

**Fix:**
```bash
cd sbom-fe
npx shadcn-ui@latest add badge skeleton alert select
```

## 📊 Expected Output

### Successful Token Verification
```json
{
  "valid": true,
  "user": {
    "login": "your-username",
    "id": 12345678,
    "name": "Your Name",
    "email": "you@example.com",
    "public_repos": 42,
    "followers": 10
  }
}
```

### Successful Repository List
```json
{
  "repositories": [
    {
      "id": 123456,
      "name": "my-awesome-repo",
      "full_name": "username/my-awesome-repo",
      "private": false,
      "description": "My awesome project",
      "language": "Python",
      "stargazers_count": 15,
      "default_branch": "main"
    }
  ],
  "count": 1
}
```

### Successful Branch List
```json
{
  "owner": "username",
  "repo": "my-awesome-repo",
  "branches": [
    {
      "name": "main",
      "commit": {
        "sha": "abc123..."
      },
      "protected": true
    },
    {
      "name": "develop",
      "commit": {
        "sha": "def456..."
      },
      "protected": false
    }
  ],
  "count": 2
}
```

## 🎯 Integration Example

### Complete Scan Flow
```tsx
'use client';

import { useState } from 'react';
import { RepositorySelector } from '@/components/repository-selector';
import { VCSConsentModal } from '@/components/vcs-consent-modal';
import { vcsConsentApi, githubApi } from '@/lib/vcs-api';

export default function ScanPage() {
  const [authToken, setAuthToken] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleScan = async (repo, branch) => {
    setScanning(true);
    
    try {
      // 1. Record the scan
      await vcsConsentApi.recordScan(
        authToken,
        repo.clone_url,
        branch.name
      );
      
      // 2. Generate SBOM
      console.log(`Starting scan: ${repo.full_name} (${branch.name})`);
      
      // Your SBOM generation logic here...
      
      alert(`Scan started for ${repo.full_name}!`);
      
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Scan Repository</h1>
      
      {/* GitHub Token Input */}
      <div>
        <label className="block mb-2">GitHub Token</label>
        <input
          type="password"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          placeholder="ghp_..."
          className="border p-2 rounded w-full"
        />
      </div>
      
      {/* Repository Selector */}
      {githubToken && (
        <RepositorySelector
          token={authToken}
          githubToken={githubToken}
          onSelect={handleScan}
          onConsentRequired={() => setShowConsent(true)}
        />
      )}
      
      {/* VCS Consent Modal */}
      {showConsent && (
        <VCSConsentModal
          onClose={() => setShowConsent(false)}
          onConsent={async () => {
            await vcsConsentApi.giveConsent(authToken, 'github');
            setShowConsent(false);
          }}
        />
      )}
      
      {scanning && <div>Scanning...</div>}
    </div>
  );
}
```

## 📝 Quick Reference

### API Endpoints
```
POST /github/verify-token              → Verify GitHub token
POST /github/repositories              → List repositories
POST /github/repositories/{o}/{r}/branches → List branches
POST /github/repositories/{o}/{r}/branches/{b} → Branch details
```

### Frontend API
```typescript
githubApi.verifyToken(token, githubToken)
githubApi.listRepositories(token, githubToken, options)
githubApi.listBranches(token, githubToken, owner, repo)
githubApi.getBranchDetails(token, githubToken, owner, repo, branch)
```

### Component Props
```typescript
<RepositorySelector
  token={string}              // JWT auth token
  githubToken={string}        // GitHub PAT
  onSelect={(repo, branch)}   // Selection callback
  onConsentRequired={()}      // Consent callback
/>
```

## ✅ Success Criteria

You'll know it's working when:
1. ✅ Backend API returns repository list
2. ✅ Frontend displays repositories in cards
3. ✅ Search/filter functions work
4. ✅ Clicking repo loads branches
5. ✅ Default branch is pre-selected
6. ✅ Selection triggers callback with repo + branch

## 🎉 Next Steps After Testing

Once testing is successful:

1. **Add Token Storage**
   - Add `github_token` field to User model
   - Encrypt token before storing
   - Retrieve token automatically

2. **Integrate into Dashboard**
   - Replace manual repo URL input
   - Use RepositorySelector component
   - Connect to SBOM generation

3. **Add Token Management**
   - GitHub settings page
   - Token verification status
   - Revoke/update token UI

4. **Implement Caching**
   - Cache repository lists
   - Reduce API calls
   - Improve performance

5. **Production Deployment**
   - Update environment variables
   - Configure CORS if needed
   - Test with production URLs

---

**Need Help?**
- Check `GITHUB_REPO_API.md` for detailed API documentation
- Review `GITHUB_REPO_IMPLEMENTATION_SUMMARY.md` for complete overview
- Run `test_github_api.py` to verify backend
- Check browser console for frontend errors
