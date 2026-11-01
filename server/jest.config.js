/** Jest runs in CommonJS (see jest.config.js). */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // mongodb-memory-server + mongoose need sequential runs against one instance.
  maxWorkers: 1,
  testTimeout: 60000,
  verbose: true,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
};
