import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const defaultDbPath = "Backend/data/cms.sqlite";
const dbPath = resolve(
  process.cwd(),
  process.env.SQLITE_DB_PATH ?? defaultDbPath,
);

if (!existsSync(dbPath)) {
  console.error(`SQLite DB not found at: ${dbPath}`);
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");
const backupDir = resolve(process.cwd(), "Backend/data/backups");
mkdirSync(backupDir, { recursive: true });

const backupFilename = `${basename(dbPath, ".sqlite")}-${timestamp}.sqlite`;
const backupPath = resolve(backupDir, backupFilename);

copyFileSync(dbPath, backupPath);

console.log(`Backup created:`);
console.log(`- Source: ${dbPath}`);
console.log(`- Target: ${backupPath}`);
console.log(`- Directory: ${dirname(backupPath)}`);
