const express = require('express');
const Joi = require('joi');
const DiscordService = require('../services/DiscordService');

const router = express.Router();

// Validation schema for Discord message
const discordMessageSchema = Joi.object({
  receiver: Joi.string().required().messages({
    'any.required': 'Receiver (Discord user ID) is required',
    'string.empty': 'Receiver cannot be empty'
  }),
  message: Joi.string().required().max(2000).messages({
    'any.required': 'Message is required',
    'string.empty': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 2000 characters (Discord limit)'
  })
});

/**
 * POST /api/discord/send-message
 * Send message to Discord user
 */
router.post('/send-message', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = discordMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message,
        timestamp: new Date().toISOString()
      });
    }

    const { receiver, message } = value;

    // Send message via Discord service
    const result = await DiscordService.sendMessage(receiver, message);

    res.json({
      success: true,
      message: 'Discord message sent successfully',
      data: {
        userId: result.userId,
        messageId: result.messageId,
        timestamp: result.timestamp,
        demo: result.demo || false
      }
    });

  } catch (error) {
    console.error('❌ Error sending Discord message:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/discord/bot-status
 * Get Discord bot connection status
 */
router.get('/bot-status', (req, res) => {
  try {
    const status = DiscordService.getBotStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Error getting Discord bot status:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get bot status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/discord/messages/:userId
 * Get message history for a Discord user
 */
router.get('/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const messages = await DiscordService.getMessageHistory(userId, limit);

    res.json({
      success: true,
      data: {
        userId: userId,
        messages: messages,
        count: messages.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting Discord message history:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get message history',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
