import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function connectDB() {
  try {
    await db.query("select 1");
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }
}
