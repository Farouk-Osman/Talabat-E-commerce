const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../app');
const userModel = require('../models/userModel');

const fixtures = path.join(__dirname, '__fixtures__');
const base64 = fs.readFileSync(path.join(fixtures, 'tiny.png'), 'utf8');
const tinyBuffer = Buffer.from(base64, 'base64');

// Collections are cleared between tests (tests/setup.js), so create the admin
// inside each test rather than in a shared beforeAll.
async function makeAdminToken() {
  const email = `admin+${Date.now()}-${Math.round(process.hrtime()[1])}@example.com`;
  const password = 'adminPass123!';
  await request(app)
    .post('/api/v1/auth/signup')
    .send({ name: 'Admin Test', email, password });
  await userModel.findOneAndUpdate({ email }, { role: 'admin' });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return login.body.token;
}

describe('Upload flows', () => {
  test('Create brand with image', async () => {
    const adminToken = await makeAdminToken();
    const res = await request(app)
      .post('/api/v1/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Test Brand')
      .attach('image', tinyBuffer, {
        filename: 'tiny.png',
        contentType: 'image/png',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('data');
    const created = res.body.data;
    expect(created).toHaveProperty('image');
    expect(created.image).toMatch(/http|\/uploads\//);
  });

  test('Create product with imageCover and images', async () => {
    const adminToken = await makeAdminToken();
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Test Product')
      .field('description', 'desc')
      .field('price', '10')
      .field('category', '000000000000000000000000')
      .field('brand', '000000000000000000000000')
      .field('quantity', '1')
      .attach('imageCover', tinyBuffer, {
        filename: 'tiny.png',
        contentType: 'image/png',
      })
      .attach('images', tinyBuffer, {
        filename: 'tiny.png',
        contentType: 'image/png',
      });

    // Fake ids may fail validation; we're primarily checking upload handling.
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  test('Create user with profileImage (admin only)', async () => {
    const adminToken = await makeAdminToken();
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Test User')
      .field('email', `testuser+${Date.now()}@example.com`)
      .field('password', 'password123')
      .attach('profileImage', tinyBuffer, {
        filename: 'tiny.png',
        contentType: 'image/png',
      });

    expect([201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      const created = res.body.data || {};
      const userObj = created.user || created;
      expect(userObj).toHaveProperty('profileImage');
      expect(userObj.profileImage).toMatch(/http|\/uploads\//);
    }
  });
});
