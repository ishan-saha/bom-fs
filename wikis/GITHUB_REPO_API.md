# GitHub Repository Listing API

Complete implementation for listing GitHub repositories and branches, allowing users to select repositories for scanning.

## Overview

This feature enables users to:
1. Browse their GitHub repositories
2. Filter and search repositories
3. Select a repository to scan
4. Choose a specific branch for scanning
5. Proceed with SBOM generation

## Backend Implementation

### 1. GitHub Service (`bom-be/github_service.py`)

Complete GitHub API integration service with the following methods:

```python
class GitHubService:
    # List all repositories for the authenticated user
    def list_user_repositories(token, visibility='all', sort='updated', per_page=100)
    
    # List repositories for an organization
    def list_organization_repositories(token, org_name, type='all', sort='updated')
    
    # List all branches for a repository
    def list_repository_branches(token, owner, repo, per_page=100)
    
    # Get detailed information about a specific branch
    def get_branch_details(token, owner, repo, branch)
    
    # Verify GitHub token validity
    def verify_token(token)
```

**Features:**
- Personal access token authentication
- Comprehensive error handling (401, 403, 404, timeouts)
- Rate limit detection
- Response formatting and sanitization
- Singleton pattern for service instance

### 2. API Endpoints (`bom-be/main.py`)

#### POST `/github/verify-token`
Verify GitHub personal access token and get user info.

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "login": "username",
    "id": 12345,
    "avatar_url": "https://...",
    "html_url": "https://github.com/username",
    "name": "Full Name",
    "email": "user@example.com",
    "public_repos": 42,
    "followers": 10,
    "following": 15
  }
}
```

**Errors:**
- 401: Invalid or expired token

---

#### POST `/github/repositories`
List GitHub repositories for the authenticated user.

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxx",
  "visibility": "all",  // all, public, or private
  "sort": "updated"     // created, updated, pushed, full_name
}
```

**Response:**
```json
{
  "repositories": [
    {
      "id": 123456,
      "name": "my-repo",
      "full_name": "username/my-repo",
      "owner": {
        "login": "username",
        "avatar_url": "https://..."
      },
      "private": false,
      "html_url": "https://github.com/username/my-repo",
      "description": "Repository description",
      "clone_url": "https://github.com/username/my-repo.git",
      "ssh_url": "git@github.com:username/my-repo.git",
      "default_branch": "main",
      "language": "Python",
      "stargazers_count": 42,
      "forks_count": 10,
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "visibility": "all",
  "sort": "updated"
}
```

**Errors:**
- 401: Invalid or expired GitHub token
- 403: VCS consent required OR rate limit exceeded
- 429: GitHub API rate limit exceeded

**Notes:**
- Requires VCS consent to be given first
- Returns up to 100 repositories per request
- Supports pagination through GitHub API (future enhancement)

---

#### POST `/github/repositories/{owner}/{repo}/branches`
List branches for a specific repository.

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxx",
  "owner": "username",
  "repo": "my-repo"
}
```

**Response:**
```json
{
  "owner": "username",
  "repo": "my-repo",
  "branches": [
    {
      "name": "main",
      "commit": {
        "sha": "abc123...",
        "url": "https://api.github.com/repos/username/my-repo/commits/abc123"
      },
      "protected": true
    },
    {
      "name": "develop",
      "commit": {
        "sha": "def456...",
        "url": "https://api.github.com/repos/username/my-repo/commits/def456"
      },
      "protected": false
    }
  ],
  "count": 2
}
```

**Errors:**
- 401: Invalid or expired GitHub token
- 403: VCS consent required OR rate limit exceeded
- 404: Repository not found or not accessible
- 429: GitHub API rate limit exceeded

---

#### POST `/github/repositories/{owner}/{repo}/branches/{branch}`
Get detailed information about a specific branch.

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "owner": "username",
  "repo": "my-repo",
  "branch": {
    "name": "main",
    "commit": {
      "sha": "abc123...",
      "url": "https://api.github.com/repos/username/my-repo/commits/abc123",
      "commit": {
        "message": "Add new feature",
        "author": {
          "name": "John Doe",
          "email": "john@example.com",
          "date": "2024-01-15T10:30:00Z"
        }
      }
    },
    "protected": true
  }
}
```

**Errors:**
- 401: Invalid or expired GitHub token
- 403: VCS consent required OR rate limit exceeded
- 404: Branch not found or repository not accessible
- 429: GitHub API rate limit exceeded

---

## Frontend Implementation

### 1. VCS API Integration (`sbom-fe/lib/vcs-api.ts`)

Added `githubApi` object with TypeScript types and methods:

```typescript
export const githubApi = {
  // Verify GitHub token
  verifyToken(token, githubToken): Promise<{ valid: boolean; user: GitHubUserInfo }>
  
  // List repositories
  listRepositories(token, githubToken, options?): Promise<{ repositories: GitHubRepository[]; count: number }>
  
  // List branches
  listBranches(token, githubToken, owner, repo): Promise<{ branches: GitHubBranch[]; count: number }>
  
  // Get branch details
  getBranchDetails(token, githubToken, owner, repo, branch): Promise<{ branch: GitHubBranchDetails }>
}
```

