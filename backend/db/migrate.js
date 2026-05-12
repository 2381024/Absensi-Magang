const db = require("../db");

async function migrate() {
  console.log("Running migration...");

  try {
    // Add profile_photo column if it doesn't exist
    await db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT`,
    );
    // Add email column
    await db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(200)`,
    );
    // Add field_mentor column
    await db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS field_mentor VARCHAR(200)`,
    );
    // Add start_date and end_date columns
    await db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS start_date DATE`,
    );
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS end_date DATE`);

    // Ensure settings table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Ensure default geofence setting exists
    await db.query(
      `
      INSERT INTO settings (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO NOTHING
    `,
      ["geofence_enabled", JSON.stringify({ enabled: true })],
    );

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
