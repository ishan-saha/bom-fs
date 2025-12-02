-- Create the database and user setup
CREATE DATABASE telegram_service;

-- Grant ishika user privileges
GRANT ALL PRIVILEGES ON DATABASE telegram_service TO ishika;

-- Connect to telegram_service database
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

SELECT 'Database setup completed successfully!' as result;
