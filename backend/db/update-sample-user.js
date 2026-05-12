require('dotenv').config();
const db = require('../db');

(async () => {
  try {
    const result = await db.query(
      `UPDATE users 
       SET full_name = $1, nim = $2, major = $3, internship_location = $4, division = $5, internship_status = $6, target_hours = $7
       WHERE username = $8
       RETURNING id, username, full_name, nim, major, internship_location, division, internship_status, target_hours`,
      ['Andrew Pratama', '2024001', 'Teknik Informatika', 'PT Teknologi Indonesia', 'Software Development', 'active', 480, 'andrew']
    );
    console.log('User updated:', JSON.stringify(result.rows[0], null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
