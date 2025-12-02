const TelegramBot = require('node-telegram-bot-api');
const { query } = require('../config/database');

class TelegramService {
  constructor() {
    this.bot = null;
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.demoMode = !this.token || this.token === 'your_bot_token_here';
    
    if (this.demoMode) {
      console.log('⚠️  Telegram service running in demo mode');
    }
  }

  // Initialize the Telegram bot
  async initializeBot() {
    try {
      if (!this.token || this.token === 'your_bot_token_here') {
        throw new Error('TELEGRAM_BOT_TOKEN is not properly configured');
      }
      
      this.bot = new TelegramBot(this.token, { polling: true });
      
      // Set up bot commands and event listeners
      this.setupBotHandlers();
      
      // Get bot info
      const botInfo = await this.bot.getMe();
      console.log(`🤖 Telegram bot initialized: @${botInfo.username}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error.message);
      throw error;
    }
  }

  // Set up bot event handlers
  setupBotHandlers() {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const user = msg.from;
      
      try {
        // Save user to database
        await this.saveUser(chatId, user);
        
        const welcomeMessage = `
🎉 Welcome to the Telegram Integration Service!

Your Chat ID is: \`${chatId}\`

You can now receive messages from external applications through this bot.

Commands:
/start - Show this welcome message
/help - Get help information
/status - Check your status
        `;
        
        await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        console.log(`👤 New user registered: ${user.username || user.first_name} (${chatId})`);
      } catch (error) {
        console.error('❌ Error handling /start command:', error);
        await this.bot.sendMessage(chatId, '❌ Sorry, there was an error processing your request.');
      }
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
🆘 **Help Information**

This bot receives messages from external applications and forwards them to you.

**How it works:**
1. External applications send JSON data to our service
2. The service processes the data and sends messages to you
3. You receive messages instantly

**Commands:**
/start - Register and get your Chat ID
/help - Show this help message
/status - Check your registration status

**Need support?** Contact your system administrator.
      `;
      
      await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Handle /status command
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const userExists = await this.getUserByChatId(chatId);
        if (userExists) {
          const statusMessage = `
✅ **Status: Active**

Chat ID: \`${chatId}\`
Username: ${msg.from.username || 'Not set'}
Name: ${msg.from.first_name} ${msg.from.last_name || ''}
Registered: ${userExists.created_at}

You are ready to receive messages!
          `;
          await this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
        } else {
          await this.bot.sendMessage(chatId, '❌ You are not registered. Please send /start to register.');
        }
      } catch (error) {
        console.error('❌ Error checking status:', error);
        await this.bot.sendMessage(chatId, '❌ Error checking your status.');
      }
    });

    // Handle errors
    this.bot.on('polling_error', (error) => {
      console.error('❌ Telegram polling error:', error);
    });

    // Handle any text message (for logging)
    this.bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      
      console.log(`📩 Received message from ${msg.from.username || msg.from.first_name}: ${msg.text}`);
    });
  }

  // Save user to database
  async saveUser(chatId, user) {
    const queryText = `
      INSERT INTO users (chat_id, username, first_name, last_name, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (chat_id) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = CURRENT_TIMESTAMP,
        is_active = true
      RETURNING *
    `;
    
    const values = [
      chatId.toString(),
      user.username || null,
      user.first_name || null,
      user.last_name || null
    ];
    
    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Get user by chat ID
  async getUserByChatId(chatId) {
    const queryText = 'SELECT * FROM users WHERE chat_id = $1 AND is_active = true';
    const result = await query(queryText, [chatId.toString()]);
    return result.rows[0] || null;
  }

  // Send message to specific chat
  async sendMessage(chatId, message) {
    if (this.demoMode) {
      console.log(`🧪 DEMO MODE: Would send message to ${chatId}: ${message}`);
      return {
        success: true,
        messageId: Math.floor(Math.random() * 1000),
        chatId: chatId,
        demo: true
      };
    }
    
    try {
      // Check if user exists and is active
      const user = await this.getUserByChatId(chatId);
      if (!user) {
        throw new Error(`User with chat ID ${chatId} not found or inactive`);
      }

      // Send message
      const sentMessage = await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      // Log message to database
      await this.logMessage(chatId, message, 'sent', sentMessage.message_id);
      
      console.log(`✅ Message sent to ${chatId}: ${message.substring(0, 50)}...`);
      
      return {
        success: true,
        messageId: sentMessage.message_id,
        chatId: chatId
      };
    } catch (error) {
      console.error(`❌ Failed to send message to ${chatId}:`, error.message);
      
      // Log failed message to database
      await this.logMessage(chatId, message, 'failed', null, error.message);
      
      throw error;
    }
  }

  // Log message to database
  async logMessage(chatId, messageText, status, telegramMessageId = null, errorMessage = null) {
    const queryText = `
      INSERT INTO messages (chat_id, message_text, status, telegram_message_id, error_message, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const values = [
      chatId.toString(),
      messageText,
      status,
      telegramMessageId,
      errorMessage,
      status === 'sent' ? new Date() : null
    ];
    
    try {
      const result = await query(queryText, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('❌ Error logging message:', error);
    }
  }

  // Get message history for a chat
  async getMessageHistory(chatId, limit = 50) {
    const queryText = `
      SELECT * FROM messages 
      WHERE chat_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await query(queryText, [chatId.toString(), limit]);
    return result.rows;
  }

  // Check if bot is connected
  isConnected() {
    return this.bot !== null;
  }

  // Get bot info
  async getBotInfo() {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }
    return await this.bot.getMe();
  }
}

// Create singleton instance
const telegramService = new TelegramService();

module.exports = telegramService;
