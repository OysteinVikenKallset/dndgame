import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

const DEFAULT_DB_PATH = "Backend/data/cms.sqlite";

export class SqliteDatabase {
  private readonly db: Database.Database;

  constructor(databasePath = process.env["SQLITE_DB_PATH"] ?? DEFAULT_DB_PATH) {
    const resolvedPath = resolve(process.cwd(), databasePath);
    mkdirSync(dirname(resolvedPath), { recursive: true });

    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  get connection(): Database.Database {
    return this.db;
  }
}
