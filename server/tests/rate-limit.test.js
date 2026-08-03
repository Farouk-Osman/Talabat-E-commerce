const request = require('supertest');
const app = require('../app');

// authLimiter is skipped in tests unless the request opts in via header
// `x-test-ratelimit: on` (see app.js). Its window is 15 min with max 20.
describe('Auth rate limiting', () => {
  test('exceeding authLimiter returns 429', async () => {
    const send = () =>
      request(app)
        .post('/api/v1/auth/login')
        .set('x-test-ratelimit', 'on')
        .send({ email: 'nobody@example.com', password: 'wrongpass' });

    let limited = false;
    // max is 20; go a few over to trip the limiter deterministically.
    for (let i = 0; i < 25; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await send();
      if (res.status === 429) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });
});
