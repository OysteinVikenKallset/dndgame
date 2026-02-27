import { describe, expect, it } from "vitest";
import { getMyProfile } from "./use-cases/get-my-profile";

describe("getMyProfile", () => {
  it("returns user profile for a valid session", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async (userId: string) => {
        if (userId !== "user-1") {
          return null;
        }

        return {
          id: "user-1",
          email: "alice@example.com",
          passwordHash: "hash:password123",
          displayName: "Alice",
        };
      },
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: (sessionId: string) =>
        sessionId === "session-user-1" ? "user-1" : null,
      invalidateSession: () => {},
    };

    await expect(
      getMyProfile(
        {
          sessionId: "session-user-1",
        },
        { userRepository, sessionService },
      ),
    ).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      displayName: "Alice",
    });
  });

  it("throws unauthorized when session is missing", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      getMyProfile(
        {
          sessionId: "",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws unauthorized when session is invalid", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      getMyProfile(
        {
          sessionId: "bad-session",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws unauthorized when session points to unknown user", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "missing-user",
      invalidateSession: () => {},
    };

    await expect(
      getMyProfile(
        {
          sessionId: "session-for-missing-user",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Unauthorized");
  });

  it("returns empty displayName when user has no displayName", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
      }),
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "user-1",
      invalidateSession: () => {},
    };

    await expect(
      getMyProfile(
        {
          sessionId: "session-user-1",
        },
        { userRepository, sessionService },
      ),
    ).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      displayName: "",
    });
  });
});
