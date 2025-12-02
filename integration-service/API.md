# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, no authentication is required. In production, consider implementing API keys or OAuth.

## Endpoints

### 1. Send Message
Send a message to a Telegram user.

**Endpoint:** `POST /send-message`

**Request Body:**
```json
{
  "message": "string (required, 1-4096 characters)",
  "receiver": "string (required, numeric chat ID)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "chatId": "123456789",
    "messageId": 456,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Response (Error - 400/404/500):**
```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error message (development only)",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from the integration service!",
    "receiver": "123456789"
  }'
```

### 2. Get Message History
Retrieve message history for a specific chat.

**Endpoint:** `GET /messages/{chatId}`

**Parameters:**
- `chatId` (path): Telegram chat ID
- `limit` (query, optional): Number of messages to retrieve (default: 50)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "chatId": "123456789",
    "messages": [
      {
        "id": 1,
        "chat_id": "123456789",
        "message_text": "Hello!",
        "status": "sent",
        "telegram_message_id": 456,
        "error_message": null,
        "sent_at": "2024-01-01T12:00:00.000Z",
        "created_at": "2024-01-01T12:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/messages/123456789?limit=10
```

### 3. Bot Status
Check the status of the Telegram bot.

**Endpoint:** `GET /bot-status`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "bot": {
      "id": 123456789,
      "username": "your_bot",
      "firstName": "Your Bot",
      "canJoinGroups": true,
      "canReadAllGroupMessages": false,
      "supportsInlineQueries": false
    }
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/bot-status
```

### 4. Health Check
Check if the service is running.

**Endpoint:** `GET /health`

**Response (Success - 200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "Telegram Integration Service"
}
```

**Example:**
```bash
curl http://localhost:3000/api/health
```

### 5. Test Message (Development Only)
Send a test message (only available in development mode).

**Endpoint:** `POST /test-message`

**Request Body:**
```json
{
  "chatId": "123456789" // Optional if TEST_CHAT_ID is set in .env
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 403 | Forbidden - Bot blocked by user |
| 404 | Not Found - Chat ID not found or user hasn't started the bot |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database connection failed |

## Message Formatting

The service supports HTML formatting in messages:

- **Bold**: `<b>text</b>`
- **Italic**: `<i>text</i>`
- **Code**: `<code>text</code>`
- **Pre-formatted**: `<pre>text</pre>`
- **Links**: `<a href="URL">text</a>`

**Example with formatting:**
```json
{
  "message": "<b>Alert!</b> Your order <code>ORD-123</code> has been <i>shipped</i>.",
  "receiver": "123456789"
}
```

## Getting Started

1. **Get a Telegram Bot Token:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot with `/newbot`
   - Copy the bot token

2. **Get User Chat IDs:**
   - Users must start a conversation with your bot first
   - Send `/start` to the bot
   - The chat ID will be displayed and logged

3. **Test Your Integration:**
   ```bash
   # Health check
   curl http://localhost:3000/api/health
   
   # Send test message
   curl -X POST http://localhost:3000/api/send-message \
     -H "Content-Type: application/json" \
     -d '{"message": "Test message", "receiver": "YOUR_CHAT_ID"}'
   ```

## Integration Examples

### Node.js/Express Application
```javascript
const axios = require('axios');

async function sendNotification(message, userId) {
  try {
    const response = await axios.post('http://localhost:3000/api/send-message', {
      message,
      receiver: userId
    });
    console.log('Notification sent:', response.data);
  } catch (error) {
    console.error('Failed to send notification:', error.response?.data);
  }
}
```

### Python Application
```python
import requests

def send_notification(message, user_id):
    try:
        response = requests.post('http://localhost:3000/api/send-message', 
                               json={'message': message, 'receiver': user_id})
        response.raise_for_status()
        print('Notification sent:', response.json())
    except requests.exceptions.RequestException as e:
        print('Failed to send notification:', e)
```

### PHP Application
```php
<?php
function sendNotification($message, $userId) {
    $data = json_encode(['message' => $message, 'receiver' => $userId]);
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => $data
        ]
    ]);
    
    $result = file_get_contents('http://localhost:3000/api/send-message', false, $context);
    return json_decode($result, true);
}
?>
```
