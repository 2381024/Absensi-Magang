const express = require("express");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

// Haversine formula — returns distance in meters between two lat/lng points
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/shifts/start — start a shift with geofence validation
router.post("/start", async (req, res) => {
  try {
    const { latitude, longitude, attendance_type } = req.body;
    const userId = req.user.id;

    if (latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ message: "latitude and longitude are required" });
    }

    // Check if user already has an active shift
    const activeShift = await db.query(
      "SELECT id FROM shifts WHERE user_id = $1 AND status = 'active'",
      [userId],
    );
    if (activeShift.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "You already have an active shift" });
    }

    // Validate location against all geofences (skip for izin/sakit/alpha)
    let matchedGeofence = null;
    if (attendance_type === "hadir" || !attendance_type) {
      // Check if geofence enforcement is enabled
      const settingRes = await db.query(
        "SELECT value FROM settings WHERE key = 'geofence_enabled'",
      );
      const geofenceEnabled =
        settingRes.rows.length > 0
          ? settingRes.rows[0].value?.enabled !== false
          : true;

      if (geofenceEnabled) {
        const geofences = await db.query("SELECT * FROM geofences");
        for (const gf of geofences.rows) {
          const distance = haversineDistance(
            latitude,
            longitude,
            gf.latitude,
            gf.longitude,
          );
          if (distance <= gf.radius_meters) {
            matchedGeofence = gf;
            break;
          }
        }

        if (geofences.rows.length > 0 && !matchedGeofence) {
          return res
            .status(403)
            .json({ message: "You are outside the designated area" });
        }
      }
    }

    const result = await db.query(
      `INSERT INTO shifts (user_id, geofence_id, start_lat, start_lng, attendance_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        matchedGeofence ? matchedGeofence.id : null,
        latitude,
        longitude,
        attendance_type || "hadir",
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Start shift error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/shifts/active/end — end the currently active shift
router.put("/active/end", async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    const activeShift = await db.query(
      "SELECT * FROM shifts WHERE user_id = $1 AND status = 'active'",
      [userId],
    );

    if (activeShift.rows.length === 0) {
      return res.status(404).json({ message: "No active shift found" });
    }

    const result = await db.query(
      `UPDATE shifts
       SET status = 'ended', end_time = NOW(), end_lat = $1, end_lng = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [latitude || null, longitude || null, activeShift.rows[0].id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("End shift error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/shifts/active — get the currently active shift
router.get("/active", async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      "SELECT * FROM shifts WHERE user_id = $1 AND status = 'active'",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get active shift error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/shifts — list shifts (own for user, all/filtered for admin)
router.get("/", async (req, res) => {
  try {
    const { userId, status } = req.query;
    const isAdmin = req.user.role === "admin";

    let query =
      "SELECT s.*, u.username FROM shifts s JOIN users u ON s.user_id = u.id";
    const conditions = [];
    const values = [];
    let idx = 1;

    if (isAdmin && userId) {
      conditions.push(`s.user_id = $${idx++}`);
      values.push(userId);
    } else if (!isAdmin) {
      conditions.push(`s.user_id = $${idx++}`);
      values.push(req.user.id);
    }

    if (status) {
      conditions.push(`s.status = $${idx++}`);
      values.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY s.start_time DESC";

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Get shifts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/shifts/:id — get single shift detail
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === "admin";

    let query =
      "SELECT s.*, u.username FROM shifts s JOIN users u ON s.user_id = u.id WHERE s.id = $1";
    const values = [id];

    if (!isAdmin) {
      query += " AND s.user_id = $2";
      values.push(req.user.id);
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Shift not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get shift error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/shifts/:id — update shift description
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const isAdmin = req.user.role === "admin";

    let query = "SELECT * FROM shifts WHERE id = $1";
    const checkValues = [id];

    if (!isAdmin) {
      query += " AND user_id = $2";
      checkValues.push(req.user.id);
    }

    const existing = await db.query(query, checkValues);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const result = await db.query(
      `UPDATE shifts SET description = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [description, id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update shift error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/shifts/:id — admin only
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM shifts WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Shift not found" });
    }

    res.json({ message: "Shift deleted successfully" });
  } catch (err) {
    console.error("Delete shift error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
