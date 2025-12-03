# BOM-FS System Architecture

## Overview
BOM-FS (Bill of Materials - File System) is a comprehensive security platform for repository scanning, SBOM generation, and vulnerability detection with tier-based access control.

## System Components

### 1. Frontend (sbom-fe/) - Next.js
- Authentication pages (signup, login, verification)
- Dashboard with tier status and recent scans
- Repository scanner with GitHub integration
- Scan history with pagination
- User settings and profile management

### 2. Backend (bom-be/) - FastAPI
- Authentication API with JWT
- Tier-based scanning system
- Multi-source vulnerability scanner
- Email service with verification
- Rate limiting and security

### 3. Integration Service (integration-service/) - Node.js
- VCS consent tracking
- GitHub API integration
- Discord notifications
- Telegram bot integration

### 4. Playground Service (playground-service/) - Python
- Repository cloning
- Metadata generation
- SBOM generation (CycloneDX)
- Secure sandboxed execution

### 5. Database - PostgreSQL
- User management
- Scan history
- VCS consent tracking
- Rate limiting data


┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Homepage   │ http://localhost:3000
│              │
│  [Sign Up]   │────┐
│   [Login]    │    │
└──────────────┘    │
                    ▼
              ┌──────────────┐
              │ Signup Page  │ /auth/signup
              │              │
              │ • Company    │
              │ • Name       │
              │ • Mobile     │
              │ • Email      │◄─── Real-time validation
              │ • Password   │     (checks disposable emails)
              └──────┬───────┘
                     │ Submit
                     ▼
              ┌──────────────┐
              │   Backend    │ POST /signup
              │   API        │
              │              │
              │ 1. Validate  │◄─── • Email validation
              │ 2. Check     │     • Phone validation
              │ 3. Create    │     • Password strength
              │ 4. Send      │     • Rate limiting (3/hr)
              └──────┬───────┘
                     │ Success
                     ▼
              ┌──────────────┐
              │   Email      │
              │   Service    │
              │              │
              │ 📧 Send      │◄─── Beautiful HTML template
              │ Verification │     with security warnings
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │Success Page  │ "Check your email!"
              │              │
              │ [Go to       │────┐
              │  Login]      │    │
              └──────────────┘    │
                                  │
        ┌─────────────────────────┘
        │
        ▼
┌──────────────┐
│ Email Inbox  │
│              │
│ ✉️  Verify   │
│ Your Email   │
│              │
│ [Verify      │────┐
│  Button]     │    │
└──────────────┘    │
                    ▼
              ┌──────────────┐
              │ Verification │ GET /verify-email/{token}
              │   Backend    │
              │              │
              │ 1. Check     │◄─── • Token validation
              │    token     │     • Expiry check (24hrs)
              │ 2. Update    │     • Update is_verified
              │    user      │
              └──────┬───────┘
                     │ Success
                     ▼
              ┌──────────────┐
              │ Verified!    │ /auth/verify/[token]
              │              │
              │ ✓ Email      │
              │   Verified   │
              │              │
              │ [Go to       │────┐
              │  Login]      │    │
              └──────────────┘    │
                                  │
        ┌─────────────────────────┘
        │
        ▼
┌──────────────┐
│  Login Page  │ /auth/login
│              │
│ • Email      │
│ • Password   │
└──────┬───────┘
       │ Submit
       ▼
┌──────────────┐
│   Backend    │ POST /login
│   API        │
│              │
│ 1. Find user │◄─── • Email lookup
│ 2. Verify    │     • Password check (bcrypt)
│    password  │     • Verification check
│ 3. Check     │     • Active check
│    verified  │
│ 4. Generate  │     • JWT token
│    token     │     • 30 min expiry
└──────┬───────┘
       │ Success
       ▼
