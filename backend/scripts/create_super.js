const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

const Admin = require("../models/Admin");

const DB_URL = process.env.DB_URL;
if (!DB_URL) {
  console.error("DB_URL not configured in config.env");
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/create_super.js <email> <password>");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const del = await Admin.deleteMany({});
    const a = new Admin({ username: email, email, password, role: "super" });
    await a.save();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
