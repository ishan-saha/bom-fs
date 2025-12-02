const express = require('express');
const Joi = require('joi');
const telegramService = require('../services/telegramService');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation schema for send-message endpoint
const sendMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(4096),
  receiver: Joi.string().required().pattern(/^[0-9]+$/).messages({
    'string.pattern.base': 'Receiver must be a valid Telegram chat ID (numbers only)'
  })
});

// Send message endpoint
router.post('/send-message', validateRequest(sendMessageSchema), async (req, res) => {
  try {
    const { message, receiver } = req.body;
    
    console.log(`📨 Incoming message request for chat ID: ${receiver}`);
    
    // Send message via Telegram
    const result = await telegramService.sendMessage(receiver, message);
    
    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        chatId: result.chatId,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('chat not found') || error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = 'Chat ID not found or user has not started the bot';
    } else if (error.message.includes('blocked') || error.message.includes('forbidden')) {
      statusCode = 403;
      errorMessage = 'Bot was blocked by the user';
    } else if (error.message.includes('Bad Request')) {
      statusCode = 400;
      errorMessage = 'Invalid message format or content';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Get message history endpoint
router.get('/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    // Validate chat ID format
    if (!/^[0-9]+$/.test(chatId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chat ID format'
      });
    }
    
    const messages = await telegramService.getMessageHistory(chatId, limit);
    
    res.status(200).json({
      success: true,
      data: {
        chatId,
        messages,
        count: messages.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching message history:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message history'
    });
  }
});

// Get bot status endpoint
router.get('/bot-status', async (req, res) => {
  try {
    const isConnected = telegramService.isConnected();
    let botInfo = null;
    
    if (isConnected) {
      botInfo = await telegramService.getBotInfo();
    }
    
    res.status(200).json({
      success: true,
      data: {
        connected: isConnected,
        bot: botInfo ? {
          id: botInfo.id,
          username: botInfo.username,
          firstName: botInfo.first_name,
          canJoinGroups: botInfo.can_join_groups,
          canReadAllGroupMessages: botInfo.can_read_all_group_messages,
          supportsInlineQueries: botInfo.supports_inline_queries
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting bot status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get bot status'
    });
  }
});

// Test endpoint for development
router.post('/test-message', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Endpoint not available in production' });
  }
  
  try {
    const testMessage = "🧪 This is a test message from the Telegram Integration Service!";
    const testChatId = req.body.chatId || process.env.TEST_CHAT_ID;
    
    if (!testChatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID required for testing. Provide chatId in request body or set TEST_CHAT_ID in environment.'
      });
    }
    
    const result = await telegramService.sendMessage(testChatId, testMessage);
    
    res.status(200).json({
      success: true,
      message: 'Test message sent successfully',
      data: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send test message',
      details: error.message
    });
  }
});

module.exports = router;
