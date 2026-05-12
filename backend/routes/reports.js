const express = require("express");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /api/reports/attendance - attendance report
router.get("/attendance", async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let query = `
      SELECT s.*, u.username, u.full_name
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (startDate) {
      query += ` AND s.start_time >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND s.start_time <= $${idx++}`;
      params.push(endDate);
    }
    if (userId) {
      query += ` AND s.user_id = $${idx++}`;
      params.push(userId);
    }

    query += " ORDER BY s.start_time DESC";

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Attendance report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reports/internship-progress - internship progress report
router.get("/internship-progress", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.nim,
        u.major,
        u.internship_location,
        u.division,
        u.target_hours,
        u.internship_status,
        COUNT(s.id) as total_shifts,
        SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600) as total_hours
      FROM users u
      LEFT JOIN shifts s ON u.id = s.user_id AND s.end_time IS NOT NULL AND s.attendance_type = 'hadir'
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.full_name
    `);

    const users = result.rows.map(user => ({
      ...user,
      total_hours: parseFloat(user.total_hours) || 0,
      progress_percent: user.target_hours ? Math.min(100, ((parseFloat(user.total_hours) || 0) / user.target_hours) * 100) : 0,
      remaining_hours: Math.max(0, user.target_hours - (parseFloat(user.total_hours) || 0)),
    }));

    res.json(users);
  } catch (err) {
    console.error("Internship progress report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reports/summary - summary statistics
router.get("/summary", async (req, res) => {
  try {
    const [totalUsers, totalShifts, todayShifts, activeShifts] = await Promise.all([
      db.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'"),
      db.query("SELECT COUNT(*) as count FROM shifts"),
      db.query("SELECT COUNT(*) as count FROM shifts WHERE DATE(start_time) = CURRENT_DATE"),
      db.query("SELECT COUNT(*) as count FROM shifts WHERE status = 'active'"),
    ]);

    const [attendanceStats] = await Promise.all([
      db.query(`
        SELECT 
          attendance_type,
          COUNT(*) as count
        FROM shifts
        WHERE DATE(start_time) = CURRENT_DATE
        GROUP BY attendance_type
      `),
    ]);

    const stats = {
      totalInterns: parseInt(totalUsers.rows[0].count),
      totalShifts: parseInt(totalShifts.rows[0].count),
      todayAttendance: parseInt(todayShifts.rows[0].count),
      activeShifts: parseInt(activeShifts.rows[0].count),
      attendanceByType: {},
    };

    attendanceStats.rows.forEach(stat => {
      stats.attendanceByType[stat.attendance_type] = parseInt(stat.count);
    });

    res.json(stats);
  } catch (err) {
    console.error("Summary report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
