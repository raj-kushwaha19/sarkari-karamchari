const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 10000 });
      console.log('[DB] ✅ MongoDB connected successfully');
      return;
    } catch (err) {
      console.error(`[DB] ❌ Connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`[DB] Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  console.error('[DB] ❌ All connection attempts failed. Exiting.');
  process.exit(1);
};

module.exports = connectDB;
