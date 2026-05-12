const express = require("express");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

async function ensureGeofenceSettingExists() {
  const result = await db.query("SELECT value FROM settings WHERE key = $1", ["geofence_enabled"]);
  if (result.rows.length === 0) {
    await db.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO NOTHING`,
      ["geofence_enabled", JSON.stringify({ enabled: true })]
    );
    return { enabled: true };
  }
  const value = result.rows[0].value || {};
  return { enabled: value.enabled !== undefined ? value.enabled : true };
}

// GET /api/settings/geofence - returns geofence enforcement toggle
router.get("/geofence", async (_req, res) => {
  try {
    const setting = await ensureGeofenceSettingExists();
    res.json(setting);
  } catch (err) {
    console.error("Get geofence setting error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/settings/geofence - update geofence enforcement toggle (admin only)
router.put("/geofence", requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "'enabled' boolean is required" });
    }

    await db.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()` ,
      ["geofence_enabled", JSON.stringify({ enabled })]
    );

    res.json({ enabled });
  } catch (err) {
    console.error("Update geofence setting error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
