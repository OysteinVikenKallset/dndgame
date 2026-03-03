import type Database from "better-sqlite3";

export function runSqliteBaselineSeed(db: Database.Database): {
  seeded: boolean;
} {
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("alice@example.com") as { id: string } | undefined;

  if (existing) {
    return { seeded: false };
  }

  db.prepare(
    `INSERT INTO users (id, email, password_hash, role, display_name)
      VALUES (?, ?, ?, ?, ?)`,
  ).run("user-1", "alice@example.com", "hash:password123", "admin", "");

  return { seeded: true };
}
