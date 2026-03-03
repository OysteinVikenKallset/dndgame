import { describe, expect, it } from "vitest";
import {
  EMAIL_ALREADY_EXISTS_ERROR,
  updateMyProfile,
} from "./use-cases/update-my-profile";

describe("updateMyProfile", () => {
  it("updates profile with valid session and displayName", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
        role: "editor" as const,
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
      role: "editor",
      displayName: "Alice Liddell",
    });
  });

  it("updates profile with role and email", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => ({
        id: "user-1",
        email: "alice-admin@example.com",
        passwordHash: "hash:password123",
        role: "admin" as const,
        displayName: "Alice",
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
          email: " Alice-Admin@Example.com ",
          role: "admin",
        },
        { userRepository, sessionService },
      ),
    ).resolves.toEqual({
      id: "user-1",
      email: "alice-admin@example.com",
      role: "admin",
      displayName: "Alice",
    });
  });

  it("throws email conflict when target email belongs to another user", async () => {
    const userRepository = {
      findByEmail: async () => ({
        id: "user-2",
        email: "taken@example.com",
        passwordHash: "hash:password123",
      }),
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
          email: "taken@example.com",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow(EMAIL_ALREADY_EXISTS_ERROR);
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

  it("throws invalid input for empty email", async () => {
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
          email: "   ",
        },
        { userRepository, sessionService },
      ),
    ).rejects.toThrow("Invalid update profile input");
  });

  it("allows updating email when it belongs to the same user", async () => {
    const userRepository = {
      findByEmail: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash",
        role: "editor" as const,
      }),
      findById: async () => null,
      updateProfile: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash",
        role: "editor" as const,
        displayName: "Alice",
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
          email: "alice@example.com",
        },
        { userRepository, sessionService },
      ),
    ).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      role: "editor",
      displayName: "Alice",
    });
  });

  it("returns avatarUrl when updated profile includes it", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      updateProfile: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash",
        role: "editor" as const,
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
      role: "editor",
      displayName: "Alice",
      avatarUrl: "https://example.com/avatar.png",
    });
  });
});
