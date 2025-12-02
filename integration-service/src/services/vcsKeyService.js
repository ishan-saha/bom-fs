const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { query } = require('../config/database');

/**
 * VCS Key Service
 * Responsibilities:
 *  - Generate Ed25519 SSH key pairs
 *  - Encrypt private key (AES-256-GCM) using INTEGRATION_VCS_KEY_ENC_KEY
 *  - Persist key metadata to database
 *  - Activate / rotate / revoke keys
 *  - Distribute private key securely to Playground via signed HMAC payload
 *  - Test Playground connectivity (delegated to Playground /vcs/test endpoint)
 */
class VcsKeyService {
  constructor() {
    this.encKey = process.env.INTEGRATION_VCS_KEY_ENC_KEY;
    if (!this.encKey || this.encKey.length < 32) {
      console.warn('⚠️  INTEGRATION_VCS_KEY_ENC_KEY not set or too short (32 chars recommended).');
    }
    this.sharedSecret = process.env.INTEGRATION_SHARED_SECRET;
    this.playgroundBase = process.env.PLAYGROUND_BASE_URL || 'http://playground-service:8000';
    this.rotationDays = parseInt(process.env.VCS_ROTATION_DAYS || '30', 10);
    this.watchdogInterval = parseInt(process.env.VCS_WATCHDOG_INTERVAL_SEC || '300', 10);
    this.retainInactive = parseInt(process.env.VCS_RETAIN_INACTIVE || '3', 10);
    this._opMutex = false; // simple in-process mutex
    // metrics counters (in-memory; ephemeral)
    this.metrics = {
      keysGenerated: 0,
      keysActivated: 0,
      redistributions: 0,
      testsInvoked: 0,
      watchdogRedistributions: 0,
      rotationEvents: 0,
      purgeEvents: 0
    };
  }

