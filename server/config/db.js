const mongoose = require("mongoose");

const MAX_ATTEMPTS = 5;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries with exponential backoff, then exits so the host restarts the service
// instead of leaving it running with every DB-backed route failing.
const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
      console.log("MongoDB Connected Successfully");
      return mongoose.connection;
    } catch (error) {
      console.error(`[DB] Connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);
      if (attempt === MAX_ATTEMPTS) {
        console.error("[DB] Giving up; exiting so the process can be restarted.");
        process.exit(1);
      }
      await sleep(Math.min(2000 * 2 ** (attempt - 1), 30000));
    }
  }
};

module.exports = connectDB;
