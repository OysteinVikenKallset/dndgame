import type Database from "better-sqlite3";

type SqliteMigration = {
  id: string;
  sql: string;
};

const SQLITE_MIGRATIONS: SqliteMigration[] = [
  {
    id: "0001-initial-schema",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id
      ON sessions(user_id);

      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        locale TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        published_at TEXT,
        created_by TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        version INTEGER NOT NULL,
        content_schema_version INTEGER NOT NULL,
        components_json TEXT,
        body_rich_text TEXT,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_pages_owner
      ON pages(created_by);

      CREATE INDEX IF NOT EXISTS idx_pages_updated_by
      ON pages(updated_by);

      CREATE INDEX IF NOT EXISTS idx_pages_slug_locale
      ON pages(slug, locale);

      CREATE INDEX IF NOT EXISTS idx_pages_updated_at
      ON pages(updated_at);

      CREATE TABLE IF NOT EXISTS publication_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        locale TEXT NOT NULL,
        title TEXT NOT NULL,
        published_at TEXT NOT NULL,
        published_version INTEGER NOT NULL,
        components_json TEXT,
        body_rich_text TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_snapshots_page_id
      ON publication_snapshots(page_id);

      CREATE INDEX IF NOT EXISTS idx_snapshots_slug_locale
      ON publication_snapshots(slug, locale);

      CREATE INDEX IF NOT EXISTS idx_snapshots_published_at
      ON publication_snapshots(published_at);
    `,
  },
  {
    id: "0002-user-role",
    sql: `
      ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'editor';

      UPDATE users
      SET role = 'admin'
      WHERE email = 'alice@example.com';
    `,
  },
  {
    id: "0003-cms-settings",
    sql: `
      CREATE TABLE IF NOT EXISTS cms_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    id: "0004-page-template",
    sql: `
      ALTER TABLE pages
      ADD COLUMN template TEXT NOT NULL DEFAULT 'page'
      CHECK (template IN ('page', 'post'));

      ALTER TABLE publication_snapshots
      ADD COLUMN template TEXT NOT NULL DEFAULT 'page'
      CHECK (template IN ('page', 'post'));

      ALTER TABLE publication_snapshots
      ADD COLUMN created_at TEXT;

      UPDATE publication_snapshots
      SET template = (
            SELECT p.template
            FROM pages p
            WHERE p.id = CAST(SUBSTR(publication_snapshots.page_id, 6) AS INTEGER)
          ),
          created_at = (
            SELECT p.created_at
            FROM pages p
            WHERE p.id = CAST(SUBSTR(publication_snapshots.page_id, 6) AS INTEGER)
          )
      WHERE EXISTS (
            SELECT 1
            FROM pages p
            WHERE p.id = CAST(SUBSTR(publication_snapshots.page_id, 6) AS INTEGER)
          );

      UPDATE publication_snapshots
      SET created_at = published_at
      WHERE created_at IS NULL;
    `,
  },
  {
    id: "0005-page-show-in-nav",
    sql: `
      ALTER TABLE pages
      ADD COLUMN show_in_nav INTEGER NOT NULL DEFAULT 1
      CHECK (show_in_nav IN (0, 1));

      ALTER TABLE publication_snapshots
      ADD COLUMN show_in_nav INTEGER NOT NULL DEFAULT 1
      CHECK (show_in_nav IN (0, 1));

      UPDATE publication_snapshots
      SET show_in_nav = (
            SELECT p.show_in_nav
            FROM pages p
            WHERE p.id = CAST(SUBSTR(publication_snapshots.page_id, 6) AS INTEGER)
          )
      WHERE EXISTS (
            SELECT 1
            FROM pages p
            WHERE p.id = CAST(SUBSTR(publication_snapshots.page_id, 6) AS INTEGER)
          );
    `,
  },
  {
    id: "0006-media-assets",
    sql: `
      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        stored_filename TEXT NOT NULL UNIQUE,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_media_assets_created_at
      ON media_assets(created_at);
    `,
  },
];

function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function getAppliedMigrationIds(db: Database.Database): Set<string> {
  const rows = db
    .prepare(`SELECT id FROM schema_migrations ORDER BY id ASC`)
    .all() as Array<{ id: string }>;

  return new Set(rows.map((row) => row.id));
}

export function getPendingSqliteMigrationIds(db: Database.Database): string[] {
  ensureMigrationsTable(db);
  const appliedIds = getAppliedMigrationIds(db);

  return SQLITE_MIGRATIONS.filter(
    (migration) => !appliedIds.has(migration.id),
  ).map((migration) => migration.id);
}

export function runSqliteMigrations(db: Database.Database): {
  appliedIds: string[];
} {
  ensureMigrationsTable(db);
  const appliedIds = getAppliedMigrationIds(db);
  const migrationsToApply = SQLITE_MIGRATIONS.filter(
    (migration) => !appliedIds.has(migration.id),
  );

  const applyMigration = db.transaction((migration: SqliteMigration) => {
    db.exec(migration.sql);
    db.prepare(
      `INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)`,
    ).run(migration.id, new Date().toISOString());
  });

  for (const migration of migrationsToApply) {
    applyMigration(migration);
  }

  return {
    appliedIds: migrationsToApply.map((migration) => migration.id),
  };
}
