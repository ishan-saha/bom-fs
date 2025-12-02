require('dotenv').config();
const { query } = require('../src/config/database');

async function addDiscordTables() {
  try {
    console.log('🔄 Adding Discord tables to existing database...');

    // Create Discord users table
    await query(`
      CREATE TABLE IF NOT EXISTS discord_users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255),
        discriminator VARCHAR(10),
        avatar VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Discord users table created/verified');

    // Create Discord messages table
    await query(`
      CREATE TABLE IF NOT EXISTS discord_messages (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        message_text TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        discord_message_id VARCHAR(255),
        error_message TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES discord_users(user_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Discord messages table created/verified');

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_discord_messages_user_id ON discord_messages(user_id)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_discord_messages_status ON discord_messages(status)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_discord_users_user_id ON discord_users(user_id)
    `);

    console.log('✅ Discord database indexes created');
    console.log('🎉 Discord tables added successfully!');

  } catch (error) {
    console.error('❌ Error adding Discord tables:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  addDiscordTables()
    .then(() => {
      console.log('✅ Discord database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Discord database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { addDiscordTables };