┌──────────────┐
│ Token Saved  │ localStorage
│              │
│ • auth_token │◄─── JWT stored in browser
│ • user       │     User data cached
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Dashboard   │ /dashboard (Protected)
│              │
│ ┌──────────┐ │
│ │ Avatar   │ │◄─── • User name initial
│ │ John Doe │ │     • Company name
│ │ Tech     │ │     • ✓ Verified badge
│ └──────────┘ │     • Dropdown menu
│              │
│ • Repos      │
│ • Analytics  │
│ • Settings   │
└──────┬───────┘
       │ Click Avatar
       ▼
┌──────────────┐
│  User Menu   │
│              │
│ • Profile    │
│ • Settings   │
│ • [Logout]   │────┐
└──────────────┘    │
                    ▼
              ┌──────────────┐
              │   Logout     │
              │              │
              │ 1. Clear     │◄─── Remove tokens
              │    tokens    │     Clear localStorage
              │ 2. Redirect  │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  Login Page  │ Back to /auth/login
              └──────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         ERROR SCENARIOS                                  │
└─────────────────────────────────────────────────────────────────────────┘

Disposable Email
  ├─► Check Email API
  └─► ❌ "Temporary emails not allowed"

Weak Password
  ├─► Client validation
  └─► ❌ "Must contain uppercase, lowercase, digit"

Login Before Verify
  ├─► Backend check
  ├─► ❌ "Email not verified"
  └─► Show "Resend Verification" button
       └─► POST /resend-verification
            ├─► Rate limit: 2/hour (IP)
            └─► Rate limit: 5 min (user)

Token Expired
  ├─► 24 hours passed
  └─► ❌ "Verification link expired"
       └─► Request new link

No Auth Token
  ├─► Access /dashboard
  └─► Redirect to /auth/login


┌─────────────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYERS                                    │
└─────────────────────────────────────────────────────────────────────────┘

Frontend Security:
  • Real-time email validation
  • Client-side password rules
  • Phone format validation
  • Route protection (auth check)
  • Secure token storage

Backend Security:
  • 200+ disposable domains blocked
  • Rate limiting (3 signups/hr, 2 resends/hr)
  • Template injection prevention (MarkupSafe)
  • Input sanitization (company, name fields)
  • Password hashing (bcrypt)
  • JWT authentication
  • Email verification required
  • 24-hour token expiry
  • Per-user email rate limit (5 min)

Database:
  • PostgreSQL with password hashing
  • Indexed email field
  • Verification token storage
  • Rate limit tracking


┌─────────────────────────────────────────────────────────────────────────┐
│                       TECH STACK                                         │
└─────────────────────────────────────────────────────────────────────────┘

Frontend (sbom-fe/):
  • Next.js 16.0.3
  • React 19.2.0
  • TypeScript
  • Tailwind CSS
  • Radix UI components
  • Lucide React icons
  • Shadcn UI components

Backend (bom-be/):
  • FastAPI 0.104.1
  • PostgreSQL 15
  • SQLAlchemy 2.0.23 (async)
  • JWT (python-jose)
  • bcrypt password hashing
  • aiosmtplib (async email)
  • Jinja2 templates
  • SlowAPI rate limiting
  • phonenumbers validation
  • Docker & Docker Compose

Integration Service (integration-service/):
  • Node.js with Express
  • PostgreSQL client
  • GitHub API integration
  • Discord/Telegram webhooks

Playground Service (playground-service/):
  • Python FastAPI
  • Git operations
  • CycloneDX SBOM generation
  • Docker sandboxing


┌─────────────────────────────────────────────────────────────────────────┐
│                    TIER-BASED SCANNING SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────┘

Tier System Overview:
  • FREE TIER:  1 scan per month, auto-resets 1st of month
  • PREMIUM TIER: Unlimited scans

