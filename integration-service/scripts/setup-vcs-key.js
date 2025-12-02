#!/usr/bin/env node

/**
 * VCS Key Setup Script
 * 
 * This script performs the complete SSH key setup flow:
 * 1. Generate Ed25519 SSH key pair
 * 2. Activate the key
 * 3. Distribute to Playground service
 * 4. Test the connection
 * 
 * Usage:
 *   node scripts/setup-vcs-key.js
 *   
 * Or via npm:
 *   npm run setup-vcs-key
 */

const http = require('http');

const INTEGRATION_BASE = process.env.INTEGRATION_BASE_URL || 'http://localhost:3001';

function httpRequest(path, method = 'POST', body = null) {
  const url = new URL(path, INTEGRATION_BASE);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method,
    headers: body ? {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    } : {}
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || parsed.detail || 'Unknown error'}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('\n🚀 VCS SSH Key Setup Utility\n');
  console.log('=' .repeat(60));
  
  try {
    console.log(`\n📡 Connecting to Integration Service: ${INTEGRATION_BASE}\n`);
    
    // Use the complete setup endpoint
    console.log('▶️  Starting complete setup flow...\n');
    const result = await httpRequest('/vcs/setup-complete', 'POST');
    
    if (!result.success) {
      throw new Error(result.error || 'Setup failed');
    }
    
    console.log('\n✅ SSH Key Setup Completed Successfully!\n');
    console.log('=' .repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   Fingerprint: ${result.summary.fingerprint}`);
    console.log(`   Status: ${result.summary.status}`);
    console.log(`   Tested: ${result.summary.tested ? '✓' : '✗'}`);
    
    console.log('\n📝 Setup Steps:');
    result.steps.forEach((step, idx) => {
      const icon = step.status === 'success' ? '✅' : '❌';
      console.log(`   ${icon} Step ${step.step}: ${step.action.toUpperCase()}`);
      if (step.fingerprint) {
        console.log(`      Fingerprint: ${step.fingerprint}`);
      }
    });
    
    console.log('\n🔑 Public Key (Add this to GitHub Deploy Keys):');
    console.log('─'.repeat(60));
    console.log(result.summary.public_key);
    console.log('─'.repeat(60));
    
    console.log('\n📖 Next Steps:');
    console.log('   1. Copy the public key above');
    console.log('   2. Go to your GitHub repository settings');
    console.log('   3. Navigate to Deploy Keys');
    console.log('   4. Add the public key with read access');
    console.log('   5. Test repository cloning via Playground service\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup Failed!\n');
    console.error('Error:', error.message);
    if (error.stack && process.env.DEBUG) {
      console.error('\nStack trace:', error.stack);
    }
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Ensure Integration Service is running');
    console.log('   2. Check database connection');
    console.log('   3. Verify INTEGRATION_VCS_KEY_ENC_KEY is set');
    console.log('   4. Verify INTEGRATION_SHARED_SECRET is set');
    console.log('   5. Ensure Playground Service is accessible\n');
    process.exit(1);
  }
}

// Alternative: Step-by-step manual flow
async function manualFlow() {
  console.log('\n🚀 VCS SSH Key Setup - Manual Step-by-Step\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Generate
    console.log('\n🔑 Step 1: Generating SSH key pair...');
    const generated = await httpRequest('/vcs/generate', 'POST');
    console.log(`✅ Generated: ${generated.data.fingerprint}`);
    const fingerprint = generated.data.fingerprint;
    const publicKey = generated.data.public_key;
    
    // Step 2: Activate
    console.log('\n🔑 Step 2: Activating SSH key...');
    const activated = await httpRequest('/vcs/activate', 'POST', JSON.stringify({ fingerprint }));
    console.log(`✅ Activated: ${activated.data.fingerprint}`);
    
    // Step 3: Test
    console.log('\n🔑 Step 3: Testing connection...');
    const tested = await httpRequest('/vcs/test-connection', 'POST');
    console.log('✅ Connection test successful');
    
    console.log('\n✅ Manual Setup Completed!\n');
    console.log('Public Key:');
    console.log('─'.repeat(60));
    console.log(publicKey);
    console.log('─'.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Manual setup failed:', error.message);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--manual')) {
  manualFlow();
} else {
  main();
}
