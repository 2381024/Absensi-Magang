const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const geofenceRoutes = require("./routes/geofences");
const shiftRoutes = require("./routes/shifts");
const companyRoutes = require("./routes/companies");
const reportRoutes = require("./routes/reports");
const settingsRoutes = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/geofences", geofenceRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
