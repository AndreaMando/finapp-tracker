import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// using the file path is enough; the adapter will open it for us
export const db = drizzle("db.sqlite", { schema });

// ensure our tables exist (simple idempotent SQL, helps when migrations haven't run yet)
const initSql = `
CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY,
  month_key TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  active INTEGER NOT NULL,
  start_month TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS one_time_expenses (
  id TEXT PRIMARY KEY,
  month_key TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL,
  deadline TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS goal_contributions (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  month_key TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
`;
// run initialization immediately; better-sqlite3 doesn't expose exec on the drizzle instance
try {
  initSql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((stmt) => db.run(stmt));
} catch (err) {
  console.error("Failed to initialize database tables:", err);
}
