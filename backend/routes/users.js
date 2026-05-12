const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// All routes require auth + admin
router.use(authenticate);
router.use(requireAdmin);

// GET /api/users — list all users
router.get("/", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, role, full_name, nim, major, internship_location, division, internship_status, target_hours, profile_photo, created_at, updated_at FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/:id — get single user
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      "SELECT id, username, role, full_name, nim, major, internship_location, division, internship_status, target_hours, profile_photo, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users — create user
router.post("/", async (req, res) => {
  try {
    const { username, password, role, full_name, nim, major, internship_location, division, internship_status, target_hours, profile_photo } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const existing = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, password_hash, role, full_name, nim, major, internship_location, division, internship_status, target_hours, profile_photo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, username, role, full_name, nim, major, internship_location, division, internship_status, target_hours, profile_photo, created_at, updated_at`,
      [username, password_hash, role || "user", full_name, nim, major, internship_location, division, internship_status || "active", target_hours || 480, profile_photo]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:id — update user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, full_name, nim, major, internship_location, division, internship_status, target_hours, profile_photo } = req.body;

    const existing = await db.query("SELECT id FROM users WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build dynamic update
    const updates = [];
    const values = [];
    let idx = 1;

    if (username !== undefined) {
      updates.push(`username = $${idx++}`);
      values.push(username);
    }
    if (password !== undefined) {
      const password_hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${idx++}`);
      values.push(password_hash);
    }
    if (role !== undefined) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (full_name !== undefined) {
      updates.push(`full_name = $${idx++}`);
      values.push(full_name);
    }
    if (nim !== undefined) {
      updates.push(`nim = $${idx++}`);
      values.push(nim);
    }
    if (major !== undefined) {
      updates.push(`major = $${idx++}`);
      values.push(major);
    }
    if (internship_location !== undefined) {
      updates.push(`internship_location = $${idx++}`);
      values.push(internship_location);
    }
    if (division !== undefined) {
      updates.push(`division = $${idx++}`);
      values.push(division);
    }
    if (internship_status !== undefined) {
      updates.push(`internship_status = $${idx++}`);
      values.push(internship_status);
    }
    if (target_hours !== undefined) {
      updates.push(`target_hours = $${idx++}`);
      values.push(target_hours);
    }
    if (profile_photo !== undefined) {
      updates.push(`profile_photo = $${idx++}`);
      values.push(profile_photo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, username, role, full_name, nim, major, internship_location, division, internship_status, target_hours, profile_photo, created_at, updated_at`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:id — delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;