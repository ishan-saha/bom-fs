# Email Service API Documentation

## Overview
This email service allows you to create sender and recipient profiles, then send emails using those profiles. All email activities are logged in the database.

## Quick Start

### 1. Create a Sender Profile
```bash
curl -X POST http://localhost:3000/api/email/sender-profiles \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "password": "your-app-password",
    "sender_name": "Your Name",
    "organization": "Your Organization",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_secure": false
  }'
```

### 2. Create a Recipient Profile
```bash
curl -X POST http://localhost:3000/api/email/recipient-profiles \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recipient@example.com",
    "name": "Recipient Name",
    "category": "customers",
    "notes": "Important client"
  }'
```

### 3. Send Email
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "sender_profile_id": 1,
    "recipient_profile_id": 1,
    "subject": "Custom Subject (optional)",
    "body": "Custom email body (optional)"
  }'
```

## API Endpoints

### Sender Profiles
- `POST /api/email/sender-profiles` - Create sender profile
- `GET /api/email/sender-profiles` - List all sender profiles
- `POST /api/email/test-config/:profileId` - Test sender configuration

### Recipient Profiles
- `POST /api/email/recipient-profiles` - Create recipient profile
- `GET /api/email/recipient-profiles` - List all recipient profiles

### Email Operations
- `POST /api/email/send` - Send email using profiles
- `GET /api/email/logs` - View email history

## Gmail Setup (Example)

### For Gmail SMTP:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use these settings:
   ```json
   {
     "email": "your-email@gmail.com",
     "password": "your-16-digit-app-password",
     "smtp_host": "smtp.gmail.com",
     "smtp_port": 587,
     "smtp_secure": false
   }
   ```

## Default Email Template

When you don't provide a custom subject or body, the service uses this template:

**Subject**: "Notification from Integration Service"

**Body**:
```html
<html>
  <body>
    <h2>Hello [Recipient Name]!</h2>
    <p>This is an automated message from our Integration Service.</p>
    <p>We hope this message finds you well.</p>
    <br>
    <p>Best regards,</p>
    <p><strong>[Sender Name]</strong></p>
    <p>[Organization]</p>
    <hr>
    <small>
      This email was sent automatically from our integration service. 
      Please do not reply to this email.
    </small>
  </body>
</html>
```

## Database Schema

The service creates three tables:
- `email_sender_profiles` - SMTP configurations
- `email_recipient_profiles` - Recipient information
- `email_logs` - Email sending history

## Error Handling

The service provides detailed error messages for:
- Invalid SMTP configuration
- Authentication failures
- Network connectivity issues
- Database errors
- Validation errors

## Security Notes

⚠️ **Important**: In production:
- Encrypt passwords in the database
- Use environment variables for sensitive data
- Implement rate limiting
- Add authentication to API endpoints
- Use HTTPS only

## Example Workflow

```javascript
// 1. Create sender profile
const senderResponse = await fetch('/api/email/sender-profiles', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'sender@company.com',
    password: 'app-password',
    sender_name: 'Company Name',
    organization: 'Your Company',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: false
  })
});

// 2. Create recipient profile
const recipientResponse = await fetch('/api/email/recipient-profiles', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'customer@example.com',
    name: 'Customer Name',
    category: 'customers'
  })
});

// 3. Send email
const emailResponse = await fetch('/api/email/send', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    sender_profile_id: 1,
    recipient_profile_id: 1,
    subject: 'Welcome to our service!',
    body: '<h1>Welcome!</h1><p>Thank you for joining us.</p>'
  })
});
```
