const express = require("express");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /api/companies — list all companies
router.get("/", async (_req, res) => {
  try {
    const result = await db.query("SELECT * FROM companies ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    console.error("Get companies error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/companies/:id — get single company
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM companies WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get company error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/companies — create a new company
router.post("/", async (req, res) => {
  try {
    const { name, address, contact_person, contact_email, contact_phone, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const result = await db.query(
      `INSERT INTO companies (name, address, contact_person, contact_email, contact_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, address, contact_person, contact_email, contact_phone, status || "active"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create company error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/companies/:id — update a company
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contact_person, contact_email, contact_phone, status } = req.body;

    const existing = await db.query("SELECT id FROM companies WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (address !== undefined) {
      updates.push(`address = $${idx++}`);
      values.push(address);
    }
    if (contact_person !== undefined) {
      updates.push(`contact_person = $${idx++}`);
      values.push(contact_person);
    }
    if (contact_email !== undefined) {
      updates.push(`contact_email = $${idx++}`);
      values.push(contact_email);
    }
    if (contact_phone !== undefined) {
      updates.push(`contact_phone = $${idx++}`);
      values.push(contact_phone);
    }
    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE companies SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update company error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/companies/:id — delete a company
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query("DELETE FROM companies WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company deleted successfully" });
  } catch (err) {
    console.error("Delete company error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
