const express = require("express");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /api/geofences — list all geofences
router.get("/", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM geofences ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get geofences error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/geofences/:id — get single geofence
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM geofences WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Geofence not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get geofence error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/geofences — create a new geofence
router.post("/", async (req, res) => {
  try {
    const { name, latitude, longitude, radius_meters } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "name, latitude, and longitude are required" });
    }

    const result = await db.query(
      `INSERT INTO geofences (name, latitude, longitude, radius_meters)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, latitude, longitude, radius_meters || 100]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create geofence error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/geofences/:id — update a geofence
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, radius_meters } = req.body;

    const existing = await db.query("SELECT id FROM geofences WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Geofence not found" });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (latitude !== undefined) {
      updates.push(`latitude = $${idx++}`);
      values.push(latitude);
    }
    if (longitude !== undefined) {
      updates.push(`longitude = $${idx++}`);
      values.push(longitude);
    }
    if (radius_meters !== undefined) {
      updates.push(`radius_meters = $${idx++}`);
      values.push(radius_meters);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE geofences SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update geofence error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/geofences/:id — delete a geofence
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query("DELETE FROM geofences WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Geofence not found" });
    }

    res.json({ message: "Geofence deleted successfully" });
  } catch (err) {
    console.error("Delete geofence error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