┌──────────────┐
│  Dashboard   │ http://localhost:3000/dashboard
│              │
│ ┌──────────┐ │
│ │Tier Card │ │◄─── Shows: "Free Tier: 0/1 scans remaining"
│ │          │ │            or "Premium: Unlimited scans"
│ │ [Upgrade]│ │
│ └──────────┘ │
│              │
│ [Scan Repo]  │────┐
│ [History]    │    │
└──────────────┘    │
                    ▼
              ┌──────────────┐
              │  Scan Page   │ /scan
              │              │
              │ 1. Load      │◄─── GET /scan/tier-status
              │    tier      │     Returns: {tier, scans_used, 
              │    status    │              scans_remaining, can_scan}
              │              │
              │ 2. GitHub    │◄─── Browse repos via GitHub API
              │    Repo      │     (requires github_token)
              │    Selector  │
              │              │
              │ 3. Select    │
              │    repo &    │
              │    branch    │
              └──────┬───────┘
                     │ Click "Scan"
                     ▼
              ┌──────────────┐
              │   Backend    │ POST /scan/start
              │   Scan API   │ Body: {repo_url, branch}
              │              │
              │ Step 1:      │◄─── Check user tier
              │ Tier Check   │     if free && scans >= 1:
              │              │       raise HTTPException(429)
              │              │
              │ Step 2:      │◄─── Increment scans_this_month
              │ Update Count │     Check last_scan_reset
              │              │     (reset if new month)
              │              │
              │ Step 3:      │◄─── POST playground/clone
              │ Clone Repo   │     Returns: repo_id, path
              │              │
              │ Step 4:      │◄─── POST playground/generate
              │ Metadata     │     Returns: {total_files, 
              │              │              total_lines, languages,
              │              │              md5_hash, sha256_hash}
              │              │
              │ Step 5:      │◄─── POST playground/bom
              │ Generate     │     Returns: CycloneDX SBOM JSON
              │ SBOM         │     {components: [{name, version,
              │              │                     purl, type}]}
              │              │
              │ Step 6:      │◄─── VulnerabilityScanner service
              │ Scan Vulns   │     • Parse SBOM components
              │              │     • Query OSV.dev API
              │              │     • Query NVD API
              │              │     • Query GitHub Advisory
              │              │     • Aggregate results
              │              │     • Calculate severity counts
              │              │
              │ Step 7:      │◄─── INSERT scan_history
              │ Save to DB   │     (scan_id, user_id, repo_url,
              │              │      vuln counts, metadata)
              └──────┬───────┘
                     │ Return ScanResponse
                     ▼
              ┌──────────────┐
              │ Results Page │ /scan
              │              │
              │ ┌──────────┐ │
              │ │ Summary  │ │◄─── 📊 4 cards:
              │ │ Cards    │ │     • Total Files
              │ └──────────┘ │     • Total Lines
              │              │     • Components (SBOM)
              │ ┌──────────┐ │     • Vulnerabilities
              │ │Risk Badge│ │◄─── 🚨 Critical/High/Medium/Low
              │ └──────────┘ │     Color-coded severity
              │              │
              │ ┌──────────┐ │
              │ │ Repo Info│ │◄─── Repository URL, branch
              │ │          │ │     Scan ID, timestamp
              │ │          │ │     MD5/SHA256 hashes
              │ │          │ │     Languages detected
              │ └──────────┘ │
              │              │
              │ ┌──────────┐ │
              │ │SBOM Table│ │◄─── Component list:
              │ │          │ │     Name | Version | Type
              │ │ (50 max) │ │     (pagination for large)
              │ └──────────┘ │
              │              │
              │ [New Scan]   │
              │ [History]    │────┐
              └──────────────┘    │
                                  ▼
                            ┌──────────────┐
                            │ History Page │ /scan/history
                            │              │
                            │ ┌──────────┐ │
                            │ │  Stats   │ │◄─── Total scans
                            │ │Dashboard │ │     Clean repos
                            │ └──────────┘ │     Critical issues
                            │              │
                            │ Scan List:   │◄─── GET /scan/history
                            │              │     Params: limit=20, offset=0
                            │ [Scan 1]     │
                            │  • Repo URL  │     For each scan:
                            │  • Branch    │     • Repository info
                            │  • Timestamp │     • Vulnerability counts
                            │  • Vulns: 15 │     • Risk badge
                            │  [View]──────┼───► /scan/details/:id
                            │              │     (TODO: details page)
                            │ [Scan 2]     │
                            │ ...          │
                            │              │
                            │ [Prev] 1/5   │◄─── Pagination controls
                            │        [Next]│     20 scans per page
                            └──────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    VULNERABILITY SCANNER DETAIL                          │
