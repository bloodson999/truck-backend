const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/truckflow";

    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
      console.log("⚠️ No MongoDB URI configured, using local fallback: mongodb://127.0.0.1:27017/truckflow");
    }

    await mongoose.connect(uri);
    console.log("🟢 MongoDB Connected");
  } catch (err) {
    console.log("🔴 MongoDB Error:", err.message);
    if (err.message.includes("ECONNREFUSED")) {
      console.log("   → Check that your MongoDB server is running and the URI is correct.");
      console.log("   → If you want to use Atlas, set MONGO_URI in .env to your cluster URI.");
    }
    process.exit(1);
  }
}

module.exports = connectDB;