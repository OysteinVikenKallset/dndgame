import type { SessionService } from "../../application/ports/auth";

export class InMemorySessionService implements SessionService {
  private readonly sessions = new Map<string, string>();

  createSession(userId: string): string {
    const sessionId = `session-${userId}`;
    this.sessions.set(sessionId, userId);
    return sessionId;
  }

  getUserId(sessionId: string): string | null {
    return this.sessions.get(sessionId) ?? null;
  }

  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
