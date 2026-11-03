const mongoose = require('mongoose');

// Every model registers on this default connection, so setting dbName here
// guarantees all collections live in the same Atlas database.
mongoose.connection.on('error', (error) => {
  console.error(`[db] Connection error: ${error.message}`);
});
mongoose.connection.on('disconnected', () => {
  console.warn('[db] MongoDB disconnected.');
});
mongoose.connection.on('reconnected', () => {
  console.log('[db] MongoDB reconnected.');
});

/**
 * Connect to MongoDB using MONGODB_URI from the environment (loaded via
 * dotenv in src/server.js). Always uses the `codetrack` database regardless
 * of any db name embedded in the URI.
 * Retries a few times so the API can survive brief Atlas outages at boot.
 */
async function connectDB(retries = 5, delayMs = 5000) {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Add it to your .env file (see .env.example).');
  }

  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        dbName: 'codetrack', // task: always persist to the codetrack database
      });
      console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
      return mongoose.connection;
    } catch (error) {
      console.error(`[db] Connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

async function disconnectDB() {
  await mongoose.connection.close();
}

module.exports = { connectDB, disconnectDB };
