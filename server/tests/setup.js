/**
 * Shared test bootstrap: connects Jest to an in-memory MongoDB instance so
 * tests run against the real Mongoose models and aggregations without needing
 * a MongoDB Atlas account.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-production';
process.env.CLIENT_URL = 'http://localhost:5173';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

async function connectTestDB() {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri(), { dbName: 'codetrack_test' });
  return memoryServer;
}

async function clearTestDB() {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectTestDB, clearTestDB, closeTestDB };
