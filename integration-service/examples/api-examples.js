const axios = require('axios');

// Example 1: Send a simple message
async function sendSimpleMessage() {
  try {
    const response = await axios.post('http://localhost:3000/api/send-message', {
      message: "Hello! This is a test message from the integration service.",
      receiver: "123456789" // Replace with actual chat ID
    });
    
    console.log('✅ Message sent successfully:', response.data);
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
  }
}

// Example 2: Send a formatted message with HTML
async function sendFormattedMessage() {
  try {
    const message = `
<b>📋 Order Update</b>

Order ID: <code>ORD-12345</code>
Status: <b>Shipped</b>
Tracking: <code>1Z999AA1234567890</code>

Expected delivery: <i>Tomorrow</i>

Thank you for your order! 🎉
    `.trim();
    
    const response = await axios.post('http://localhost:3000/api/send-message', {
      message: message,
      receiver: "123456789" // Replace with actual chat ID
    });
    
    console.log('✅ Formatted message sent:', response.data);
  } catch (error) {
    console.error('❌ Error sending formatted message:', error.response?.data || error.message);
  }
}

// Example 3: Send multiple messages to different users
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
      console.log(`✅ Message sent to ${msg.receiver}:`, response.data);
      
      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed to send message to ${msg.receiver}:`, error.response?.data || error.message);
    }
  }
}

// Example 4: Check bot status
async function checkBotStatus() {
  try {
    const response = await axios.get('http://localhost:3000/api/bot-status');
    console.log('🤖 Bot status:', response.data);
  } catch (error) {
    console.error('❌ Error checking bot status:', error.response?.data || error.message);
  }
}

// Example 5: Get message history for a user
async function getMessageHistory(chatId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/messages/${chatId}?limit=10`);
    console.log(`📜 Message history for ${chatId}:`, response.data);
  } catch (error) {
    console.error('❌ Error getting message history:', error.response?.data || error.message);
  }
}

// Example 6: Error handling example
async function handleErrors() {
  // Invalid receiver format
  try {
    await axios.post('http://localhost:3000/api/send-message', {
      message: "Test message",
      receiver: "invalid_id" // This will fail validation
    });
  } catch (error) {
    console.log('Expected validation error:', error.response.data);
  }
  
  // Missing message
  try {
    await axios.post('http://localhost:3000/api/send-message', {
      receiver: "123456789"
      // Missing message field
    });
  } catch (error) {
    console.log('Expected validation error:', error.response.data);
  }
}

// Run examples
async function runExamples() {
  console.log('🚀 Running API examples...\n');
  
  console.log('1. Checking bot status...');
  await checkBotStatus();
  
  console.log('\n2. Sending simple message...');
  await sendSimpleMessage();
  
  console.log('\n3. Sending formatted message...');
  await sendFormattedMessage();
  
  console.log('\n4. Demonstrating error handling...');
  await handleErrors();
  
  console.log('\n5. Getting message history...');
  await getMessageHistory('123456789');
  
  console.log('\n✅ Examples completed!');
}

// Uncomment to run examples
// runExamples();

module.exports = {
  sendSimpleMessage,
  sendFormattedMessage,
  sendMultipleMessages,
  checkBotStatus,
  getMessageHistory,
  handleErrors
};
