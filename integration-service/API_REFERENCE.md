# INTEGRATION SERVICE API REFERENCE
# Complete list of all available APIs with curl commands

## 🚀 SERVICE HEALTH
# Check if the service is running
curl.exe http://localhost:3000/api/health

## 📱 TELEGRAM APIs

### Send Message
# Send a message to Telegram chat
curl.exe -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"receiver": "1587024489", "message": "Your message here"}'

# Using file (telegram-message.json)
curl.exe -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d "@telegram-message.json"

### Get Message History
# Retrieve message history for a chat
curl.exe http://localhost:3000/api/messages/1587024489

## 💬 DISCORD APIs

### Send Message to User (DM)
# Send direct message to a Discord user
curl.exe -X POST http://localhost:3000/api/discord/send-message \
  -H "Content-Type: application/json" \
  -d '{"receiver": "USER_ID_HERE", "message": "Your message here"}'

### Send Message to Channel
# Send message to a Discord channel
curl.exe -X POST http://localhost:3000/api/discord/send-message \
  -H "Content-Type: application/json" \
  -d '{"receiver": "1392614645944291510", "message": "Your message here"}'

# Using file (discord-message.json)
curl.exe -X POST http://localhost:3000/api/discord/send-message \
  -H "Content-Type: application/json" \
  -d "@discord-message.json"

### Get Discord Bot Status
# Check Discord bot connection status
curl.exe http://localhost:3000/api/discord/bot-status

### Get Discord Message History
# Retrieve message history for a user or channel
curl.exe http://localhost:3000/api/discord/messages/USER_OR_CHANNEL_ID

## 📄 MESSAGE FILE FORMATS

### telegram-message.json
{
  "receiver": "1587024489",
  "message": "Hello from Telegram API!"
}

### discord-message.json
{
  "receiver": "1392614645944291510", 
  "message": "Hello from Discord API!"
}

## 📊 RESPONSE FORMATS

### Success Response
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "chatId": "1587024489",
    "messageId": 123,
    "timestamp": "2025-07-25T10:30:45.123Z"
  }
}

### Error Response
{
  "success": false,
  "error": "Validation failed",
  "details": "Message is required",
  "timestamp": "2025-07-25T10:30:45.123Z"
}

## 🧪 QUICK TEST COMMANDS

# Test service health
curl.exe http://localhost:3000/api/health

# Test Telegram message
curl.exe -X POST http://localhost:3000/api/send-message -H "Content-Type: application/json" -d "{\"receiver\":\"1587024489\",\"message\":\"API Test Message\"}"

# Test Discord channel message
curl.exe -X POST http://localhost:3000/api/discord/send-message -H "Content-Type: application/json" -d "{\"receiver\":\"1392614645944291510\",\"message\":\"API Test Message\"}"

# Check Discord bot status
curl.exe http://localhost:3000/api/discord/bot-status

# Get Telegram message history
curl.exe http://localhost:3000/api/messages/1587024489

# Get Discord message history
curl.exe http://localhost:3000/api/discord/messages/1392614645944291510

## 🔧 SERVICE CONFIGURATION

# Your current configuration:
# Telegram Bot: @ishika_integration_bot
# Discord Bot: mybotApp
# Service Port: 3000
# Database: PostgreSQL (telegram_service)

## 📝 NOTES

1. Replace "USER_ID_HERE" with actual Discord user IDs
2. Replace "1392614645944291510" with your target channel ID
3. Replace "1587024489" with your target Telegram chat ID
4. All timestamps are in ISO format
5. Message history is ordered by newest first (DESC)
6. Maximum message length: 4096 characters (Telegram), 2000 characters (Discord)
