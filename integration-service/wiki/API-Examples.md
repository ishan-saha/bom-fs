# API Examples

Complete code examples for all Integration Service APIs.

## Table of Contents

- [Telegram Examples](#telegram-examples)
- [Discord Examples](#discord-examples)
- [Email Examples](#email-examples)
- [VCS Key Examples](#vcs-key-examples)
- [Error Handling](#error-handling)

---

## Telegram Examples

### Example 1: Send Simple Message

**JavaScript/Node.js:**
```javascript
const axios = require('axios');

async function sendSimpleMessage() {
  try {
    const response = await axios.post('http://localhost:3000/api/send-message', {
      message: "Hello! This is a test message from the integration service.",
      receiver: "123456789" // Replace with actual chat ID
    });
    
    console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
  }
}

sendSimpleMessage();
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! This is a test message.",
    "receiver": "123456789"
  }'
```

**Python:**
```python
import requests

def send_simple_message():
    response = requests.post(
        'http://localhost:3000/api/send-message',
        json={
            "message": "Hello! This is a test message from the integration service.",
            "receiver": "123456789"
        }
    )
    
    if response.status_code == 200:
        print("Message sent successfully:", response.json())
    else:
        print("Error:", response.json())

send_simple_message()
```

---

### Example 2: Send Formatted Message with HTML

**JavaScript/Node.js:**
```javascript
async function sendFormattedMessage() {
  const message = `
<b>📋 Order Update</b>

Order ID: <code>ORD-12345</code>
Status: <b>Shipped</b>
Tracking: <code>1Z999AA1234567890</code>

Expected delivery: <i>Tomorrow</i>

Thank you for your order! 🎉
  `.trim();
  
  try {
    const response = await axios.post('http://localhost:3000/api/send-message', {
      message: message,
      receiver: "123456789"
    });
    
    console.log('Formatted message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

**Python:**
```python
def send_formatted_message():
    message = """
<b>📋 Order Update</b>

Order ID: <code>ORD-12345</code>
Status: <b>Shipped</b>
Tracking: <code>1Z999AA1234567890</code>

Expected delivery: <i>Tomorrow</i>

Thank you for your order! 🎉
    """.strip()
    
    response = requests.post(
        'http://localhost:3000/api/send-message',
        json={"message": message, "receiver": "123456789"}
    )
    
    print(response.json())
```

---

### Example 3: Send Multiple Messages

**JavaScript/Node.js:**
```javascript
async function sendMultipleMessages() {
  const messages = [
    {
      message: "🚨 System Alert: Server maintenance scheduled for tonight at 2 AM EST",
      receiver: "123456789"
    },
    {
      message: "📊 Your monthly report is ready for review.",
      receiver: "987654321"
    },
    {
      message: "🎂 Happy Birthday! Here's a special discount code: BDAY2024",
      receiver: "456789123"
    }
  ];
  
  for (const msg of messages) {
    try {
      const response = await axios.post('http://localhost:3000/api/send-message', msg);
      console.log(`Message sent to ${msg.receiver}:`, response.data);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to send to ${msg.receiver}:`, error.response?.data);
    }
  }
}
```

**Python:**
```python
import time

def send_multiple_messages():
    messages = [
        {
            "message": "🚨 System Alert: Server maintenance tonight at 2 AM EST",
            "receiver": "123456789"
        },
        {
            "message": "📊 Your monthly report is ready for review.",
            "receiver": "987654321"
        },
        {
            "message": "🎂 Happy Birthday! Discount code: BDAY2024",
            "receiver": "456789123"
        }
    ]
    
    for msg in messages:
        try:
            response = requests.post('http://localhost:3000/api/send-message', json=msg)
            print(f"Message sent to {msg['receiver']}: {response.json()}")
            time.sleep(0.1)  # Avoid rate limiting
        except Exception as e:
            print(f"Failed to send to {msg['receiver']}: {e}")
```

---

### Example 4: Get Message History

**JavaScript/Node.js:**
```javascript
async function getMessageHistory(chatId, limit = 10) {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/messages/${chatId}?limit=${limit}`
    );
    
    console.log(`Message history for ${chatId}:`, response.data);
    
    // Process messages
    response.data.data.messages.forEach(msg => {
      console.log(`[${msg.sent_at}] ${msg.message}`);
    });
  } catch (error) {
    console.error('Error getting history:', error.response?.data);
  }
}

getMessageHistory('123456789', 10);
```

**Python:**
```python
def get_message_history(chat_id, limit=10):
    response = requests.get(
        f'http://localhost:3000/api/messages/{chat_id}',
        params={'limit': limit}
    )
    
    data = response.json()
    print(f"Found {data['data']['count']} messages")
    
    for msg in data['data']['messages']:
        print(f"[{msg['sent_at']}] {msg['message']}")

get_message_history('123456789', 10)
```

---

### Example 5: Check Bot Status

**JavaScript/Node.js:**
```javascript
async function checkBotStatus() {
  try {
    const response = await axios.get('http://localhost:3000/api/bot-status');
    
    const { connected, bot } = response.data.data;
    
    if (connected) {
      console.log('Bot is online!');
      console.log(`Username: @${bot.username}`);
      console.log(`Name: ${bot.firstName}`);
    } else {
      console.log('Bot is offline');
    }
  } catch (error) {
    console.error('Error checking status:', error.message);
  }
}
```

**Python:**
```python
def check_bot_status():
    response = requests.get('http://localhost:3000/api/bot-status')
    data = response.json()
    
    if data['data']['connected']:
        bot = data['data']['bot']
        print(f"Bot is online!")
        print(f"Username: @{bot['username']}")
        print(f"Name: {bot['firstName']}")
    else:
        print("Bot is offline")
```

---

## Discord Examples

### Example 1: Send Discord Message

**JSON Request:**
```json
{
  "receiver": "123456789012345678",
  "message": "Hello! This is an example Discord message from the integration service. 🎮\n\nFeatures:\n- Direct message sending\n- Message history tracking\n- Database logging\n- Real-time delivery"
}
```

**JavaScript/Node.js:**
```javascript
async function sendDiscordMessage() {
  try {
    const response = await axios.post('http://localhost:3000/api/discord/send-message', {
      receiver: "123456789012345678",
      message: "Hello! This is a Discord message. 🎮"
    });
    
    console.log('Discord message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}
```

**Python:**
```python
def send_discord_message():
    response = requests.post(
        'http://localhost:3000/api/discord/send-message',
        json={
            "receiver": "123456789012345678",
            "message": "Hello! This is a Discord message. 🎮"
        }
    )
    print(response.json())
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/discord/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "123456789012345678",
    "message": "Hello from Discord API!"
  }'
```

---

### Example 2: Get Discord Message History

**JavaScript/Node.js:**
```javascript
async function getDiscordHistory(userId, limit = 50) {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/discord/messages/${userId}`,
      { params: { limit } }
    );
    
    console.log('Discord message history:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}
```

**Python:**
```python
def get_discord_history(user_id, limit=50):
    response = requests.get(
        f'http://localhost:3000/api/discord/messages/{user_id}',
        params={'limit': limit}
    )
    return response.json()
```

---

## Email Examples

### Example 1: Create Sender Profile

**JavaScript/Node.js:**
```javascript
async function createSenderProfile() {
  try {
    const response = await axios.post('http://localhost:3000/api/email/sender-profiles', {
      email: "sender@gmail.com",
      password: "app_password_here",
      sender_name: "John Doe",
      organization: "Acme Corp",
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      smtp_secure: false
    });
    
    console.log('Sender profile created:', response.data);
    return response.data.data.id;
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}
```

**Python:**
```python
def create_sender_profile():
    response = requests.post(
        'http://localhost:3000/api/email/sender-profiles',
        json={
            "email": "sender@gmail.com",
            "password": "app_password_here",
            "sender_name": "John Doe",
            "organization": "Acme Corp",
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_secure": False
        }
    )
    return response.json()
```

---

### Example 2: Create Recipient Profile

**JavaScript/Node.js:**
```javascript
async function createRecipientProfile() {
  try {
    const response = await axios.post('http://localhost:3000/api/email/recipient-profiles', {
      email: "recipient@example.com",
      name: "Jane Smith",
      category: "customer",
      notes: "VIP customer - priority support"
    });
    
    console.log('Recipient profile created:', response.data);
    return response.data.data.id;
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}
```

**Python:**
```python
def create_recipient_profile():
    response = requests.post(
        'http://localhost:3000/api/email/recipient-profiles',
        json={
            "email": "recipient@example.com",
            "name": "Jane Smith",
            "category": "customer",
            "notes": "VIP customer - priority support"
        }
    )
    return response.json()
```

---

### Example 3: Send Email

**JavaScript/Node.js:**
```javascript
async function sendEmail(senderProfileId, recipientProfileId) {
  try {
    const response = await axios.post('http://localhost:3000/api/email/send', {
      sender_profile_id: senderProfileId,
      recipient_profile_id: recipientProfileId,
      subject: "Welcome to Our Service!",
      body: "Thank you for signing up. We're excited to have you on board!"
    });
    
    console.log('Email sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}
```

**Python:**
```python
def send_email(sender_profile_id, recipient_profile_id):
    response = requests.post(
        'http://localhost:3000/api/email/send',
        json={
            "sender_profile_id": sender_profile_id,
            "recipient_profile_id": recipient_profile_id,
            "subject": "Welcome to Our Service!",
            "body": "Thank you for signing up. We're excited to have you on board!"
        }
    )
    return response.json()
```

---

### Example 4: Complete Email Workflow

**JavaScript/Node.js:**
```javascript
async function completeEmailWorkflow() {
  // Create sender profile
  const sender = await axios.post('http://localhost:3000/api/email/sender-profiles', {
    email: "sender@gmail.com",
    password: "app_password",
    sender_name: "Support Team",
    smtp_host: "smtp.gmail.com",
    smtp_port: 587
  });
  
  const senderId = sender.data.data.id;
  
  // Create recipient profile
  const recipient = await axios.post('http://localhost:3000/api/email/recipient-profiles', {
    email: "customer@example.com",
    name: "Customer Name"
  });
  
  const recipientId = recipient.data.data.id;
  
  // Send email
  const email = await axios.post('http://localhost:3000/api/email/send', {
    sender_profile_id: senderId,
    recipient_profile_id: recipientId,
    subject: "Order Confirmation",
    body: "Your order has been confirmed and will ship soon."
  });
  
  console.log('Email workflow completed:', email.data);
}
```

---

## VCS Key Examples

### Example 1: Generate and Activate Key

**Bash Script:**
```bash
#!/bin/bash

# Generate new SSH key
echo "Generating SSH key..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/vcs/generate)
FINGERPRINT=$(echo $RESPONSE | jq -r '.data.fingerprint')
PUBLIC_KEY=$(echo $RESPONSE | jq -r '.data.public_key')

echo "Generated key:"
echo "Fingerprint: $FINGERPRINT"
echo "Public key: $PUBLIC_KEY"

echo ""
echo "Add this public key to GitHub, then press Enter to continue..."
read

# Activate key
echo "Activating key..."
curl -X POST http://localhost:3000/api/vcs/activate \
  -H "Content-Type: application/json" \
  -d "{\"fingerprint\": \"$FINGERPRINT\"}"

# Test connection
echo ""
echo "Testing connection..."
curl -X POST http://localhost:3000/api/vcs/test-connection

echo ""
echo "Done!"
```

**Python:**
```python
import requests
import json

def setup_vcs_key():
    # Generate key
    response = requests.post('http://localhost:3000/api/vcs/generate')
    data = response.json()
    
    fingerprint = data['data']['fingerprint']
    public_key = data['data']['public_key']
    
    print(f"Generated key: {fingerprint}")
    print(f"Public key: {public_key}")
    print("\nAdd this public key to GitHub, then press Enter...")
    input()
    
    # Activate key
    activate = requests.post(
        'http://localhost:3000/api/vcs/activate',
        json={'fingerprint': fingerprint}
    )
    print("Activation:", activate.json())
    
    # Test connection
    test = requests.post('http://localhost:3000/api/vcs/test-connection')
    print("Connection test:", test.json())

setup_vcs_key()
```

---

### Example 2: Monitor VCS Keys

**JavaScript/Node.js:**
```javascript
async function monitorVCSKeys() {
  // Get active key
  const active = await axios.get('http://localhost:3000/api/vcs/active');
  console.log('Active key:', active.data);
  
  // Check if rotation is due
  const rotation = await axios.post('http://localhost:3000/api/vcs/rotate-if-due');
  console.log('Rotation check:', rotation.data);
  
  // Force watchdog check
  const watchdog = await axios.post('http://localhost:3000/api/vcs/watchdog-check');
  console.log('Watchdog check:', watchdog.data);
  
  // Get metrics
  const metrics = await axios.get('http://localhost:3000/api/vcs/metrics');
  console.log('Metrics:\n', metrics.data);
}
```

**Python:**
```python
def monitor_vcs_keys():
    # Get active key
    active = requests.get('http://localhost:3000/api/vcs/active')
    print("Active key:", active.json())
    
    # Check rotation
    rotation = requests.post('http://localhost:3000/api/vcs/rotate-if-due')
    print("Rotation check:", rotation.json())
    
    # Watchdog check
    watchdog = requests.post('http://localhost:3000/api/vcs/watchdog-check')
    print("Watchdog check:", watchdog.json())
    
    # Get metrics
    metrics = requests.get('http://localhost:3000/api/vcs/metrics')
    print("Metrics:\n", metrics.text)
```

---

## Error Handling

### Example 1: Handle Validation Errors

**JavaScript/Node.js:**
```javascript
async function handleValidationErrors() {
  try {
    // Invalid receiver format
    await axios.post('http://localhost:3000/api/send-message', {
      message: "Test message",
      receiver: "invalid_id" // Will fail - not numeric
    });
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('Validation error:', error.response.data);
    }
  }
  
  try {
    // Missing required field
    await axios.post('http://localhost:3000/api/send-message', {
      receiver: "123456789"
      // Missing message field
    });
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('Missing field error:', error.response.data);
    }
  }
}
```

---

### Example 2: Retry Logic

**JavaScript/Node.js:**
```javascript
async function sendWithRetry(message, receiver, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post('http://localhost:3000/api/send-message', {
        message,
        receiver
      });
      
      console.log('Message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

**Python:**
```python
import time

def send_with_retry(message, receiver, max_retries=3):
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(
                'http://localhost:3000/api/send-message',
                json={"message": message, "receiver": receiver}
            )
            response.raise_for_status()
            print("Message sent successfully:", response.json())
            return response.json()
        except Exception as e:
            print(f"Attempt {attempt} failed: {e}")
            
            if attempt == max_retries:
                raise
            
            # Exponential backoff
            time.sleep(attempt)
```

---

## Complete Integration Example

**JavaScript/Node.js:**
```javascript
const axios = require('axios');

class IntegrationServiceClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }
  
  // Telegram methods
  async sendTelegramMessage(chatId, message) {
    const response = await axios.post(`${this.baseUrl}/api/send-message`, {
      message, receiver: chatId
    });
    return response.data;
  }
  
  // Discord methods
  async sendDiscordMessage(userId, message) {
    const response = await axios.post(`${this.baseUrl}/api/discord/send-message`, {
      message, receiver: userId
    });
    return response.data;
  }
  
  // Email methods
  async sendEmail(senderProfileId, recipientProfileId, subject, body) {
    const response = await axios.post(`${this.baseUrl}/api/email/send`, {
      sender_profile_id: senderProfileId,
      recipient_profile_id: recipientProfileId,
      subject, body
    });
    return response.data;
  }
  
  // VCS methods
  async generateVCSKey() {
    const response = await axios.post(`${this.baseUrl}/api/vcs/generate`);
    return response.data;
  }
  
  async activateVCSKey(fingerprint) {
    const response = await axios.post(`${this.baseUrl}/api/vcs/activate`, {
      fingerprint
    });
    return response.data;
  }
}

// Usage
const client = new IntegrationServiceClient();

async function demo() {
  // Send Telegram message
  await client.sendTelegramMessage('123456789', 'Hello from client!');
  
  // Send Discord message
  await client.sendDiscordMessage('123456789012345678', 'Hello Discord!');
  
  // Generate VCS key
  const key = await client.generateVCSKey();
  console.log('Generated key:', key.data.fingerprint);
}

demo();
```

---

## Related Pages

- [Telegram API](Telegram-API)
- [Discord API](Discord-API)
- [Email API](Email-API)
- [VCS Key Management API](VCS-Key-Management-API)
- [Troubleshooting](Troubleshooting)