**TypeScript Interfaces:**
- `GitHubRepository`: Complete repository metadata
- `GitHubBranch`: Branch with commit SHA and protection status
- `GitHubBranchDetails`: Extended branch info with commit details
- `GitHubUserInfo`: User profile information

**Error Handling:**
- `VCS_CONSENT_REQUIRED`: Throws when consent not given
- `RATE_LIMIT_EXCEEDED`: GitHub API rate limit hit
- `REPOSITORY_NOT_FOUND`: Repository doesn't exist or no access
- `BRANCH_NOT_FOUND`: Branch doesn't exist

### 2. Repository Selector Component (`sbom-fe/components/repository-selector.tsx`)

Complete UI component for repository and branch selection.

**Features:**
- Repository listing with search and filters
- Sort by: created, updated, pushed, or name
- Filter by visibility: all, public, or private
- Real-time search across name, description, and owner
- Repository metadata display (stars, forks, language, last update)
- Branch selection with default branch auto-selection
- Protected and default branch badges
- Loading states and error handling
- Responsive design

**Props:**
```typescript
interface RepositorySelectorProps {
  token: string;                    // User auth token
  githubToken: string;               // GitHub personal access token
  onSelect: (repo, branch) => void; // Callback when selection confirmed
  onConsentRequired?: () => void;    // Callback when consent needed
}
```

**Usage Example:**
```tsx
<RepositorySelector
  token={authToken}
  githubToken={userGithubToken}
  onSelect={(repo, branch) => {
    console.log(`Selected: ${repo.full_name} (${branch.name})`);
    // Proceed with scan
  }}
  onConsentRequired={() => {
    // Show consent modal
  }}
/>
```

### 3. Required shadcn/ui Components

The repository selector uses the following components (install if missing):

```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add select
```

## Integration Flow

### Complete User Flow

1. **User Authentication**
   - User logs in to the application
   - Receives JWT token

2. **VCS Consent** (if not already given)
   - User is prompted to give VCS consent
   - Consent recorded with timestamp and IP
   - User connects GitHub account

3. **GitHub Token Setup**
   - User enters GitHub personal access token
   - Token verified via `/github/verify-token`
   - Token stored (encrypted) in user profile

4. **Repository Selection**
   - User navigates to scan page
   - `RepositorySelector` component loads repositories
   - User searches/filters repositories
   - User selects a repository

5. **Branch Selection**
   - Component automatically loads branches for selected repo
   - User selects a branch (default pre-selected)
   - User confirms selection

6. **Scan Initiation**
   - Selected repository and branch passed to scan function
   - Scan recorded via `/vcs/record-scan`
   - SBOM generation begins

### Example Integration in Dashboard

```tsx
'use client';

import { useState } from 'react';
import { RepositorySelector } from '@/components/repository-selector';
import { githubApi, vcsConsentApi } from '@/lib/vcs-api';

export default function ScanPage() {
  const [authToken, setAuthToken] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showConsentModal, setShowConsentModal] = useState(false);

  const handleRepoSelect = async (repo, branch) => {
    try {
      // Record the scan
      await vcsConsentApi.recordScan(
        authToken,
        repo.clone_url,
        branch.name
      );
      
      // Start SBOM generation
      console.log(`Scanning ${repo.full_name} (${branch.name})`);
      // ... SBOM generation logic
      
    } catch (error) {
      console.error('Scan failed:', error);
    }
  };

  return (
    <div>
      <h1>Scan Repository</h1>
      
      <RepositorySelector
        token={authToken}
        githubToken={githubToken}
        onSelect={handleRepoSelect}
        onConsentRequired={() => setShowConsentModal(true)}
      />
      
      {/* VCS Consent Modal */}
      {showConsentModal && (
        <VCSConsentModal
          onClose={() => setShowConsentModal(false)}
          onConsent={async () => {
            await vcsConsentApi.giveConsent(authToken, 'github');
            setShowConsentModal(false);
          }}
        />
      )}
    </div>
  );
}
```

## Security Considerations

### GitHub Token Storage

**Important:** GitHub personal access tokens should be stored securely.

**Recommended Implementation:**

1. **Add GitHub token fields to User model:**
```sql
ALTER TABLE users ADD COLUMN github_token VARCHAR(255);
ALTER TABLE users ADD COLUMN github_username VARCHAR(255);
ALTER TABLE users ADD COLUMN github_token_expires TIMESTAMP;
```

2. **Encrypt tokens at rest:**
```python
from cryptography.fernet import Fernet

def encrypt_token(token: str) -> str:
    cipher = Fernet(ENCRYPTION_KEY)
    return cipher.encrypt(token.encode()).decode()

def decrypt_token(encrypted: str) -> str:
    cipher = Fernet(ENCRYPTION_KEY)
    return cipher.decrypt(encrypted.encode()).decode()
```

