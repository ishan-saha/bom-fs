#!/usr/bin/env node
/**
 * Migration: Create vcs_key_events audit table
 */
const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'integration_user',
    password: process.env.DB_PASSWORD || 'integration_password',
    database: process.env.DB_NAME || 'integration_service'
  });
  await client.connect();

  const ddl = `
  CREATE TABLE IF NOT EXISTS vcs_key_events (
    id BIGSERIAL PRIMARY KEY,
    fingerprint VARCHAR(128) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_vcs_key_events_fingerprint_created_at ON vcs_key_events (fingerprint, created_at DESC);
  `;

  try {
    await client.query('BEGIN');
    await client.query(ddl);
    await client.query('COMMIT');
    console.log('vcs_key_events table ensured.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating vcs_key_events table:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
