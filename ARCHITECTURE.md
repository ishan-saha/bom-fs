# Authentication Flow Diagram

```
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
```
