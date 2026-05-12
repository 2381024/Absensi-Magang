const bcrypt = require("bcryptjs");
require("dotenv").config();
const db = require("../db");

(async () => {
  try {
    const hash = await bcrypt.hash("admin123", 10);
    await db.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING",
      ["admin", hash, "admin"]
    );
    console.log("✅ Admin user seeded (username: admin, password: admin123)");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    process.exit(0);
  }
})();