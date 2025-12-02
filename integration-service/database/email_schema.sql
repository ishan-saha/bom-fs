-- Email Service Database Schema
-- Run this script to create the necessary tables for email functionality

-- Table for storing email sender profiles (SMTP configurations)
CREATE TABLE IF NOT EXISTS email_sender_profiles (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Store encrypted in production
    sender_name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing email recipient profiles
CREATE TABLE IF NOT EXISTS email_recipient_profiles (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    category VARCHAR(100) DEFAULT 'general', -- e.g., 'customers', 'staff', 'vendors'
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for logging email activities
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    sender_profile_id INTEGER REFERENCES email_sender_profiles(id),
    recipient_profile_id INTEGER REFERENCES email_recipient_profiles(id),
    recipient_email VARCHAR(255),
    subject VARCHAR(500),
    body TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'sent', 'failed', 'pending'
    message_id VARCHAR(255), -- Email service message ID
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_sender_profiles_email ON email_sender_profiles(email);
CREATE INDEX IF NOT EXISTS idx_email_sender_profiles_active ON email_sender_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_email_recipient_profiles_email ON email_recipient_profiles(email);
CREATE INDEX IF NOT EXISTS idx_email_recipient_profiles_active ON email_recipient_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
DROP TRIGGER IF EXISTS update_email_sender_profiles_updated_at ON email_sender_profiles;
CREATE TRIGGER update_email_sender_profiles_updated_at
    BEFORE UPDATE ON email_sender_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_recipient_profiles_updated_at ON email_recipient_profiles;
CREATE TRIGGER update_email_recipient_profiles_updated_at
    BEFORE UPDATE ON email_recipient_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion (optional - remove in production)
-- INSERT INTO email_sender_profiles (email, password, sender_name, organization, smtp_host, smtp_port, smtp_secure)
-- VALUES 
--     ('noreply@yourcompany.com', 'your_app_password', 'Integration Service', 'Your Company', 'smtp.gmail.com', 587, false);

-- INSERT INTO email_recipient_profiles (email, name, category, notes)
-- VALUES 
--     ('user@example.com', 'Test User', 'customers', 'Test recipient for development');

COMMENT ON TABLE email_sender_profiles IS 'Stores SMTP configurations for different email sender accounts';
COMMENT ON TABLE email_recipient_profiles IS 'Stores recipient email addresses and metadata';
COMMENT ON TABLE email_logs IS 'Logs all email sending activities for tracking and debugging';
