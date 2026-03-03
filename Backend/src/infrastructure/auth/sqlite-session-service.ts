import type { SessionService } from "../../application/ports/auth";
import type Database from "better-sqlite3";

function generateSessionId(userId: string): string {
  return `session-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class SqliteSessionService implements SessionService {
  constructor(private readonly db: Database.Database) {}

  createSession(userId: string): string {
    const sessionId = generateSessionId(userId);

    this.db
      .prepare(
        `INSERT INTO sessions (session_id, user_id, created_at)
         VALUES (?, ?, ?)`,
      )
      .run(sessionId, userId, new Date().toISOString());

    return sessionId;
  }

  getUserId(sessionId: string): string | null {
    const row = this.db
      .prepare(
        `SELECT user_id
         FROM sessions
         WHERE session_id = ?`,
      )
      .get(sessionId) as { user_id: string } | undefined;

    return row?.user_id ?? null;
  }

  invalidateSession(sessionId: string): void {
    this.db
      .prepare(
        `DELETE FROM sessions
         WHERE session_id = ?`,
      )
      .run(sessionId);
  }
}