└─────────────────────────────────────────────────────────────────────────┘

VulnerabilityScanner Service (bom-be/scanner_service.py):

┌──────────────────────────────────────────────────────────────────────────┐
│                        scan_bom_async(bom_data)                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │  Parse SBOM Components      │
                    │  Extract: name, version,    │
                    │          purl, ecosystem    │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌──────────────────┐
        │ For each package: │       │ Async semaphore  │
        │ • npm packages    │       │ Max 5 concurrent │
        │ • Python packages │       │ API requests     │
        │ • Maven packages  │       └──────────────────┘
        │ • Ruby gems       │
        │ • Go modules      │
        └─────────┬─────────┘
                  │
                  ▼
        ┌──────────────────────────────────────────────┐
        │      scan_package(name, version, ecosystem)  │
        └──────────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────────┐
│  OSV    │  │  NVD    │  │  GitHub     │
│  API    │  │  API    │  │  Advisory   │
└────┬────┘  └────┬────┘  └──────┬──────┘
     │            │              │
     │ GET        │ GET          │ POST
     │ /v1/query  │ /rest/json/  │ /graphql
     │            │  cves/2.0    │
     │            │              │
     ▼            ▼              ▼
┌─────────────────────────────────────┐
│  Aggregate Results:                 │
│  • Vulnerability ID (CVE, GHSA)     │
│  • Severity (CRITICAL/HIGH/MED/LOW) │
│  • Summary description              │
│  • References/links                 │
│  • Affected versions                │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Calculate Summary:                 │
│  {                                  │
│    critical: 3,                     │
│    high: 5,                         │
│    medium: 7,                       │
│    low: 2,                          │
│    unknown: 1                       │
│  }                                  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Return ScanResult:                 │
│  {                                  │
│    total_vulnerabilities: 18,       │
│    summary: {...},                  │
│    scan_results: [                  │
│      {package, vulnerabilities: []} │
│    ]                                │
│  }                                  │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                       DATABASE SCHEMA (UPDATED)                          │
└─────────────────────────────────────────────────────────────────────────┘

users table (MODIFIED):
┌────────────────────┬──────────────┬─────────────────────────────────┐
│ Column             │ Type         │ Description                     │
├────────────────────┼──────────────┼─────────────────────────────────┤
│ id                 │ SERIAL       │ Primary key                     │
│ company            │ VARCHAR(100) │ Company name                    │
│ name               │ VARCHAR(100) │ User full name                  │
│ mobile             │ VARCHAR(20)  │ Phone number                    │
│ email              │ VARCHAR(255) │ Email (unique, indexed)         │
│ password           │ VARCHAR(255) │ bcrypt hashed password          │
│ is_verified        │ BOOLEAN      │ Email verification status       │
│ is_active          │ BOOLEAN      │ Account active status           │
│ verification_token │ VARCHAR(255) │ Email verification token        │
│ created_at         │ TIMESTAMP    │ Account creation time           │
│ user_tier          │ VARCHAR(10)  │ 'free' or 'premium' ⭐ NEW     │
│ scans_this_month   │ INTEGER      │ Scan count for current month ⭐ │
│ last_scan_reset    │ TIMESTAMP    │ Last monthly reset date ⭐      │
└────────────────────┴──────────────┴─────────────────────────────────┘

