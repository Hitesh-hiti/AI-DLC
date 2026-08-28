const ContactService = require('../../services/contactService');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../config/logger');

class ContactController {
  /**
   * POST /api/v1/contact
   * Submit contact form
   */
  static async submitContactForm(req, res, next) {
    try {
      
      const { name, email, subject, message, consent_given } = req.body;

      // Verify consent is given
      if (!consent_given) {
        return sendError(res, null, 400, 'You must consent to our privacy policy');
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await ContactService.submitContactForm(
        { name, email, subject, message, consent_given },
        ipAddress
      );

      return sendSuccess(res, result, 201, 'Thank you for contacting us!');
    } catch (error) {
      logger.error('Error in submitContactForm:', error);
      return sendError(res, error, 500, 'Failed to submit contact form');
    }
  }
}

module.exports = ContactController;
