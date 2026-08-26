const pool = require('../config/database');
const logger = require('../config/logger');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { CONTACT_RETENTION_DAYS } = require('../utils/constants');

class ContactService {
  /**
   * Submit contact form
   */
  static async submitContactForm(data, ipAddress) {
    try {
      const { name, email, subject, message, consent_given } = data;
      const expiresAt = new Date(Date.now() + CONTACT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

      const result = await pool.query(
        `INSERT INTO contact_submissions (name, email, subject, message, ip_address, consent_given, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [name, email, subject, message, ipAddress, consent_given, expiresAt]
      );

      const submissionId = result.rows[0].id;

      // Send emails asynchronously (don't wait for them)
      ContactService.sendEmails(name, email, subject, message).catch(err => {
        logger.error('Error sending emails:', err);
      });

      return {
        submission_id: submissionId,
        email,
        confirmation_email_sent: true,
      };
    } catch (error) {
      logger.error('Error submitting contact form:', error);
      throw error;
    }
  }

  /**
   * Send emails to admin and customer
   */
  static async sendEmails(name, customerEmail, subject, message) {
    try {
      const contactEmail = process.env.CONTACT_EMAIL || 'support@northstar.com';

      // Admin notification
      const adminMessage = {
        from: contactEmail,
        to: contactEmail,
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      };

      // Customer confirmation
      const customerMessage = {
        from: contactEmail,
        to: customerEmail,
        subject: 'We received your message',
        html: `
          <h2>Thank you for contacting Northstar</h2>
          <p>Hi ${name},</p>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Your message:</strong></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p>Best regards,<br>Northstar Team</p>
        `,
      };

      // Try SendGrid first, fallback to nodemailer
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await Promise.all([
          sgMail.send(adminMessage),
          sgMail.send(customerMessage),
        ]);
        logger.info(`Emails sent via SendGrid for submission from ${customerEmail}`);
      } else {
        // Fallback to nodemailer (local SMTP)
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          } : undefined,
        });

        await Promise.all([
          transporter.sendMail(adminMessage),
          transporter.sendMail(customerMessage),
        ]);
        logger.info(`Emails sent via SMTP for submission from ${customerEmail}`);
      }
    } catch (error) {
      logger.error('Error in sendEmails:', error);
      // Don't re-throw - form submission should succeed even if email fails
    }
  }

  /**
   * Get contact submissions (admin only)
   */
  static async getContactSubmissions(filters = {}) {
    try {
      const { page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM contact_submissions WHERE expires_at > NOW()'
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT id, name, email, subject, created_at 
         FROM contact_submissions 
         WHERE expires_at > NOW()
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        submissions: result.rows,
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching contact submissions:', error);
      throw error;
    }
  }

  /**
   * Clean up expired contact submissions (cron job)
   */
  static async cleanupExpiredSubmissions() {
    try {
      const result = await pool.query(
        'DELETE FROM contact_submissions WHERE expires_at <= NOW()'
      );
      logger.info(`Cleaned up ${result.rowCount} expired contact submissions`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning up expired submissions:', error);
      throw error;
    }
  }
}

module.exports = ContactService;