scan_history table (NEW):
┌────────────────────────────┬──────────────┬──────────────────────────┐
│ Column                     │ Type         │ Description              │
├────────────────────────────┼──────────────┼──────────────────────────┤
│ scan_id                    │ UUID         │ Primary key              │
│ user_id                    │ INTEGER      │ FK to users(id)          │
│ repository_url             │ TEXT         │ Git repository URL       │
│ branch                     │ VARCHAR(255) │ Branch name (default:    │
│                            │              │ 'main')                  │
│ total_lines                │ INTEGER      │ Total lines of code      │
│ total_files                │ INTEGER      │ Total files scanned      │
│ total_components           │ INTEGER      │ SBOM component count     │
│ total_vulnerabilities      │ INTEGER      │ Total vulns found        │
│ critical_vulnerabilities   │ INTEGER      │ Critical severity count  │
│ high_vulnerabilities       │ INTEGER      │ High severity count      │
│ medium_vulnerabilities     │ INTEGER      │ Medium severity count    │
│ low_vulnerabilities        │ INTEGER      │ Low severity count       │
│ scan_status                │ VARCHAR(50)  │ 'completed'/'failed'     │
│ created_at                 │ TIMESTAMP    │ Scan timestamp           │
│ INDEX                      │              │ (user_id, created_at)    │
└────────────────────────────┴──────────────┴──────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                       API ENDPOINTS (COMPLETE)                           │
└─────────────────────────────────────────────────────────────────────────┘

Authentication Endpoints (bom-be/main.py):
  POST   /signup                    # Create new account
  POST   /login                     # Login and get JWT token
  GET    /verify-email/{token}      # Verify email address
  POST   /resend-verification       # Resend verification email
  POST   /forgot-password           # Request password reset
  POST   /reset-password            # Reset password with token

Scan Endpoints (bom-be/main.py) ⭐ NEW:
  POST   /scan/start                # Initiate repository scan
         Body: {repo_url: str, branch?: str}
         Returns: ScanResponse (metadata, SBOM, vulnerabilities)
         
  GET    /scan/tier-status          # Get user's tier status
         Returns: {tier, scan_limit, scans_used, scans_remaining,
                  last_scan, total_scans, next_reset, can_scan}
         
  POST   /scan/upgrade-tier         # Upgrade to premium
         Returns: {message, new_tier}
         
  GET    /scan/history              # Get paginated scan history
         Params: ?limit=20&offset=0
         Returns: {scans: [], total, limit, offset}
         
  GET    /scan/history/{scan_id}    # Get detailed scan results
         Returns: Full scan details

Playground Service Endpoints (playground-service/main.py):
  POST   /clone                     # Clone git repository
         Body: {repo_url: str, branch?: str}
         Returns: {success, repo_id, clone_path}
         
  POST   /generate                  # Generate repository metadata
         Body: {repo_id: str}
         Returns: {total_files, total_lines, languages, 
                  file_types, md5_hash, sha256_hash}
         
  POST   /bom                       # Generate SBOM
         Body: {repo_id: str}
         Returns: CycloneDX JSON SBOM

VCS Consent Endpoints (integration-service):
  GET    /api/vcs/consent           # Check VCS consent status
  POST   /api/vcs/consent           # Give VCS consent
  POST   /api/vcs/scan              # Record scan event


┌─────────────────────────────────────────────────────────────────────────┐
│                     RATE LIMITING & SECURITY                             │
└─────────────────────────────────────────────────────────────────────────┘

Rate Limits:
  • Signup:              3 per hour per IP
  • Login:               5 per minute per IP
  • Resend Verification: 2 per hour per IP
  • Email per User:      5 minute cooldown
  • Password Reset:      3 per hour per IP
  • Scan Start (Free):   1 per month (tier-based)
  • Scan Start (Premium): Unlimited

Security Measures:
  ✓ JWT token authentication (30 min expiry)
  ✓ bcrypt password hashing (12 rounds)
  ✓ Email verification required
  ✓ Disposable email blocking (200+ domains)
  ✓ Input sanitization (company, name fields)
  ✓ Template injection prevention (MarkupSafe)
  ✓ CORS configuration
  ✓ SQL injection protection (SQLAlchemy ORM)
  ✓ Rate limiting (SlowAPI)
  ✓ Docker sandboxing (playground service)
  ✓ Tier-based access control
  ✓ VCS consent tracking


┌─────────────────────────────────────────────────────────────────────────┐
│                     SERVICE COMMUNICATION                                │
└─────────────────────────────────────────────────────────────────────────┘

Frontend ←→ Backend (HTTP/JSON):
  • Authentication requests
  • Scan API calls
  • Tier management
  • History queries

