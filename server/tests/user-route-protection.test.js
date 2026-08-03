const request = require('supertest');
const app = require('../app');
const userModel = require('../models/userModel');

// Creates a normal user and returns { token, email }.
async function makeUser() {
  const email = `plain+${Date.now()}-${Math.round(process.hrtime()[1])}@example.com`;
  const password = 'passw0rd1';
  await request(app)
    .post('/api/v1/auth/signup')
    .send({ name: 'Plain User', email, password });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return { token: login.body.token, email };
}

describe('User route protection', () => {
  test('unauthenticated request to admin list is 401', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  test('non-admin request to admin list is 403', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('authenticated user can read their own profile via /me', async () => {
    const { token, email } = await makeUser();
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
  });

  test('promoted admin can read the user list', async () => {
    const { token, email } = await makeUser();
    await userModel.findOneAndUpdate({ email }, { role: 'admin' });
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
