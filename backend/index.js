const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health-check route
app.get("/api/health", async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({
      status: "ok",
      db: "connected",
      timestamp: result.rows[0].now,
    });
  } catch (err) {
    console.error("Database connection error:", err.message);
    res.status(500).json({
      status: "error",
      db: "disconnected",
      message: err.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});