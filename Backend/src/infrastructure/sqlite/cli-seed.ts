import { SqliteDatabase } from "./sqlite-database";
import { runSqliteMigrations } from "./sqlite-migrations";
import { runSqliteBaselineSeed } from "./sqlite-seed";

const sqlite = new SqliteDatabase();

runSqliteMigrations(sqlite.connection);
const result = runSqliteBaselineSeed(sqlite.connection);

if (!result.seeded) {
  console.log("Baseline seed already present.");
  process.exit(0);
}

console.log("Applied baseline SQLite seed user: alice@example.com");
