import { describe, expect, it } from "vitest";
import { InMemorySessionService } from "./in-memory-session-service";

describe("InMemorySessionService", () => {
  it("creates a session and resolves user id", () => {
    const service = new InMemorySessionService();

    const sessionId = service.createSession("user-1");

    expect(sessionId).toBe("session-user-1");
    expect(service.getUserId("session-user-1")).toBe("user-1");
  });

  it("returns null for unknown session", () => {
    const service = new InMemorySessionService();

    expect(service.getUserId("session-unknown")).toBeNull();
  });

  it("invalidates existing session", () => {
    const service = new InMemorySessionService();

    service.createSession("user-1");
    service.invalidateSession("session-user-1");

    expect(service.getUserId("session-user-1")).toBeNull();
  });
});
