# Recipe: Add Database

Add SQLite database support with Drizzle ORM for data persistence.

## When to Use

- User needs to store data (users, posts, comments, etc.)
- Application requires authentication with user accounts
- Any feature requiring persistent state

## Prerequisites

- Base template already set up
- Understanding of the data model needed

## Environment

Database credentials (`DB_URL`, `DB_TOKEN`) are automatically provided by the sandbox environment.

## Setup Steps

### Step 1: Install Dependencies

```bash
# use your preferred package manager; example with npm:
npm install drizzle-orm sqlite3 drizzle-kit
# or bun add drizzle-orm sqlite3 drizzle-kit
```
### Step 2: Create All Required Files

⚠️ **Important**: Create ALL files before running generate. Setup fails if any are missing.

#### `src/db/schema.ts` - Table definitions

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Add more tables as needed
```

#### `src/db/index.ts` - Database client

```typescript
// Example using Drizzle with better-sqlite3; adjust for your driver
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export const db = drizzle("db.sqlite", { schema });
```
#### `src/db/migrate.ts` - Migration script

```typescript
// This file can simply call the CLI or your chosen migration tool
import { execSync } from "child_process";

export function migrateDb() {
  execSync("npm run db:migrate", { stdio: "inherit" });
}

// migrateDb(); // optionally execute on import
```
#### `drizzle.config.ts` - Drizzle configuration (project root)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
});
```

### Step 3: Add Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run src/db/migrate.ts"
  }
}
```

### Step 4: Generate Migrations

```bash
bun db:generate
```

### Step 5: Commit and Push

```bash
bun typecheck && bun lint && git add -A && git commit -m "Add database support" && git push
```

Migrations can be executed with `npm run db:migrate` (or the equivalent for your package manager) whenever you need to apply schema changes.

⚠️ **Run migrations with the CLI** rather than invoking internal scripts directly.
## Usage Examples

Database operations only work in Server Components and Server Actions.

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Select all users
const allUsers = await db.select().from(users);

// Select by ID
const user = await db.select().from(users).where(eq(users.id, 1));

// Insert new user
await db.insert(users).values({ name: "John", email: "john@example.com" });

// Update user
await db.update(users).set({ name: "Jane" }).where(eq(users.id, 1));

// Delete user
await db.delete(users).where(eq(users.id, 1));
```

## Documentation Notes

Once the database integration is in place, update any project documentation to note:

- The tables defined in `src/db/schema.ts`
- New API routes or server actions that use the database
- Dependencies added (`drizzle-orm`, drivers, migration tools)
- Location of database files and migration folder
