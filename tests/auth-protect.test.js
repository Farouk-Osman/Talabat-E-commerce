const request = require('supertest');
const mongoose = require('mongoose');
const { setTimeout: wait } = require('timers/promises');
const { app, server } = require('../server');
const userModel = require('../models/userModel');

describe('Auth protection', () => {
  beforeAll(async () => {
    // ensure DB connection established by server
    await wait(500);
  });

  afterAll(async () => {
    // cleanup created users
    await userModel.deleteMany({ email: /smoke-protect/ });
    await mongoose.disconnect();
    if (server && server.close) server.close();
  });

  test('protected route denies unauthenticated requests', async () => {
    const res = await request(app).post('/api/v1/brands').send({ name: 'X' });
    expect(res.status).toBe(401);
  });

  test('admin can access protected route after promotion', async () => {
    const email = `smoke-protect+${  Date.now()  }@example.com`;
    // signup
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'Protect User',
      email,
      password: 'passw0rd1',
    });
    expect(signup.status).toBe(201);
    // promote to admin directly in DB
    const u = await userModel.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    expect(u.role).toBe('admin');
    // login to get token
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'passw0rd1' });
    expect(login.status).toBe(200);
    const {token} = login.body;
    // call protected endpoint
    const res = await request(app).post('/api/v1/brands').set('Authorization', `Bearer ${token}`).send({ name: 'Admin Brand' });
    expect([200,201,204]).toContain(res.status);
  }, 20000);
});
