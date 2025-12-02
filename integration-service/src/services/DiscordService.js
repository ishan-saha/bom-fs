const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { query } = require('../config/database');

class DiscordService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.isDemoMode = false;
  }

  /**
   * Initialize Discord bot
   */
  async initializeBot() {
    try {
      const token = process.env.DISCORD_BOT_TOKEN;
      
      if (!token || token === 'your_discord_bot_token_here') {
        console.log('⚠️  Discord bot token not configured - running in demo mode');
        this.isDemoMode = true;
        this.isInitialized = true;
        return true;
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.MessageContent
        ]
      });

      await this.setupBotHandlers();
      await this.client.login(token);
      
      this.isInitialized = true;
      console.log('✅ Discord bot initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Discord bot initialization failed:', error.message);
      console.log('⚠️  Running in demo mode without Discord connectivity');
      this.isDemoMode = true;
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Set up Discord bot event handlers
   */
  async setupBotHandlers() {
    this.client.once('ready', () => {
      console.log(`🤖 Discord bot logged in as: ${this.client.user.tag}`);
    });

    this.client.on('messageCreate', async (message) => {
      // Ignore bot messages
      if (message.author.bot) return;

      // Log received message
      console.log(`📩 Received Discord message from ${message.author.username}: ${message.content}`);

      // Register user if it's a DM
      if (message.channel.type === 1) { // DM channel
        await this.registerUser(message.author.id, message.author.username, message.author);
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ Discord client error:', error);
    });
  }

  /**
   * Send message to Discord user or channel
   * @param {string} targetId - Discord user ID or channel ID
   * @param {string} message - Message to send
   * @returns {Object} Result object
   */
  async sendMessage(targetId, message) {
    try {
      if (this.isDemoMode) {
        console.log(`📨 [DEMO] Would send Discord message to ${targetId}: ${message.substring(0, 50)}...`);
        
        // Register user first for demo mode (only if it looks like a user ID)
        await this.registerUser(targetId, 'Demo User');
        
        // Log to database in demo mode
        await this.logMessage(targetId, message, 'sent', null, null, new Date());
        
        return {
          success: true,
          messageId: `demo_${Date.now()}`,
          userId: targetId,
          message: message,
          timestamp: new Date().toISOString(),
          demo: true
        };
      }

      if (!this.client || !this.isInitialized) {
        throw new Error('Discord bot not initialized');
      }

      console.log(`📨 Incoming Discord message request for ID: ${targetId}`);

      // Try to fetch as channel first, then as user
      let target;
      let isChannel = false;
      
      try {
        // Try to get as channel
        target = await this.client.channels.fetch(targetId);
        if (target) {
          isChannel = true;
          console.log(`📍 Target is a channel: ${target.name || 'Unknown'} in guild: ${target.guild?.name || 'Unknown'}`);
        }
      } catch (channelError) {
        console.log(`❌ Not a channel, trying as user...`);
        try {
          // If channel fetch fails, try as user
          target = await this.client.users.fetch(targetId);
          console.log(`👤 Target is a user: ${target.username || 'Unknown'}`);
          
          // Register user in database (only for actual users)
          await this.registerUser(targetId, target.username, target);
        } catch (userError) {
          throw new Error(`Target with ID ${targetId} not found as channel or user`);
        }
      }

      if (!target) {
        throw new Error(`Target with ID ${targetId} not found`);
      }

      // Send the message
      const sentMessage = await target.send(message);

      // Log successful message (use targetId for both users and channels)
      await this.logMessage(targetId, message, 'sent', sentMessage.id, null, new Date());

      console.log(`✅ Discord message sent to ${isChannel ? 'channel' : 'user'} ${targetId}: ${message.substring(0, 50)}...`);

      return {
        success: true,
        messageId: sentMessage.id,
        userId: targetId,
        message: message,
        timestamp: new Date().toISOString(),
        targetType: isChannel ? 'channel' : 'user'
      };

    } catch (error) {
      console.error(`❌ Failed to send Discord message to ${targetId}:`, error.message);
      
      // Log failed message
      await this.logMessage(targetId, message, 'failed', null, error.message, null);
      
      throw error;
    }
  }

  /**
   * Register or update user in database
   * @param {string} userId - Discord user ID
   * @param {string} username - Discord username
   * @param {Object} userObj - Discord user object
   */
  async registerUser(userId, username = null, userObj = null) {
    try {
      // Skip registration if this looks like a channel ID or if no username provided
      if (!username && !userObj) {
        console.log(`⚠️  Skipping user registration for ${userId} - no user data available`);
        return;
      }

      const queryText = `
        INSERT INTO discord_users (user_id, username, discriminator, avatar, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          username = EXCLUDED.username,
          discriminator = EXCLUDED.discriminator,
          avatar = EXCLUDED.avatar,
          updated_at = CURRENT_TIMESTAMP,
          is_active = true
        RETURNING *
      `;

      const values = [
        userId,
        username || userObj?.username || 'Unknown',
        userObj?.discriminator || '0000',
        userObj?.avatar || null
      ];

      const result = await query(queryText, values);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(`👤 Discord user registered/updated: ${user.username} (${userId})`);
      }

    } catch (error) {
      console.error('❌ Error registering Discord user:', error);
    }
  }

  /**
   * Log message to database
   * @param {string} userId - Discord user ID
   * @param {string} messageText - Message content
   * @param {string} status - Message status
   * @param {string} discordMessageId - Discord message ID
   * @param {string} errorMessage - Error message if failed
   * @param {Date} sentAt - When message was sent
   */
  async logMessage(userId, messageText, status, discordMessageId, errorMessage, sentAt) {
    try {
      const queryText = `
        INSERT INTO discord_messages (user_id, message_text, status, discord_message_id, error_message, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const values = [userId, messageText, status, discordMessageId, errorMessage, sentAt];
      await query(queryText, values);

    } catch (error) {
      console.error('❌ Error logging Discord message:', error);
    }
  }

  /**
   * Get message history for a user
   * @param {string} userId - Discord user ID
   * @param {number} limit - Number of messages to retrieve
   * @returns {Array} Message history
   */
  async getMessageHistory(userId, limit = 50) {
    try {
      const queryText = `
        SELECT * FROM discord_messages 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;

      const result = await query(queryText, [userId, limit]);
      return result.rows;

    } catch (error) {
      console.error('❌ Error getting Discord message history:', error);
      return [];
    }
  }

  /**
   * Get bot connection status
   * @returns {Object} Bot status
   */
  getBotStatus() {
    if (this.isDemoMode) {
      return {
        connected: true,
        demo: true,
        bot: {
          username: 'Demo Bot',
          id: 'demo_mode'
        }
      };
    }

    if (!this.client || !this.isInitialized) {
      return {
        connected: false,
        error: 'Bot not initialized'
      };
    }

    return {
      connected: this.client.isReady(),
      bot: {
        username: this.client.user?.username || 'Unknown',
        id: this.client.user?.id || 'Unknown',
        discriminator: this.client.user?.discriminator || '0000'
      }
    };
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      console.log('🔌 Discord bot disconnected');
    }
  }
}

module.exports = new DiscordService();
