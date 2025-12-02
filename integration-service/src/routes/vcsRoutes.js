const express = require('express');
const router = express.Router();
const vcsKeyService = require('../services/vcsKeyService');

// Generate new key (pending) – returns public key & fingerprint (private kept only for distribution within same request)
router.post('/generate', async (req, res) => {
  try {
    const result = await vcsKeyService.generateAndPersist();
    res.status(201).json({
      success: true,
      data: {
        fingerprint: result.fingerprint,
        public_key: result.publicKey,
        status: 'pending'
      }
    });
  } catch (e) {
    console.error('❌ Key generation failed:', e.message);
    res.status(500).json({ success: false, error: 'Failed to generate key' });
  }
});

// Activate key (after org adds public key to GitHub)
router.post('/activate/:fingerprint', async (req, res) => {
  try {
    const row = await vcsKeyService.activateKey(req.params.fingerprint);
    // After activation, automatically distribute to Playground
    try {
      await vcsKeyService.redistributeActiveKey();
    } catch (e) {
      console.warn('Post-activation redistribution failed:', e.message);
    }
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Alternate activation endpoint accepting fingerprint in JSON body
// Use this to avoid potential proxy/WAF issues with special characters in path params
router.post('/activate', async (req, res) => {
  try {
    const { fingerprint } = req.body || {};
    if (!fingerprint || typeof fingerprint !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing fingerprint' });
    }
    const row = await vcsKeyService.activateKey(fingerprint);
    try {
      await vcsKeyService.redistributeActiveKey();
    } catch (e) {
      console.warn('Post-activation redistribution failed:', e.message);
    }
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Distribute active key's private material to Playground (single-use) – optional manual trigger
router.post('/distribute/:fingerprint', async (req, res) => {
  try {
    const fp = req.params.fingerprint;
    const active = await vcsKeyService.getActivePublicKey();
    if (!active || active.fingerprint !== fp) {
      return res.status(400).json({ success: false, error: 'Fingerprint is not the active key' });
    }
    const result = await vcsKeyService.redistributeActiveKey();
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Distribution failed' });
  }
});

// Get active key public info
router.get('/active', async (_req, res) => {
  try {
    const row = await vcsKeyService.getActivePublicKey();
    if (!row) return res.status(404).json({ success: false, error: 'No active key' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch active key' });
  }
});

// Test Playground connection using /vcs/test
router.post('/test-connection', async (_req, res) => {
  try {
    // Ensure Playground has the active key first
    try {
      await vcsKeyService.redistributeActiveKey();
    } catch (e) {
      console.warn('Redistribution before test failed (may already be installed):', e.message);
    }
    const result = await vcsKeyService.testPlayground();
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Trigger rotation check immediately
router.post('/rotate-if-due', async (_req, res) => {
  try {
    const result = await vcsKeyService.rotateIfDue();
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Force watchdog check now
router.post('/watchdog-check', async (_req, res) => {
  try {
    const result = await vcsKeyService.watchdogCheck();
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Metrics exposition (Prometheus format)
router.get('/metrics', async (_req, res) => {
  try {
    const text = await vcsKeyService.exportMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(text + '\n');
  } catch (e) {
    res.status(500).send(`# error ${e.message}`);
  }
});

// Complete flow: Generate -> Activate -> Distribute -> Test
router.post('/setup-complete', async (_req, res) => {
  try {
    const steps = [];
    
    // Step 1: Generate SSH key pair
    console.log('🔑 Step 1: Generating SSH key pair...');
    const generated = await vcsKeyService.generateAndPersist();
    steps.push({
      step: 1,
      action: 'generate',
      status: 'success',
      fingerprint: generated.fingerprint,
      public_key: generated.publicKey
    });
    console.log(`✅ Generated key with fingerprint: ${generated.fingerprint}`);
    
    // Step 2: Activate the key
    console.log('🔑 Step 2: Activating SSH key...');
    const activated = await vcsKeyService.activateKey(generated.fingerprint);
    steps.push({
      step: 2,
      action: 'activate',
      status: 'success',
      fingerprint: activated.fingerprint,
      active: activated.active
    });
    console.log(`✅ Activated key: ${activated.fingerprint}`);
    
    // Step 3: Distribute to Playground
    console.log('🔑 Step 3: Distributing key to Playground...');
    const distributed = await vcsKeyService.redistributeActiveKey();
    steps.push({
      step: 3,
      action: 'distribute',
      status: 'success',
      fingerprint: distributed.fingerprint,
      playground_response: distributed.playground
    });
    console.log(`✅ Distributed key to Playground: ${distributed.fingerprint}`);
    
    // Step 4: Test the connection
    console.log('🔑 Step 4: Testing Playground connection...');
    const testResult = await vcsKeyService.testPlayground();
    steps.push({
      step: 4,
      action: 'test',
      status: 'success',
      test_result: testResult
    });
    console.log('✅ Connection test successful');
    
    res.json({
      success: true,
      message: 'SSH key setup completed successfully',
      summary: {
        fingerprint: generated.fingerprint,
        public_key: generated.publicKey,
        status: 'active',
        tested: true
      },
      steps
    });
  } catch (e) {
    console.error('❌ Setup failed:', e.message);
    res.status(500).json({
      success: false,
      error: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
});

module.exports = router;
