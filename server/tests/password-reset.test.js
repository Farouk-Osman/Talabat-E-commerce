const request = require('supertest');
const app = require('../app');

// In non-production the reset code is returned in the response body (no mailer),
// which makes the full flow testable end-to-end.
describe('Password reset flow', () => {
  const password = 'passw0rd1';
  const newPassword = 'newpassw0rd2';

  async function signup(email) {
    return request(app)
      .post('/api/v1/auth/signup')
      .send({ name: 'Reset User', email, password });
  }

  test('forgot → verify → reset → login with new password', async () => {
    const email = `reset+${Date.now()}@example.com`;
    await signup(email);

    const forgot = await request(app)
      .post('/api/v1/auth/forgotPassword')
      .send({ email });
    expect(forgot.status).toBe(200);
    expect(forgot.body).toHaveProperty('resetCode');
    const { resetCode } = forgot.body;

    const verify = await request(app)
      .post('/api/v1/auth/verifyResetCode')
      .send({ resetCode });
    expect(verify.status).toBe(200);

    const reset = await request(app)
      .put('/api/v1/auth/resetPassword')
      .send({ email, newPassword });
    expect(reset.status).toBe(200);
    expect(reset.body).toHaveProperty('token');

    // old password no longer works
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });
    expect(oldLogin.status).toBe(401);

    // new password works
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword });
    expect(newLogin.status).toBe(200);
  });

  test('resetPassword fails if code was never verified', async () => {
    const email = `reset-unverified+${Date.now()}@example.com`;
    await signup(email);
    await request(app).post('/api/v1/auth/forgotPassword').send({ email });

    const reset = await request(app)
      .put('/api/v1/auth/resetPassword')
      .send({ email, newPassword });
    expect(reset.status).toBe(400);
  });
});
