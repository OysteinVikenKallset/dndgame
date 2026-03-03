import type Database from "better-sqlite3";

type MediaAsset = {
  id: string;
  filename: string;
  storedFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdBy: string;
  createdAt: string;
};

type MediaAssetRow = {
  id: string;
  filename: string;
  stored_filename: string;
  mime_type: string;
  size_bytes: number;
  created_by: string;
  created_at: string;
};

function mapRow(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    filename: row.filename,
    storedFilename: row.stored_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export class SqliteMediaRepository {
  constructor(private readonly db: Database.Database) {}

  async create(input: {
    id: string;
    filename: string;
    storedFilename: string;
    mimeType: string;
    sizeBytes: number;
    createdBy: string;
    createdAt: string;
  }): Promise<MediaAsset> {
    this.db
      .prepare(
        `INSERT INTO media_assets (
           id, filename, stored_filename, mime_type, size_bytes, created_by, created_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.id,
        input.filename,
        input.storedFilename,
        input.mimeType,
        input.sizeBytes,
        input.createdBy,
        input.createdAt,
      );

    const row = this.db
      .prepare(
        `SELECT id, filename, stored_filename, mime_type, size_bytes, created_by, created_at
         FROM media_assets
         WHERE id = ?`,
      )
      .get(input.id) as MediaAssetRow | undefined;

    if (!row) {
      throw new Error("Failed to read created media asset");
    }

    return mapRow(row);
  }

  async listLatest(limit = 100): Promise<MediaAsset[]> {
    const normalizedLimit = Math.max(1, Math.min(200, Math.trunc(limit)));

    const rows = this.db
      .prepare(
        `SELECT id, filename, stored_filename, mime_type, size_bytes, created_by, created_at
         FROM media_assets
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .all(normalizedLimit) as MediaAssetRow[];

    return rows.map(mapRow);
  }
}
