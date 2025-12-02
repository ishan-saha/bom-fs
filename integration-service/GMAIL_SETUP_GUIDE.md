# Gmail SMTP Setup Guide

## Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the setup process

## Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)"
4. Enter name: "Integration Service"
5. Click "Generate"
6. **COPY the 16-digit password** (example: abcd efgh ijkl mnop)

## Step 3: Edit gmail-sender-template.json
Replace these values in the file:
- `YOUR_GMAIL_ADDRESS@gmail.com` → your actual Gmail
- `YOUR_16_DIGIT_APP_PASSWORD` → the app password from Step 2
- `Your Name` → your actual name

## Step 4: Create Sender Profile
Run this command after editing the template:
```bash
curl.exe -X POST http://localhost:3000/api/email/sender-profiles -H "Content-Type: application/json" -d "@gmail-sender-template.json"
```

## Step 5: Send Test Email
After creating the profile, send email to chauhanishika97@gmail.com:
```bash
curl.exe -X POST http://localhost:3000/api/email/send -H "Content-Type: application/json" -d "{\"sender_profile_id\": 2, \"recipient_profile_id\": 2}"
```

## Example Template (after filling):
```json
{
  "email": "john.doe@gmail.com",
  "password": "abcd efgh ijkl mnop",
  "sender_name": "John Doe",
  "organization": "Integration Service",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_secure": false
}
```

## Security Notes
- Never share your app password
- The app password is different from your Gmail password
- You can revoke app passwords anytime from Google Account settings
