const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me — get own profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, role, full_name, nim, major, internship_location, division, field_mentor, internship_status, target_hours, start_date, end_date, profile_photo, created_at, updated_at FROM users WHERE id = $1",
      [req.user.id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/auth/me — update own profile
router.put("/me", authenticate, async (req, res) => {
  try {
    const {
      username,
      email,
      full_name,
      nim,
      major,
      internship_location,
      division,
      field_mentor,
      start_date,
      end_date,
      target_hours,
      profile_photo,
    } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (username !== undefined) {
      updates.push(`username = $${idx++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(email);
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
    if (field_mentor !== undefined) {
      updates.push(`field_mentor = $${idx++}`);
      values.push(field_mentor);
    }
    if (start_date !== undefined) {
      updates.push(`start_date = $${idx++}`);
      values.push(start_date || null);
    }
    if (end_date !== undefined) {
      updates.push(`end_date = $${idx++}`);
      values.push(end_date || null);
    }
    if (target_hours !== undefined) {
      updates.push(`target_hours = $${idx++}`);
      values.push(target_hours);
    }
    if (profile_photo !== undefined) {
      updates.push(`profile_photo = $${idx++}`);
      values.push(profile_photo);
    }

    if (updates.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    updates.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, username, role, full_name, nim, major, internship_location, division, field_mentor, internship_status, target_hours, start_date, end_date, profile_photo, created_at, updated_at`,
      values,
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/change-password
router.post("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [password_hash, userId],
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
