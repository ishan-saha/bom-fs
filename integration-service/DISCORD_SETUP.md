# Discord Integration Setup Guide

## Overview
This guide will help you set up Discord bot integration for your service.

## Prerequisites
- Node.js installed
- PostgreSQL database running
- Discord Developer Account

## Step 1: Create a Discord Application

1. **Go to Discord Developer Portal**
   - Visit: https://discord.com/developers/applications
   - Log in with your Discord account

2. **Create New Application**
   - Click "New Application"
   - Enter a name for your bot (e.g., "Integration Service Bot")
   - Click "Create"

## Step 2: Create a Bot

1. **Navigate to Bot Section**
   - In your application, click "Bot" in the left sidebar
   - Click "Add Bot"
   - Confirm by clicking "Yes, do it!"

2. **Configure Bot Settings**
   - Set a username for your bot
   - Upload an avatar (optional)
   - Under "Privileged Gateway Intents":
     - Enable "Message Content Intent" (required for reading message content)

## Step 3: Get Bot Token

1. **Copy Bot Token**
   - In the Bot section, under "Token"
   - Click "Copy" to copy your bot token
   - **Keep this token secure!**

2. **Update .env File**
   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   ```

## Step 4: Invite Bot to Server (Optional)

1. **Generate Invite Link**
   - Go to "OAuth2" > "URL Generator"
   - Under "Scopes", select "bot"
   - Under "Bot Permissions", select:
     - "Send Messages"
     - "Read Message History"
     - "Use Slash Commands"

2. **Invite Bot**
   - Copy the generated URL
   - Open it in a browser
   - Select a server where you have admin permissions
   - Click "Authorize"

## Step 5: Get Your Discord User ID

1. **Enable Developer Mode**
   - In Discord, go to Settings > App Settings > Advanced
   - Enable "Developer Mode"

2. **Get Your User ID**
   - Right-click on your username anywhere in Discord
   - Click "Copy User ID"
   - This is your Discord User ID for testing

## Step 6: Test the Integration

### API Endpoints

#### Send Message
```http
POST http://localhost:3000/api/discord/send-message
Content-Type: application/json

{
    "receiver": "your_discord_user_id",
    "message": "Hello from Discord Integration!"
}
```

#### Get Bot Status
```http
GET http://localhost:3000/api/discord/bot-status
```

#### Get Message History
```http
GET http://localhost:3000/api/discord/messages/{user_id}
```

### PowerShell Examples

```powershell
# Send Message
$body = @{
    receiver = "your_discord_user_id"
    message = "Test message from PowerShell"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/discord/send-message" -Method POST -Body $body -ContentType "application/json"

# Check Bot Status
Invoke-RestMethod -Uri "http://localhost:3000/api/discord/bot-status"

# Get Message History
Invoke-RestMethod -Uri "http://localhost:3000/api/discord/messages/your_discord_user_id"
```

## Important Notes

- **Bot Token Security**: Never share your bot token publicly
- **User IDs**: Discord User IDs are 17-19 digit numbers
- **Message Limits**: Discord messages are limited to 2000 characters
- **Rate Limits**: Discord has rate limits for API calls

## Troubleshooting

### Bot Not Responding
1. Check if bot token is correct in .env
2. Verify bot has necessary permissions
3. Check server logs for error messages

### Cannot Send Messages
1. Ensure recipient has DMs enabled
2. Bot must share a server with the user or user must have DMs open
3. Check if user ID is correct

### Permission Errors
1. Verify bot has "Send Messages" permission
2. Check if bot is banned or restricted

## Demo Mode
If no Discord bot token is configured, the service runs in demo mode:
- Messages are logged to console
- Database entries are still created
- No actual Discord messages are sent

This allows testing the API without setting up a Discord bot.
