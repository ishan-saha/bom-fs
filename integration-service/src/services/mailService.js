const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

class MailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Create a transporter using sender profile
   * @param {Object} senderProfile - Sender profile with SMTP configuration
   */
  createTransporter(senderProfile) {
    this.transporter = nodemailer.createTransport({
      host: senderProfile.smtp_host,
      port: senderProfile.smtp_port,
      secure: senderProfile.smtp_secure, // true for 465, false for other ports
      auth: {
        user: senderProfile.email,
        pass: senderProfile.password
      }
    });
  }

  /**
   * Send email using predefined template
   * @param {string} senderProfileId - ID of sender profile to use
   * @param {string} recipientProfileId - ID of recipient profile to send to
   * @param {string} subject - Email subject (optional, will use default if not provided)
   * @param {string} customBody - Custom email body (optional, will use default if not provided)
   */
  async sendEmail(senderProfileId, recipientProfileId, subject = null, customBody = null) {
    try {
      // Get sender profile
      const senderResult = await pool.query(
        'SELECT * FROM email_sender_profiles WHERE id = $1 AND is_active = true',
        [senderProfileId]
      );

      if (senderResult.rows.length === 0) {
        throw new Error('Sender profile not found or inactive');
      }

      const senderProfile = senderResult.rows[0];

      // Get recipient profile
      const recipientResult = await pool.query(
        'SELECT * FROM email_recipient_profiles WHERE id = $1 AND is_active = true',
        [recipientProfileId]
      );

      if (recipientResult.rows.length === 0) {
        throw new Error('Recipient profile not found or inactive');
      }

      const recipientProfile = recipientResult.rows[0];

      // Check if this is a demo/test configuration
      const isDemoConfig = senderProfile.email.includes('test@') || 
                          senderProfile.password === 'abcdefghijklmnop' ||
                          senderProfile.password.includes('abcd efgh');

      if (isDemoConfig) {
        // Simulate email sending for demo purposes
        console.log(`📧 DEMO MODE: Simulating email send to ${recipientProfile.email}`);
        console.log(`📧 Subject: ${subject || 'Notification from Integration Service'}`);
        console.log(`📧 From: ${senderProfile.sender_name} <${senderProfile.email}>`);
        
        const simulatedMessageId = `demo-${Date.now()}@integration-service.local`;
        
        // Log simulated email in database
        const logResult = await pool.query(`
          INSERT INTO email_logs (
            sender_profile_id, recipient_profile_id, recipient_email, 
            subject, body, status, message_id, sent_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [
          senderProfileId,
          recipientProfileId,
          recipientProfile.email,
          subject || 'Notification from Integration Service',
          customBody || 'Demo email body',
          'demo-sent',
          simulatedMessageId,
          new Date()
        ]);

        return {
          success: true,
          messageId: simulatedMessageId,
          logId: logResult.rows[0].id,
          recipient: recipientProfile.email,
          subject: subject || 'Notification from Integration Service',
          demo: true,
          message: 'Email simulated successfully (demo mode)'
        };
      }

      // Create transporter for real email sending
      this.createTransporter(senderProfile);

      // Default email content
      const defaultSubject = 'Notification from Integration Service';
      const defaultBody = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">Hello ${recipientProfile.name || recipientProfile.email}!</h2>
              <p>This is an automated message from our Integration Service.</p>
              <p>We hope this message finds you well.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Service Details:</strong></p>
                <ul>
                  <li>Service: Integration Service</li>
                  <li>Status: Operational</li>
                  <li>Timestamp: ${new Date().toISOString()}</li>
                </ul>
              </div>
              
              <br>
              <p>Best regards,</p>
              <p><strong>${senderProfile.sender_name}</strong></p>
              <p>${senderProfile.organization || 'Integration Service Team'}</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <small style="color: #666;">
                This email was sent automatically from our integration service. 
                Please do not reply to this email.
              </small>
            </div>
          </body>
        </html>
      `;

      // Email options
      const mailOptions = {
        from: `"${senderProfile.sender_name}" <${senderProfile.email}>`,
        to: recipientProfile.email,
        subject: subject || defaultSubject,
        html: customBody || defaultBody
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      // Log email in database
      const logResult = await pool.query(`
        INSERT INTO email_logs (
          sender_profile_id, recipient_profile_id, recipient_email, 
          subject, body, status, message_id, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        senderProfileId,
        recipientProfileId,
        recipientProfile.email,
        mailOptions.subject,
        mailOptions.html,
        'sent',
        info.messageId,
        new Date()
      ]);

      console.log(`📧 Email sent successfully to ${recipientProfile.email}`);
      console.log(`📊 Email logged with ID: ${logResult.rows[0].id}`);

      return {
        success: true,
        messageId: info.messageId,
        logId: logResult.rows[0].id,
        recipient: recipientProfile.email,
        subject: mailOptions.subject,
        demo: false
      };

    } catch (error) {
      console.error('❌ Error sending email:', error.message);

      // Log failed email attempt
      try {
        await pool.query(`
          INSERT INTO email_logs (
            sender_profile_id, recipient_profile_id, recipient_email, 
            subject, body, status, error_message, sent_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          senderProfileId || null,
          recipientProfileId || null,
          recipientProfile?.email || null,
          subject || 'Failed to send',
          customBody || 'Failed to send',
          'failed',
          error.message,
          new Date()
        ]);
      } catch (logError) {
        console.error('❌ Error logging failed email:', logError.message);
      }

      throw error;
    }
  }

  /**
   * Create a new sender profile
   * @param {Object} profileData - Sender profile data
   */
  async createSenderProfile(profileData) {
    try {
      const {
        email,
        password,
        sender_name,
        organization,
        smtp_host,
        smtp_port,
        smtp_secure
      } = profileData;

      // Create test account if using ethereal email
      if (email.includes('ethereal.email') && password === 'auto-generate') {
        const nodemailer = require('nodemailer');
        const testAccount = await nodemailer.createTestAccount();
        
        profileData.email = testAccount.user;
        profileData.password = testAccount.pass;
        profileData.smtp_host = testAccount.smtp.host;
        profileData.smtp_port = testAccount.smtp.port;
        profileData.smtp_secure = testAccount.smtp.secure;
        
        console.log(`📧 Generated test email account: ${testAccount.user}`);
        console.log(`📧 Test account password: ${testAccount.pass}`);
        console.log(`📧 SMTP Host: ${testAccount.smtp.host}:${testAccount.smtp.port}`);
      }

      const result = await pool.query(`
        INSERT INTO email_sender_profiles (
          email, password, sender_name, organization, 
          smtp_host, smtp_port, smtp_secure, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, email, sender_name, organization
      `, [
        profileData.email || email,
        profileData.password || password,
        sender_name,
        organization,
        profileData.smtp_host || smtp_host,
        profileData.smtp_port || smtp_port || 587,
        profileData.smtp_secure || smtp_secure || false,
        true,
        new Date()
      ]);

      console.log(`📧 Sender profile created for: ${profileData.email || email}`);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Error creating sender profile:', error.message);
      throw error;
    }
  }

  /**
   * Create a new recipient profile
   * @param {Object} profileData - Recipient profile data
   */
  async createRecipientProfile(profileData) {
    try {
      const { email, name, category, notes } = profileData;

      const result = await pool.query(`
        INSERT INTO email_recipient_profiles (
          email, name, category, notes, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, category
      `, [
        email,
        name,
        category || 'general',
        notes,
        true,
        new Date()
      ]);

      console.log(`📧 Recipient profile created for: ${email}`);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Error creating recipient profile:', error.message);
      throw error;
    }
  }

  /**
   * Get all sender profiles
   */
  async getSenderProfiles() {
    try {
      const result = await pool.query(`
        SELECT id, email, sender_name, organization, smtp_host, smtp_port, 
               smtp_secure, is_active, created_at
        FROM email_sender_profiles
        ORDER BY created_at DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching sender profiles:', error.message);
      throw error;
    }
  }

  /**
   * Get all recipient profiles
   */
  async getRecipientProfiles() {
    try {
      const result = await pool.query(`
        SELECT id, email, name, category, notes, is_active, created_at
        FROM email_recipient_profiles
        ORDER BY created_at DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching recipient profiles:', error.message);
      throw error;
    }
  }

  /**
   * Get email sending history
   */
  async getEmailLogs(limit = 50) {
    try {
      const result = await pool.query(`
        SELECT 
          el.*,
          esp.email as sender_email,
          esp.sender_name,
          erp.email as recipient_email_profile,
          erp.name as recipient_name
        FROM email_logs el
        LEFT JOIN email_sender_profiles esp ON el.sender_profile_id = esp.id
        LEFT JOIN email_recipient_profiles erp ON el.recipient_profile_id = erp.id
        ORDER BY el.sent_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching email logs:', error.message);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(senderProfileId) {
    try {
      const senderResult = await pool.query(
        'SELECT * FROM email_sender_profiles WHERE id = $1',
        [senderProfileId]
      );

      if (senderResult.rows.length === 0) {
        throw new Error('Sender profile not found');
      }

      const senderProfile = senderResult.rows[0];
      
      // Check if this is a demo/test configuration
      const isDemoConfig = senderProfile.email.includes('test@') || 
                          senderProfile.password === 'abcdefghijklmnop' ||
                          senderProfile.password.includes('abcd efgh');

      if (isDemoConfig) {
        console.log('✅ Demo configuration detected - simulation mode active');
        return { 
          success: true, 
          message: 'Demo configuration is valid (simulation mode)',
          demo: true,
          config: {
            email: senderProfile.email,
            smtp_host: senderProfile.smtp_host,
            smtp_port: senderProfile.smtp_port
          }
        };
      }

      this.createTransporter(senderProfile);

      // Verify connection
      await this.transporter.verify();
      
      console.log('✅ Email configuration test successful');
      return { 
        success: true, 
        message: 'Email configuration is valid',
        demo: false,
        config: {
          email: senderProfile.email,
          smtp_host: senderProfile.smtp_host,
          smtp_port: senderProfile.smtp_port
        }
      };

    } catch (error) {
      console.error('❌ Email configuration test failed:', error.message);
      throw error;
    }
  }
}

module.exports = new MailService();