Backend ←→ Playground Service (HTTP/JSON):
  • Repository cloning
  • Metadata generation
  • SBOM creation

Backend ←→ Integration Service (HTTP/JSON):
  • VCS consent checks
  • Scan event recording

Backend ←→ External APIs:
  • OSV.dev (vulnerability data)
  • NVD API (CVE database)
  • GitHub Advisory (security advisories)
  • Email SMTP (verification emails)

Playground Service ←→ Git:
  • Repository cloning
  • Branch checkout

All Services ←→ PostgreSQL:
  • User data
  • Scan history
  • VCS consent
  • Rate limiting


┌─────────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────┘

Development (localhost):
  Frontend:            http://localhost:3000
  Backend:             http://localhost:8001
  Integration Service: http://localhost:3001
  Playground Service:  http://localhost:5002
  PostgreSQL:          localhost:5432

Production (Docker Compose):
  ┌─────────────────────────────────────────────────────────┐
  │                     Docker Network                      │
  │                                                         │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
  │  │ Frontend │  │ Backend  │  │Integration│            │
  │  │  (3000)  │  │  (8001)  │  │  (3001)  │            │
  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
  │       │             │              │                   │
  │       └──────┬──────┴──────┬───────┘                  │
  │              │             │                           │
  │       ┌──────▼─────┐  ┌────▼──────┐                  │
  │       │ Playground │  │PostgreSQL │                   │
  │       │   (5002)   │  │  (5432)   │                   │
  │       └────────────┘  └───────────┘                   │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

Environment Variables:
  Backend:
    • DATABASE_URL
    • JWT_SECRET
    • SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
    • PLAYGROUND_SERVICE_URL
    
  Frontend:
    • NEXT_PUBLIC_API_URL (auto-detected)


┌─────────────────────────────────────────────────────────────────────────┐
│                     MONITORING & DEBUGGING                               │
└─────────────────────────────────────────────────────────────────────────┘

Database Queries (Useful for monitoring):

-- Check user tiers
SELECT username, email, user_tier, scans_this_month, last_scan_reset
FROM users
WHERE scans_this_month > 0;

-- Recent scans
SELECT scan_id, repository_url, total_vulnerabilities, 
       critical_vulnerabilities, created_at
FROM scan_history
ORDER BY created_at DESC
LIMIT 10;

-- Vulnerability statistics
SELECT 
  AVG(total_vulnerabilities) as avg_vulns,
  MAX(critical_vulnerabilities) as max_critical,
  COUNT(*) as total_scans
FROM scan_history
WHERE created_at > NOW() - INTERVAL '7 days';

-- Monthly scan counts by tier
SELECT user_tier, COUNT(*) as scans
FROM users u
JOIN scan_history s ON u.id = s.user_id
WHERE s.created_at > DATE_TRUNC('month', NOW())
GROUP BY user_tier;

Logs:
  • Backend: Console output (uvicorn logs)
  • Frontend: Browser DevTools console
  • Playground: Service logs in console
  • Database: PostgreSQL logs


┌─────────────────────────────────────────────────────────────────────────┐
│                     FEATURE ROADMAP                                      │
└─────────────────────────────────────────────────────────────────────────┘

✅ Completed:
  • User authentication with email verification
  • Tier-based access control (Free/Premium)
  • Repository scanning with vulnerability detection
  • SBOM generation (CycloneDX)
  • Multi-source vulnerability scanning (OSV, NVD, GitHub)
  • Scan history with pagination
  • Modern responsive UI
  • GitHub integration
  • VCS consent tracking

🚧 In Progress:
  • Scan details page (/scan/details/:id)
  • Export functionality (PDF, JSON, CSV)

📋 Planned:
  • Email notifications (critical vulns, scan completion)
  • Advanced filtering (date range, severity, repo name)
  • Vulnerability trends and analytics
  • Remediation recommendations
  • Scheduled scans
  • API keys for programmatic access
  • Webhook integrations
  • Multi-language support
  • Dark mode
```
