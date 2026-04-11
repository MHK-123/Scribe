import pool from './db.js';

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          user_id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          avatar_url TEXT,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migration successful: users table created.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