3. **Add token management endpoints:**
- POST `/github/save-token` - Save encrypted token
- GET `/github/token-status` - Check if token exists
- DELETE `/github/revoke-token` - Delete token

### Rate Limiting

GitHub API has rate limits:
- **Authenticated requests:** 5,000 requests/hour
- **Unauthenticated requests:** 60 requests/hour

**Recommendations:**
1. Cache repository lists (5-minute TTL)
2. Implement request throttling
3. Show rate limit remaining in UI
4. Handle 403 responses gracefully

### Permission Scopes

Required GitHub token permissions:
- `repo` - Full control of private repositories
- `read:org` - Read organization data (optional)
- `read:user` - Read user profile data

**Token Creation Guide:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select required scopes
4. Copy token (shown only once)
5. Paste into application

## Testing

### Backend Testing

```bash
# Test repository listing
curl -X POST http://localhost:8001/github/repositories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ghp_YOUR_GITHUB_TOKEN",
    "visibility": "all",
    "sort": "updated"
  }'

# Test branch listing
curl -X POST http://localhost:8001/github/repositories/owner/repo/branches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ghp_YOUR_GITHUB_TOKEN",
    "owner": "username",
    "repo": "repository"
  }'
```

### Frontend Testing

```typescript
// Test token verification
const result = await githubApi.verifyToken(authToken, githubToken);
console.log('User:', result.user.login);

// Test repository listing
const repos = await githubApi.listRepositories(authToken, githubToken);
console.log(`Found ${repos.count} repositories`);

// Test branch listing
const branches = await githubApi.listBranches(
  authToken,
  githubToken,
  'owner',
  'repo'
);
console.log(`Found ${branches.count} branches`);
```

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid or expired GitHub token` | Token is invalid or revoked | User must generate new token |
| `VCS consent required` | User hasn't given consent | Show consent modal |
| `GitHub API rate limit exceeded` | Too many requests | Wait or upgrade to higher rate limit |
| `Repository not found` | Repo doesn't exist or no access | Check repository name and permissions |
| `Branch not found` | Branch doesn't exist | Check branch name |

### User-Friendly Error Messages

```typescript
const errorMessages = {
  'VCS_CONSENT_REQUIRED': 'Please provide consent to access your repositories.',
  'RATE_LIMIT_EXCEEDED': 'GitHub rate limit reached. Please try again later.',
  'REPOSITORY_NOT_FOUND': 'Repository not found or you don\'t have access.',
  'BRANCH_NOT_FOUND': 'Branch not found in this repository.',
  'Invalid or expired GitHub token': 'Your GitHub token is invalid. Please generate a new one.'
};
```

## Future Enhancements

### Planned Features

1. **Pagination Support**
   - Handle repositories > 100
   - Load more button
   - Infinite scroll

2. **Repository Caching**
   - Cache in localStorage
   - Background refresh
   - Cache invalidation

3. **Organization Support**
   - List organization repositories
   - Organization switching
   - Team permissions

4. **Advanced Filters**
   - Filter by language
   - Filter by topic
   - Date range filters

5. **Batch Operations**
   - Select multiple repositories
   - Bulk scanning
   - Scan history tracking

6. **GitHub App Integration**
   - OAuth instead of PAT
   - Automatic token refresh
   - Enhanced security

7. **Repository Insights**
   - Dependency graph preview
   - Security alerts
   - Vulnerability count

## Dependencies

### Backend
- `requests==2.31.0` - HTTP client for GitHub API

### Frontend
- `lucide-react` - Icon library (already installed)
- shadcn/ui components (card, button, input, badge, skeleton, alert, select)

## Configuration

### Environment Variables

None required - uses existing configuration:
- `SECRET_KEY` - JWT token encryption
- Database configuration from existing setup

### API Base URLs

Configured in `vcs-api.ts`:
```typescript
const AUTH_API_BASE = 'http://localhost:8001'        // Backend API
const INTEGRATION_API_BASE = 'http://localhost:3001' // Integration service
```

## Deployment Notes

### Docker Considerations

The GitHub service is already integrated into the existing Docker setup:
- `bom-be` service includes `github_service.py`
- `requirements.txt` updated with `requests` library
- No additional containers needed

### Network Access

Ensure the backend can reach:
- `api.github.com` (HTTPS port 443)
- Proper DNS resolution
- Allow outbound HTTPS traffic

## Summary

✅ **Backend Complete:**
- GitHub service with 5 methods
- 4 API endpoints
- Error handling and rate limiting
- VCS consent integration

✅ **Frontend Complete:**
- TypeScript API client
- Repository selector component
- Full UI with search/filter
- Error handling and loading states

🔄 **Next Steps:**
1. Install missing shadcn/ui components
2. Add GitHub token storage to User model
3. Test with real GitHub tokens
4. Integrate into dashboard
5. Add token management UI
6. Implement caching for performance

## Support

For issues or questions:
1. Check error messages in browser console
2. Verify GitHub token has correct permissions
3. Ensure VCS consent has been given
4. Check network connectivity to GitHub API
5. Review backend logs for detailed errors
