const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("🟢 MongoDB Connected");
  } catch (err) {
    console.log("🔴 MongoDB Error:", err.message);

    // ❌ STOP SERVER IF DB FAILS
    process.exit(1);
  }
};

module.exports = connectDB;