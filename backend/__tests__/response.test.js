const { successResponse, errorResponse } = require('../utils/response');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe('response helpers', () => {
  test('successResponse wraps data with success:true', () => {
    const res = mockRes();
    successResponse(res, { a: 1 }, 'Done', 201);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ success: true, message: 'Done', data: { a: 1 } });
  });

  test('successResponse defaults to 200', () => {
    const res = mockRes();
    successResponse(res, { x: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('errorResponse sets success:false and status', () => {
    const res = mockRes();
    errorResponse(res, 'Boom', 400);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Boom' });
  });

  test('errorResponse includes errors when provided', () => {
    const res = mockRes();
    errorResponse(res, 'Invalid', 422, [{ field: 'email' }]);
    expect(res.body.errors).toEqual([{ field: 'email' }]);
  });
});
