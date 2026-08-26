const ContentService = require('../../services/contentService');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../config/logger');

class ContentController {
  /**
   * GET /api/v1/content/:page
   * Get static content for a page
   */
  static async getPageContent(req, res, next) {
    try {
      const { page } = req.params;

      const validPages = ['our_story', 'contact_information'];
      if (!validPages.includes(page)) {
        return sendError(res, null, 404, 'Page not found');
      }

      const content = await ContentService.getContentByPage(page);

      if (Object.keys(content).length === 0) {
        return sendError(res, null, 404, 'Content not found for this page');
      }

      return sendSuccess(res, { page, sections: content }, 200, 'Content retrieved successfully');
    } catch (error) {
      logger.error('Error in getPageContent:', error);
      return sendError(res, error, 500, 'Failed to retrieve content');
    }
  }
}

module.exports = ContentController;
