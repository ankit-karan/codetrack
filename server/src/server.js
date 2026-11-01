require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('[fatal] JWT_SECRET is not defined. Copy .env.example to .env and set it.');
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (error) {
    console.error(`[fatal] Could not connect to MongoDB: ${error.message}`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] CodeTrack API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start();

// Graceful shutdown on unhandled rejections.
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled rejection:', reason);
});
