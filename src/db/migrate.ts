// simple wrapper that invokes the CLI; you can also run `npm run db:migrate` directly
import { execSync } from "child_process";

// run migrations synchronously and print output
export function migrateDb() {
  execSync("npm run db:migrate", { stdio: "inherit" });
}

// uncomment the line below if you want migrations to execute automatically
// when this module is imported (e.g. in your server entrypoint).
// migrateDb();
