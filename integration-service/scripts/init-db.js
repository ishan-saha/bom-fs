require('dotenv').config();
const { Pool } = require('pg');

// Database configuration for initialization
// Connect first to a maintenance DB (default 'postgres') to create the target DB.
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.PG_MAINTENANCE_DB || 'postgres'
};

async function initializeDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Initializing database...');
    
  // Connect to PostgreSQL maintenance database
    const client = await pool.connect();
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'telegram_service';
    
    try {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️  Database '${dbName}' already exists`);
      } else {
        throw error;
      }
    }
    
    client.release();
    
    // Now connect to the specific database and create tables
    const dbPool = new Pool({
      ...dbConfig,
      database: dbName
    });
    
    const dbClient = await dbPool.connect();
    
    // Create tables
    console.log('🔄 Creating tables...');
    
    // Users table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created/verified');

    // Messages table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(255) NOT NULL,
        message_text TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        telegram_message_id INTEGER,
        error_message TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES users(chat_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Messages table created/verified');

    // Create indexes
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)
    `);
    
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)
    `);
    
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_users_chat_id ON users(chat_id)
    `);
    
    console.log('✅ Indexes created/verified');
    
    // Insert sample data if needed
    const userCount = await dbClient.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('ℹ️  No users found. Database is ready for first use.');
      console.log('📋 Next steps:');
      console.log('   1. Set up your .env file with the Telegram bot token');
      console.log('   2. Start the service with "npm start"');
      console.log('   3. Send /start to your bot to register users');
    } else {
      console.log(`ℹ️  Found ${userCount.rows[0].count} existing users`);
    }
    
    dbClient.release();
    await dbPool.end();
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (error.code === '28P01') {
      console.error('💡 Hint: Check your database credentials in the .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Hint: Make sure PostgreSQL is running on your system');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = { initializeDatabase };
