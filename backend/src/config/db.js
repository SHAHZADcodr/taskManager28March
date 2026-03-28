import dotenv from "dotenv";
dotenv.config(); // ← load .env BEFORE pool is created

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: { rejectUnauthorized: false },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅  PostgreSQL connected");
  release();
});

export default pool;
