const request = require('supertest');
const app = require('../app');
const userModel = require('../models/userModel');

// Signs up a user, promotes them to admin in the DB, and returns a login token.
async function makeAdminToken() {
  const email = `admin+${Date.now()}-${Math.round(process.hrtime()[1])}@example.com`;
  const password = 'passw0rd1';
  await request(app)
    .post('/api/v1/auth/signup')
    .send({ name: 'Admin', email, password });
  await userModel.findOneAndUpdate({ email }, { role: 'admin' });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return login.body.token;
}

describe('Auth protection', () => {
  test('protected route denies unauthenticated requests', async () => {
    const res = await request(app).post('/api/v1/brands').send({ name: 'X' });
    expect(res.status).toBe(401);
  });

  test('admin can access protected route after promotion', async () => {
    const token = await makeAdminToken();
    const res = await request(app)
      .post('/api/v1/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Admin Brand' });
    expect([200, 201, 204]).toContain(res.status);
  });
});
