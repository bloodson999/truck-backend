const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
      console.log("🔴 MongoDB Error: MONGO_URI is missing in environment variables");
      console.log("Available env keys (sample):", Object.keys(process.env).filter(k =>
        ["MONGO_URI", "MONGODB_URI", "NODE_ENV", "RAILWAY_SERVICE_NAME"].includes(k)
      ));
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("🟢 MongoDB Connected");
  } catch (err) {
    console.log("🔴 MongoDB Error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;