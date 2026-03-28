import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD?.trim(),
  database: process.env.DB_NAME || "taskmanager",
});

console.log("Password length:", process.env.DB_PASSWORD?.length);
export default pool;
