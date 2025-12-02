const vcsKeyService = require('./vcsKeyService');

/**
 * Scheduler for rotation & watchdog tasks.
 * Exports start() to be invoked from server.js
 */
class VcsScheduler {
  constructor() {
    this.rotationTimer = null;
    this.watchdogTimer = null;
  }

  start() {
    const rotationHours = parseInt(process.env.VCS_ROTATION_CHECK_INTERVAL_HOURS || '6', 10);
    const watchdogSec = vcsKeyService.watchdogInterval;

    // Stagger initial delays slightly
    setTimeout(() => this._runRotation('initial'), 5000);
    setTimeout(() => this._runWatchdog('initial'), 8000);

    this.rotationTimer = setInterval(() => this._runRotation('interval'), rotationHours * 3600 * 1000);
    this.watchdogTimer = setInterval(() => this._runWatchdog('interval'), watchdogSec * 1000);
  }

  async _runRotation(source) {
    try {
      const res = await vcsKeyService.rotateIfDue();
      if (res && res.rotated) {
        console.log(`[VCS-Rotation] Rotated key ${res.previous} -> ${res.newFingerprint} (trigger=${source})`);
      }
    } catch (e) {
      console.error('[VCS-Rotation] Error:', e.message);
    }
  }

  async _runWatchdog(source) {
    try {
      const res = await vcsKeyService.watchdogCheck();
      if (res.action !== 'none') {
        console.log(`[VCS-Watchdog] Action=${res.action} trigger=${source}`);
      }
    } catch (e) {
      console.error('[VCS-Watchdog] Error:', e.message);
    }
  }
}

module.exports = new VcsScheduler();
