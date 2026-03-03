import { describe, expect, it } from "vitest";
import { logoutUser } from "./use-cases/logout-user";

describe("logoutUser", () => {
  it("invalidates an existing session", async () => {
    const invalidated: string[] = [];

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: (sessionId: string) =>
        sessionId === "session-user-1" ? "user-1" : null,
      invalidateSession: (sessionId: string) => {
        invalidated.push(sessionId);
      },
    };

    await expect(
      logoutUser(
        { sessionId: "session-user-1" },
        {
          sessionService,
        },
      ),
    ).resolves.toBeUndefined();

    expect(invalidated).toEqual(["session-user-1"]);
  });

  it("throws unauthorized when session id is missing", async () => {
    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      logoutUser(
        { sessionId: "" },
        {
          sessionService,
        },
      ),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws unauthorized when session does not exist", async () => {
    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      logoutUser(
        { sessionId: "session-unknown" },
        {
          sessionService,
        },
      ),
    ).rejects.toThrow("Unauthorized");
  });
});
