const request = require('supertest');
const app = require('../app');
const userModel = require('../models/userModel');

describe('Signup role escalation', () => {
  test('role in body is ignored — user is always stored as "user"', async () => {
    const email = `escalate+${Date.now()}@example.com`;
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Sneaky',
      email,
      password: 'passw0rd1',
      role: 'admin',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');

    const stored = await userModel.findOne({ email });
    expect(stored.role).toBe('user');
  });
});
