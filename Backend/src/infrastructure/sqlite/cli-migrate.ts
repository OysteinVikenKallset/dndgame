import { SqliteDatabase } from "./sqlite-database";
import {
  getPendingSqliteMigrationIds,
  runSqliteMigrations,
} from "./sqlite-migrations";

const sqlite = new SqliteDatabase();

const pending = getPendingSqliteMigrationIds(sqlite.connection);
const result = runSqliteMigrations(sqlite.connection);

if (pending.length === 0) {
  console.log("No pending SQLite migrations.");
  process.exit(0);
}

console.log("Applied SQLite migrations:");
for (const migrationId of result.appliedIds) {
  console.log(`- ${migrationId}`);
}
