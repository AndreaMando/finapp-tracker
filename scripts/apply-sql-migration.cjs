// Applies one hand-written, idempotent SQL file from drizzle/ to POSTGRES_URL.
// Usage: node scripts/apply-sql-migration.cjs drizzle/0004_add_installment_plans.sql
// (drizzle-kit migrate is not used: the journal only knows 0000, 0001-0003 were applied by hand.)
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Pass the SQL file path");
  const sql = neon(process.env.POSTGRES_URL);
  const text = fs.readFileSync(path.resolve(file), "utf8");
  const statements = text
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  for (const stmt of statements) {
    console.log("> " + stmt.split("\n")[0]);
    await sql.query(stmt);
  }
  console.log("done (" + statements.length + " statements)");
}
main().catch((e) => { console.error(e); process.exit(1); });
