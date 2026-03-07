import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// using the file path is enough; the adapter will open it for us
export const db = drizzle("db.sqlite", { schema });