# 🚀 Quick Start - Full Stack Authentication

Complete authentication system with email verification, JWT tokens, and protected routes.

## Start the System

### 1. Start Backend (Terminal 1)

```bash
cd bom-be

# Configure SMTP in .env (use Gmail App Password)
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# Start with Docker
docker-compose up --build
```

Backend runs on: **http://localhost:8001**
- Swagger Docs: http://localhost:8001/docs

### 2. Start Frontend (Terminal 2)

```bash
cd sbom-fe

# Start Next.js dev server
npm run dev
```

Frontend runs on: **http://localhost:3000**

## Test the Complete Flow

### Step 1: Signup
1. Open http://localhost:3000
2. Click **"Sign Up"**
3. Fill form:
   ```
   Company: Tech Corp
   Name: John Doe
   Mobile: +1234567890
   Email: your-real-email@gmail.com
   Password: SecurePass123
   ```
4. Click **"Sign Up"**
5. See success message

### Step 2: Verify Email
1. Check your email inbox
2. Click verification link
3. See "Email Verified!" message
4. Click **"Go to Login"**

### Step 3: Login
1. Enter credentials:
   ```
   Email: your-real-email@gmail.com
   Password: SecurePass123
   ```
2. Click **"Login"**
3. Redirected to dashboard

### Step 4: View Dashboard
1. See your profile in top-right
2. Click avatar to see dropdown
3. Your name, company, email shown
4. ✓ Verified badge displayed

### Step 5: Logout
1. Click avatar
2. Click **"Logout"**
3. Redirected to login page

## URLs Overview

| Feature | URL |
|---------|-----|
| Homepage | http://localhost:3000 |
| Signup | http://localhost:3000/auth/signup |
| Login | http://localhost:3000/auth/login |
| Dashboard | http://localhost:3000/dashboard |
| API Docs | http://localhost:8001/docs |
| Backend | http://localhost:8001 |

## Test Cases

### ✅ Valid Signup
```
Company: Tech Corp
Name: John Doe
Mobile: +1234567890
Email: john@techcorp.com
Password: SecurePass123
```
**Result**: Account created, verification email sent

### ❌ Disposable Email (Blocked)
```
Email: test@10minutemail.com
```
**Result**: "Temporary/disposable email addresses are not allowed"

### ❌ Weak Password
```
Password: weak
```
**Result**: "Password must contain at least one uppercase letter"

### ❌ Invalid Phone
```
Mobile: 1234567890 (no + prefix)
```
**Result**: "Invalid phone number format"

### ❌ Login Before Verification
```
Login immediately after signup
```
**Result**: "Email not verified" + Resend button

### ✅ Resend Verification
```
Click "Resend Verification Email"
```
**Result**: New email sent (rate limited to 5 min)

## Features Checklist

### Backend ✅
- [x] User signup with validation
- [x] Email verification system
- [x] Disposable email blocking (200+ domains)
- [x] Rate limiting (3 signups/hour)
- [x] JWT authentication
- [x] Password strength requirements
- [x] Phone number validation
- [x] Template injection prevention
- [x] PostgreSQL database
- [x] SMTP email sending

### Frontend ✅
- [x] Responsive signup page
- [x] Responsive login page
- [x] Email verification page
- [x] Real-time email validation
- [x] Password strength indicator
- [x] Protected dashboard routes
- [x] User profile display
- [x] Logout functionality
- [x] Error handling
- [x] Success messages

## Common Issues

### Backend Won't Start
```bash
# Check if port 8001 is in use
netstat -ano | findstr :8001

# Or change port in docker-compose.yml
```

### Frontend Won't Start
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### Email Not Sending
1. Check `bom-be/.env` has SMTP credentials
2. For Gmail: Use App Password
3. Check logs: `docker-compose logs -f bom-auth`

### CORS Error
Update `bom-be/main.py`:
```python
allow_origins=["http://localhost:3000"]
```

### Can't Access Dashboard
1. Check if logged in
2. Open browser console (F12)
3. Check localStorage has token:
   ```javascript
   localStorage.getItem('auth_token')
   ```

## Security Notes

### Passwords
- ✅ Minimum 8 characters
- ✅ Uppercase + lowercase
- ✅ At least one digit
- ✅ Bcrypt hashed

### Email Verification
- ✅ Required before login
- ✅ 24-hour expiration
- ✅ Rate limited resends

### Rate Limiting
- ✅ Signup: 3/hour per IP
- ✅ Resend: 2/hour per IP
- ✅ Email send: 5 min per user

### Blocked Emails
- ✅ 200+ disposable domains
- ✅ Real-time validation
- ✅ Pattern detection

## Development Tips

### View All Users (Admin)
```bash
# Login as admin first
curl -X POST http://localhost:8001/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ishansaha@outlook.com",
    "password": "BomAdmin@2025!Secure"
  }'

# Get admin token, then:
curl http://localhost:8001/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Email Validator
```bash
cd bom-be
python email_validator.py
```

### Clear User Data
```javascript
// In browser console
localStorage.clear()
location.reload()
```

### Database Reset
```bash
cd bom-be
docker-compose down -v
docker-compose up --build
```

## Next Steps

### Add OAuth
- [ ] GitHub OAuth
- [ ] Google OAuth
- [ ] GitLab OAuth

### Add Features
- [ ] Forgot password
- [ ] Change password
- [ ] Edit profile
- [ ] Delete account

### Production Deploy
- [ ] Update environment URLs
- [ ] Configure production SMTP
- [ ] Enable HTTPS
- [ ] Set up CDN
- [ ] Add monitoring

## Support

**Backend Issues**: Check `bom-be/README.md`
**Frontend Issues**: Check `sbom-fe/AUTHENTICATION_SETUP.md`

**Email**: ishansaha@outlook.com
