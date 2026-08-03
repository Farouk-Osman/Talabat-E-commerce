// Hermetic DB lifecycle: an in-memory MongoDB replaces any real DB_URI.
// Tests import `../app` (which never calls mongoose.connect itself), and this
// file owns the single connection for the whole worker.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  // Clear every collection between tests so cases stay isolated.
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
