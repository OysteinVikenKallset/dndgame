import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const defaultDbPath = "Backend/data/cms.sqlite";
const dbPath = resolve(
  process.cwd(),
  process.env.SQLITE_DB_PATH ?? defaultDbPath,
);
const sourceArg = process.argv[2];

if (!sourceArg) {
  console.error("Usage: npm run db:restore -- <path-to-backup.sqlite>");
  process.exit(1);
}

const sourcePath = resolve(process.cwd(), sourceArg);

if (!existsSync(sourcePath)) {
  console.error(`Backup file not found: ${sourcePath}`);
  process.exit(1);
}

if (!existsSync(dirname(dbPath))) {
  console.error(`Target directory does not exist: ${dirname(dbPath)}`);
  process.exit(1);
}

copyFileSync(sourcePath, dbPath);

console.log(`Database restored:`);
console.log(`- Source: ${sourcePath}`);
console.log(`- Target: ${dbPath}`);
console.log("Remember to restart backend if it is running.");
