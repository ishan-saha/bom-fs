# Telegram API

Complete API reference for Telegram integration endpoints.

## Overview

The Telegram API allows you to send messages to users via the Telegram Bot API and retrieve message history.

**Base Path:** `/api`

**Total Endpoints:** 3

## Authentication

No authentication required for these endpoints. However, users must start a conversation with your bot before receiving messages.

## Endpoints

### 1. Send Message

Send a text message to a Telegram user.

**Endpoint:** `POST /api/send-message`

**Request Body:**
```json
{
  "message": "Hello from Integration Service!",
  "receiver": "123456789"
}
```

**Parameters:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `message` | string | Yes | 1-4096 chars | Message text to send |
| `receiver` | string | Yes | Numbers only | Telegram chat ID |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "chatId": "123456789",
    "messageId": 42,
    "timestamp": "2025-12-02T10:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid message format or content",
  "timestamp": "2025-12-02T10:00:00.000Z"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Bot was blocked by the user",
  "timestamp": "2025-12-02T10:00:00.000Z"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Chat ID not found or user has not started the bot",
  "timestamp": "2025-12-02T10:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "receiver": "123456789"
  }'
```

---

### 2. Get Message History

Retrieve message history for a specific chat.

**Endpoint:** `GET /api/messages/:chatId`

**Path Parameters:**
- `chatId` (required) - Telegram chat ID (numbers only)

**Query Parameters:**
- `limit` (optional) - Number of messages to retrieve (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "chatId": "123456789",
    "messages": [
      {
        "id": 1,
        "chat_id": "123456789",
        "message": "Hello!",
        "sent_at": "2025-12-02T10:00:00.000Z",
        "status": "sent"
      },
      {
        "id": 2,
        "chat_id": "123456789",
        "message": "Welcome!",
        "sent_at": "2025-12-02T10:05:00.000Z",
        "status": "sent"
      }
    ],
    "count": 2
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid chat ID format"
}
```

**Example:**
```bash
# Get last 50 messages
curl http://localhost:3000/api/messages/123456789

# Get last 10 messages
curl http://localhost:3000/api/messages/123456789?limit=10
```

---

### 3. Get Bot Status

Get Telegram bot connection status and information.

**Endpoint:** `GET /api/bot-status`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "bot": {
      "id": 123456789,
      "username": "your_bot",
      "firstName": "Your Bot Name",
      "canJoinGroups": true,
      "canReadAllGroupMessages": false,
      "supportsInlineQueries": false
    }
  }
}
```

**Response (when bot not connected):**
```json
{
  "success": true,
  "data": {
    "connected": false,
    "bot": null
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/bot-status
```

---

## Usage Examples

### Python

```python
import requests

BASE_URL = "http://localhost:3000"

# Send message
def send_telegram_message(chat_id, message):
    response = requests.post(
        f"{BASE_URL}/api/send-message",
        json={"message": message, "receiver": chat_id}
    )
    return response.json()

# Get message history
def get_message_history(chat_id, limit=50):
    response = requests.get(
        f"{BASE_URL}/api/messages/{chat_id}",
        params={"limit": limit}
    )
    return response.json()

# Get bot status
def get_bot_status():
    response = requests.get(f"{BASE_URL}/api/bot-status")
    return response.json()

# Usage
result = send_telegram_message("123456789", "Hello from Python!")
print(result)

history = get_message_history("123456789", limit=10)
print(f"Found {history['data']['count']} messages")

status = get_bot_status()
print(f"Bot connected: {status['data']['connected']}")
```

### Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Send message
async function sendTelegramMessage(chatId, message) {
  const response = await axios.post(`${BASE_URL}/api/send-message`, {
    message: message,
    receiver: chatId
  });
  return response.data;
}

// Get message history
async function getMessageHistory(chatId, limit = 50) {
  const response = await axios.get(
    `${BASE_URL}/api/messages/${chatId}`,
    { params: { limit } }
  );
  return response.data;
}

// Get bot status
async function getBotStatus() {
  const response = await axios.get(`${BASE_URL}/api/bot-status`);
  return response.data;
}

// Usage
(async () => {
  const result = await sendTelegramMessage('123456789', 'Hello from Node.js!');
  console.log(result);
  
  const history = await getMessageHistory('123456789', 10);
  console.log(`Found ${history.data.count} messages`);
  
  const status = await getBotStatus();
  console.log(`Bot connected: ${status.data.connected}`);
})();
```

---

## Error Handling

### Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | Invalid message format | Message too long or invalid | Check message length (max 4096) |
| 400 | Invalid chat ID format | Non-numeric chat ID | Use numeric chat ID only |
| 403 | Bot was blocked | User blocked the bot | User must unblock bot |
| 404 | Chat not found | User hasn't started bot | User must send `/start` to bot |
| 500 | Internal server error | Server or Telegram API issue | Check logs, retry |

### Getting Chat ID

Users must start a conversation with your bot first:

1. User sends `/start` to your bot
2. Bot logs the chat ID: `📨 Incoming message request for chat ID: 123456789`
3. Use this chat ID for API calls

Alternative methods:
- Use `@userinfobot` on Telegram
- Check Telegram web app console
- Use bot API `getUpdates` endpoint

---

## Rate Limits

Telegram API has rate limits:
- 30 messages per second per bot
- 20 messages per minute per user

The service does not implement rate limiting. Handle this in your application.

---

## Best Practices

1. **Store Chat IDs**: Save chat IDs after users start bot
2. **Handle Errors**: Implement retry logic for transient errors
3. **Validate Messages**: Check message length before sending
4. **Monitor Status**: Regularly check bot status
5. **User Consent**: Only send messages to users who opted in

---

## Related Pages

- [Telegram Bot Setup](Telegram-Bot-Setup)
- [Discord API](Discord-API)
- [Email API](Email-API)