  /** Generate a new Ed25519 keypair */
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });
    // Convert to OpenSSH formats
    const pubExport = crypto.createPublicKey({ key: publicKey, format: 'der', type: 'spki' });
    const pubSsh = this._publicKeyToOpenSSH(pubExport, 'codeshuriken-integration');
    const privPem = crypto.createPrivateKey({ key: privateKey, format: 'der', type: 'pkcs8' }).export({ format: 'pem', type: 'pkcs8' });
    return { publicKey: pubSsh, privateKey: privPem.toString() };
  }

  /** Convert Node public key object to OpenSSH format (ed25519 only). */
  _publicKeyToOpenSSH(pubKeyObj, comment) {
    const der = pubKeyObj.export({ format: 'der', type: 'spki' });
    // Minimal parser for Ed25519 (OID 1.3.101.112) to raw key extraction
    // Simpler approach: use crypto.createPublicKey -> export raw 'spki', then search for 0x302a300506032b6570032100 + 32 bytes
    const marker = Buffer.from('302a300506032b6570032100', 'hex');
    const idx = der.indexOf(marker);
    if (idx === -1) throw new Error('Unsupported public key format for ed25519');
    const raw = der.slice(idx + marker.length, idx + marker.length + 32);
    const type = Buffer.from('ssh-ed25519');
    function writeString(buf) { return Buffer.concat([Buffer.alloc(4, 0).writeUInt32BE(buf.length, 0) ? Buffer.alloc(0) : Buffer.alloc(0), buf]); }
    // Fallback simpler manual build
    const len = Buffer.alloc(4); len.writeUInt32BE(type.length, 0);
    const rawLen = Buffer.alloc(4); rawLen.writeUInt32BE(raw.length, 0);
    const combined = Buffer.concat([len, type, rawLen, raw]);
    const b64 = combined.toString('base64');
    return `ssh-ed25519 ${b64} ${comment}`;
  }

  computeFingerprint(publicKey) {
    const parts = publicKey.trim().split(/\s+/);
    if (parts.length < 2) throw new Error('Invalid public key format');
    const keyB64 = parts[1];
    const raw = Buffer.from(keyB64, 'base64');
    const digest = crypto.createHash('sha256').update(raw).digest('base64').replace(/=+$/, '');
    return `SHA256:${digest}`;
  }

  encryptPrivateKey(plain) {
    if (!this.encKey) throw new Error('Encryption key not configured');
    const key = crypto.createHash('sha256').update(this.encKey).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]);
  }

  async storeKey(publicKey, privateKeyEnc, fingerprint) {
    const res = await query(
      `INSERT INTO vcs_keys (fingerprint, public_key, private_key_enc, status, active)
       VALUES ($1, $2, $3, 'pending', false)
       RETURNING id, fingerprint, status, active, created_at`,
      [fingerprint, publicKey, privateKeyEnc]
    );
    await this._logEvent(fingerprint, 'generated', { fingerprint });
    return res.rows[0];
  }

  async generateAndPersist() {
    await this._acquire();
    try {
      const { publicKey, privateKey } = this.generateKeyPair();
      const fingerprint = this.computeFingerprint(publicKey);
      const privateKeyEnc = this.encryptPrivateKey(privateKey);
      const row = await storeRetry(async () => this.storeKey(publicKey, privateKeyEnc, fingerprint));
      this.metrics.keysGenerated++;
      return { ...row, publicKey, fingerprint, privateKeyPlain: privateKey };
    } finally {
      this._release();
    }
  }

  async activateKey(fingerprint) {
    await this._acquire();
    try {
      // Deactivate current active key
      await query(`UPDATE vcs_keys SET active=false, status='deprecated', rotated_at=NOW() WHERE active=true`);
      const res = await query(`UPDATE vcs_keys SET active=true, status='active' WHERE fingerprint=$1 RETURNING id, fingerprint, active, status`, [fingerprint]);
      if (res.rowCount === 0) throw new Error('Fingerprint not found');
      await this._logEvent(fingerprint, 'activated', {});
      this.metrics.keysActivated++;
      return res.rows[0];
    } finally {
      this._release();
    }
  }

  signPayload(publicKey, fingerprint) {
    if (!this.sharedSecret) throw new Error('INTEGRATION_SHARED_SECRET not configured');
    const h = crypto.createHmac('sha256', this.sharedSecret);
    h.update(publicKey + fingerprint);
    return h.digest('hex');
  }

  async distributeKey(privateKeyPlain, publicKey, fingerprint) {
    const sig = this.signPayload(publicKey, fingerprint);
    const payload = JSON.stringify({ private_key: privateKeyPlain, public_key: publicKey, fingerprint, signature: sig });
    return this._httpRequest('/internal/vcs/ssh-key', 'POST', payload, { 'Content-Type': 'application/json' });
  }

  async testPlayground() {
    this.metrics.testsInvoked++;
    return this._httpRequest('/vcs/test', 'POST');
  }

  async getActivePublicKey() {
    const res = await query(`SELECT fingerprint, public_key, status, active FROM vcs_keys WHERE active=true LIMIT 1`);
    return res.rows[0] || null;
  }

  async getKeyByFingerprint(fingerprint) {
    const res = await query(`SELECT fingerprint, public_key, private_key_enc, status, active, created_at FROM vcs_keys WHERE fingerprint=$1`, [fingerprint]);
    return res.rows[0] || null;
  }

  decryptPrivateKey(encBuf) {
    if (!this.encKey) throw new Error('Encryption key not configured');
    const key = crypto.createHash('sha256').update(this.encKey).digest();
    const buf = Buffer.isBuffer(encBuf) ? encBuf : Buffer.from(encBuf, 'base64');
    const iv = buf.slice(0,12);
    const tag = buf.slice(12,28);
    const data = buf.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString();
  }

  async redistributeActiveKey() {
    const active = await this.getActivePublicKey();
    if (!active) throw new Error('No active key');
    const full = await this.getKeyByFingerprint(active.fingerprint);
    const privateKeyPlain = this.decryptPrivateKey(full.private_key_enc);
    const result = await this.distributeKey(privateKeyPlain, full.public_key, full.fingerprint);
    await this._logEvent(full.fingerprint, 'redistributed', {});
    this.metrics.redistributions++;
    return { redistributed: true, fingerprint: full.fingerprint, playground: result };
  }

  async purgeOldInactive() {
    const res = await query(`SELECT fingerprint FROM vcs_keys WHERE active=false ORDER BY created_at DESC OFFSET $1`, [this.retainInactive]);
    let purged = 0;
    for (const row of res.rows) {
      await query(`DELETE FROM vcs_keys WHERE fingerprint=$1`, [row.fingerprint]);
      await this._logEvent(row.fingerprint, 'purged', {});
      purged++;
    }
    if (purged) this.metrics.purgeEvents += purged;
    return purged;
  }

  async rotateIfDue() {
    const active = await this.getActivePublicKey();
    if (!active) return null; // no rotation yet
    const ageRes = await query(`SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) AS age FROM vcs_keys WHERE fingerprint=$1`, [active.fingerprint]);
    const ageSeconds = parseInt(ageRes.rows[0].age, 10);
    const maxAge = this.rotationDays * 86400;
    if (ageSeconds >= maxAge) {
      const gen = await this.generateAndPersist();
      await this.activateKey(gen.fingerprint);
      await this.distributeKey(gen.privateKeyPlain, gen.publicKey, gen.fingerprint);
      await this._logEvent(gen.fingerprint, 'rotated', { previous: active.fingerprint });
      this.metrics.rotationEvents++;
      await this.purgeOldInactive();
      return { rotated: true, newFingerprint: gen.fingerprint, previous: active.fingerprint };
    }
    return { rotated: false, fingerprint: active.fingerprint };
  }

  async watchdogCheck() {
    // Ensure playground has key installed; if not, redistribute
    try {
      const status = await this._httpRequest('/vcs/status', 'GET');
      if (!status.installed) {
        await this.redistributeActiveKey();
        this.metrics.watchdogRedistributions++;
        return { action: 'redistributed' };
      }
      return { action: 'none' };
    } catch (e) {
      await this._logEvent('N/A', 'watchdog_error', { error: e.message });
      return { action: 'error', error: e.message };
    }
  }

  async exportMetrics() {
    const active = await this.getActivePublicKey();
    let ageSeconds = 0;
    if (active) {
      const ageRes = await query(`SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) AS age FROM vcs_keys WHERE fingerprint=$1`, [active.fingerprint]);
      ageSeconds = parseInt(ageRes.rows[0].age, 10);
    }
    return [
      `vcs_keys_generated_total ${this.metrics.keysGenerated}`,
      `vcs_keys_activated_total ${this.metrics.keysActivated}`,
      `vcs_keys_redistributions_total ${this.metrics.redistributions}`,
      `vcs_keys_watchdog_redistributions_total ${this.metrics.watchdogRedistributions}`,
      `vcs_keys_rotation_events_total ${this.metrics.rotationEvents}`,
      `vcs_keys_purge_events_total ${this.metrics.purgeEvents}`,
      `vcs_active_key_age_seconds ${ageSeconds}`
    ].join('\n');
  }

  async _logEvent(fingerprint, eventType, meta) {
    try {
      await query(`INSERT INTO vcs_key_events (fingerprint, event_type, meta) VALUES ($1, $2, $3)`, [fingerprint, eventType, meta || {}]);
    } catch (e) {
      console.error('Failed to log VCS key event', eventType, e.message);
    }
  }

  async _acquire() {
    let spins = 0;
    while (this._opMutex) { // simple spin-wait with backoff
      await new Promise(r => setTimeout(r, 25));
      if (++spins > 200) throw new Error('Mutex contention');
    }
    this._opMutex = true;
  }

  _release() {
    this._opMutex = false;
  }

  _httpRequest(path, method, body = null, headers = {}) {
    const base = new URL(this.playgroundBase);
    const opts = {
      protocol: base.protocol,
      hostname: base.hostname,
      port: base.port,
      path,
      method,
      headers
    };
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const client = base.protocol === 'https:' ? https : http;
    return new Promise((resolve, reject) => {
      const req = client.request(opts, res => {
        let data = '';
        res.on('data', d => (data += d));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(parsed.detail || parsed.error || `HTTP ${res.statusCode}`));
            }
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }
}

async function storeRetry(fn, attempts = 3) {
  let last; for (let i = 0; i < attempts; i++) { try { return await fn(); } catch (e) { last = e; await new Promise(r => setTimeout(r, 100 * (i + 1))); } } throw last; }

module.exports = new VcsKeyService();
