# Recipe: Add Database

Add PostgreSQL database support with Drizzle ORM and Neon for data persistence.

## When to Use

- User needs persistent storage for auth, incomes, expenses, goals, or contributions
- Application requires an authenticated backend with SQL queries
- You want to deploy the app with a managed Postgres database

## Prerequisites

- Base app already implemented
- A Postgres database URL available via `.env.local`
- Understanding of your data model and schema

## Environment

Create a `.env.local` file with:

```env
POSTGRES_URL=postgresql://user:password@host:port/database
```

## Setup Steps

### Step 1: Install Dependencies

```bash
npm install drizzle-orm drizzle-kit @neondatabase/serverless
```

### Step 2: Create the Database Files

Existing repository structure already uses these files.

#### `src/db/schema.ts` - Table definitions

```typescript
import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Additional auth and financial tables are defined in this file.
```

#### `src/db/index.ts` - Database client

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.POSTGRES_URL!);

// @ts-ignore
export const db = drizzle(sql, { schema });
```

#### `drizzle.config.ts` - Drizzle configuration

```typescript
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  verbose: true,
});
```

#### `src/db/migrate.ts` - Migration wrapper

```typescript
import { execSync } from "child_process";

export function migrateDb() {
  execSync("npm run db:migrate", { stdio: "inherit" });
}

// Uncomment to run migrations automatically when this module is imported.
// migrateDb();
```

### Step 3: Add Package Scripts

Add or confirm these scripts in `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

### Step 4: Generate and Apply Migrations

```bash
npm run db:generate
npm run db:migrate
```

### Step 5: Commit and Push

```bash
npm run typecheck && npm run lint && git add -A && git commit -m "Add database support" && git push
```

## Usage Examples

Database operations run in server code only.

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const user = await db.select().from(users).where(eq(users.email, "john@example.com"));

await db.insert(users).values({
  id: crypto.randomUUID(),
  email: "john@example.com",
  password: "hashed-password",
});
```

## Notes

- This project uses Neon/Postgres via `@neondatabase/serverless`.
- The current repository does not require `sqlite3`, `better-sqlite3`, or `@types/sqlite3` for database access.
- If you want to move to SQLite later, update `src/db/index.ts`, `drizzle.config.ts`, and the schema imports accordingly.
