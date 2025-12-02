require('dotenv').config();
const { query } = require('../src/config/database');

/**
 * Migration Script: Create vcs_keys table for managing SSH key lifecycle.
 *
 * Security: private_key_enc column stores AES-GCM encrypted private key bytes.
 * The encryption/decryption is handled by the service layer; this script only creates schema.
 */
async function addVcsKeysTable() {
  try {
    console.log('🔄 Adding VCS keys table to existing database...');

    await query(`
      CREATE TABLE IF NOT EXISTS vcs_keys (
        id SERIAL PRIMARY KEY,
        fingerprint VARCHAR(128) UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        private_key_enc BYTEA NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rotated_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending', -- pending|active|deprecated|revoked
        last_validated_at TIMESTAMP,
        active BOOLEAN DEFAULT false
      )
    `);
    console.log('✅ vcs_keys table created/verified');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_vcs_keys_status ON vcs_keys(status)
    `);

    console.log('✅ Indexes created/verified');
    console.log('🎉 VCS keys table migration completed');
  } catch (error) {
    console.error('❌ Error adding vcs_keys table:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  addVcsKeysTable().then(() => process.exit(0));
}

module.exports = { addVcsKeysTable };
