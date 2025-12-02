const express = require('express');
const Joi = require('joi');
const mailService = require('../services/mailService');

const router = express.Router();

// Validation schemas
const senderProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8),
  sender_name: Joi.string().required().min(2).max(255),
  organization: Joi.string().optional().max(255),
  smtp_host: Joi.string().required(),
  smtp_port: Joi.number().integer().min(1).max(65535).default(587),
  smtp_secure: Joi.boolean().default(false)
});

const recipientProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().optional().max(255),
  category: Joi.string().optional().max(100).default('general'),
  notes: Joi.string().optional().max(1000)
});

const sendEmailSchema = Joi.object({
  sender_profile_id: Joi.number().integer().required(),
  recipient_profile_id: Joi.number().integer().required(),
  subject: Joi.string().optional().max(500),
  body: Joi.string().optional().max(10000)
});

/**
 * POST /api/email/sender-profiles
 * Create a new email sender profile
 */
router.post('/sender-profiles', async (req, res) => {
  try {
    const { error, value } = senderProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const profile = await mailService.createSenderProfile(value);
    
    res.status(201).json({
      success: true,
      message: 'Sender profile created successfully',
      data: profile
    });

  } catch (error) {
    console.error('❌ Error creating sender profile:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create sender profile',
      details: error.message
    });
  }
});

/**
 * POST /api/email/recipient-profiles
 * Create a new email recipient profile
 */
router.post('/recipient-profiles', async (req, res) => {
  try {
    const { error, value } = recipientProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const profile = await mailService.createRecipientProfile(value);
    
    res.status(201).json({
      success: true,
      message: 'Recipient profile created successfully',
      data: profile
    });

  } catch (error) {
    console.error('❌ Error creating recipient profile:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create recipient profile',
      details: error.message
    });
  }
});

/**
 * POST /api/email/send
 * Send email using sender and recipient profiles
 */
router.post('/send', async (req, res) => {
  try {
    const { error, value } = sendEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { sender_profile_id, recipient_profile_id, subject, body } = value;
    
    const result = await mailService.sendEmail(
      sender_profile_id,
      recipient_profile_id,
      subject,
      body
    );
    
    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    let statusCode = 500;
    if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('authentication') || error.message.includes('Invalid login')) {
      statusCode = 401;
    }
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * GET /api/email/sender-profiles
 * Get all sender profiles
 */
router.get('/sender-profiles', async (req, res) => {
  try {
    const profiles = await mailService.getSenderProfiles();
    
    res.status(200).json({
      success: true,
      data: profiles,
      count: profiles.length
    });

  } catch (error) {
    console.error('❌ Error fetching sender profiles:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sender profiles',
      details: error.message
    });
  }
});

/**
 * GET /api/email/recipient-profiles
 * Get all recipient profiles
 */
router.get('/recipient-profiles', async (req, res) => {
  try {
    const profiles = await mailService.getRecipientProfiles();
    
    res.status(200).json({
      success: true,
      data: profiles,
      count: profiles.length
    });

  } catch (error) {
    console.error('❌ Error fetching recipient profiles:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipient profiles',
      details: error.message
    });
  }
});

/**
 * GET /api/email/logs
 * Get email sending history
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await mailService.getEmailLogs(limit);
    
    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length
    });

  } catch (error) {
    console.error('❌ Error fetching email logs:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email logs',
      details: error.message
    });
  }
});

/**
 * POST /api/email/test-config/:profileId
 * Test email configuration for a sender profile
 */
router.post('/test-config/:profileId', async (req, res) => {
  try {
    const profileId = parseInt(req.params.profileId);
    
    if (!profileId || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID'
      });
    }

    const result = await mailService.testEmailConfig(profileId);
    
    res.status(200).json({
      success: true,
      message: 'Email configuration test successful',
      data: result
    });

  } catch (error) {
    console.error('❌ Error testing email config:', error.message);
    res.status(500).json({
      success: false,
      error: 'Email configuration test failed',
      details: error.message
    });
  }
});

module.exports = router;
