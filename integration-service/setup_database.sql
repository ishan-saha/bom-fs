-- SQL script to set up the database for Telegram Integration Service

-- Create user ishika if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ishika') THEN
        CREATE USER ishika WITH PASSWORD 'postgresql123';
    END IF;
END
$$;

-- Create database telegram_service if it doesn't exist
SELECT 'CREATE DATABASE telegram_service OWNER ishika'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'telegram_service')\gexec

-- Grant privileges to ishika user
GRANT ALL PRIVILEGES ON DATABASE telegram_service TO ishika;

-- Connect to the telegram_service database to create tables
\c telegram_service

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO ishika;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ishika;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ishika;

-- Create the tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    chat_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_users_chat_id ON users(chat_id);

-- Grant permissions on the created tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ishika;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ishika;

-- Display success message
SELECT 'Database setup completed successfully!' as result;
