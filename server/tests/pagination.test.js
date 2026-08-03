const request = require('supertest');
const app = require('../app');
const categoryModel = require('../models/categoryModel');

describe('Pagination', () => {
  beforeEach(async () => {
    // seed 25 categories so page math is meaningful
    const cats = Array.from({ length: 25 }, (_, i) => ({
      name: `Category ${i + 1}`,
    }));
    await categoryModel.insertMany(cats);
  });

  test('pagination.numberOfPages is correct', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .query({ limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.pagination.numberOfPages).toBe(3);
    expect(res.body.pagination.currentPage).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  test('results reflects the page size', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .query({ limit: 10, page: 1 });
    expect(res.body.results).toBe(10);
  });

  test('last page has only remaining items', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .query({ limit: 10, page: 3 });
    expect(res.body.results).toBe(5); // 25 % 10
  });

  test('next and prev links are correct', async () => {
    const page2 = await request(app)
      .get('/api/v1/categories')
      .query({ limit: 10, page: 2 });
    expect(page2.body.pagination.prev).toBe(1);
    expect(page2.body.pagination.next).toBe(3);
  });
});
