import { describe, expect, it } from "vitest";
import { updateMyProfile } from "./use-cases/update-my-profile";

describe("updateMyProfile", () => {
  it("updates profile with valid session and displayName", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
        displayName: "Alice Liddell",
      }),
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "user-1",
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "session-user-1",
          displayName: "Alice Liddell",
        },
        { userRepository, sessionService },
      ),
    ).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      displayName: "Alice Liddell",
    });
  });

  it("updates profile with avatarUrl", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
        displayName: "Alice",
        avatarUrl: "https://example.com/avatar.png",
      }),
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "user-1",
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "session-user-1",
          avatarUrl: "https://example.com/avatar.png",
        },
        { userRepository, sessionService },
      ),
    ).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      displayName: "Alice",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("throws unauthorized when session is missing", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "",
          displayName: "Alice",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws unauthorized when session is invalid", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "session-invalid",
          displayName: "Alice",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws invalid input when no updatable fields are provided", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "user-1",
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "session-user-1",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Invalid update profile input");
  });

  it("throws invalid input for empty displayName", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "user-1",
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "session-user-1",
          displayName: "   ",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Invalid update profile input");
  });

  it("throws invalid input for empty avatarUrl", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "user-1",
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "session-user-1",
          avatarUrl: "   ",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Invalid update profile input");
  });

  it("throws unauthorized when repository cannot update user", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => null,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "user-1",
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "session-user-1",
          displayName: "Alice",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Unauthorized");
  });

  it("returns empty displayName when repository yields undefined displayName", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () =>
        ({
          id: "user-1",
          email: "alice@example.com",
          passwordHash: "hash:password123",
          displayName: undefined,
        }) as never,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => "user-1",
      invalidateSession: () => {},
    };

    await expect(
      updateMyProfile(
        {
          sessionId: "session-user-1",
          displayName: "Alice",
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
