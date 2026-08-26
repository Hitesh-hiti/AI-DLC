const { sendSuccess, sendError, sendPaginatedSuccess } = require('../../src/utils/response');

describe('Response Handlers', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('sendSuccess', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };
      sendSuccess(res, data, 200, 'Success');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
      });
    });

    it('should use default status code 200', () => {
      sendSuccess(res, {});

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should use default message', () => {
      sendSuccess(res, {});

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Success',
        })
      );
    });
  });

  describe('sendError', () => {
    it('should return error response', () => {
      const error = new Error('Test error');
      sendError(res, error, 400, 'Bad Request');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bad Request',
        })
      );
    });

    it('should use default status code 500', () => {
      sendError(res, null, undefined, 'Error');

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should use default message', () => {
      sendError(res, null);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An error occurred',
        })
      );
    });
  });

  describe('sendPaginatedSuccess', () => {
    it('should return paginated response with data and pagination', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { total: 100, page: 1, limit: 20, total_pages: 5 };

      sendPaginatedSuccess(res, data, pagination, 200, 'Success');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
        pagination,
      });
    });

    it('should include pagination metadata', () => {
      const pagination = { total: 50, page: 2, limit: 10, total_pages: 5 };
      sendPaginatedSuccess(res, [], pagination);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination,
        })
      );
    });
  });
});
