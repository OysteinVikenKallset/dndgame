import { describe, expect, it } from "vitest";
import { loginUser } from "./use-cases/login-user";

describe("loginUser", () => {
  it("returns user and session id for valid credentials", async () => {
    const userRepository = {
      findByEmail: async (email: string) => {
        if (email !== "alice@example.com") {
          return null;
        }

        return {
          id: "user-1",
          email: "alice@example.com",
          passwordHash: "hash:password123",
        };
      },
      findById: async () => null,
    };

    const passwordHasher = {
      compare: async (password: string, hash: string) =>
        hash === `hash:${password}`,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => null,
      invalidateSession: () => {},
    };

    const result = await loginUser(
      {
        email: "alice@example.com",
        password: "password123",
      },
      { userRepository, passwordHasher, sessionService },
    );

    expect(result).toEqual({
      sessionId: "session-user-1",
      user: {
        id: "user-1",
        email: "alice@example.com",
        displayName: "",
      },
    });
  });

  it("returns user and session id when email uses uppercase characters", async () => {
    const userRepository = {
      findByEmail: async (email: string) => {
        if (email !== "alice@example.com") {
          return null;
        }

        return {
          id: "user-1",
          email: "alice@example.com",
          passwordHash: "hash:password123",
        };
      },
      findById: async () => null,
    };

    const passwordHasher = {
      compare: async (password: string, hash: string) =>
        hash === `hash:${password}`,
    };

    const sessionService = {
      createSession: (userId: string) => `session-${userId}`,
      getUserId: () => null,
      invalidateSession: () => {},
    };

    const result = await loginUser(
      {
        email: "ALICE@EXAMPLE.COM",
        password: "password123",
      },
      { userRepository, passwordHasher, sessionService },
    );

    expect(result).toEqual({
      sessionId: "session-user-1",
      user: {
        id: "user-1",
        email: "alice@example.com",
        displayName: "",
      },
    });
  });

  it("throws invalid credentials when user is not found", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
    };

    const passwordHasher = {
      compare: async () => true,
    };

    const sessionService = {
      createSession: () => "session-user-1",
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      loginUser(
        {
          email: "missing@example.com",
          password: "password123",
        },
        { userRepository, passwordHasher, sessionService },
      ),
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws invalid credentials when password is wrong", async () => {
    const userRepository = {
      findByEmail: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
      }),
      findById: async () => null,
    };

    const passwordHasher = {
      compare: async () => false,
    };

    const sessionService = {
      createSession: () => "session-user-1",
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      loginUser(
        {
          email: "alice@example.com",
          password: "wrong-password",
        },
        { userRepository, passwordHasher, sessionService },
      ),
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws invalid login input for invalid email format", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
    };

    const passwordHasher = {
      compare: async () => true,
    };

    const sessionService = {
      createSession: () => "session-user-1",
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      loginUser(
        {
          email: "invalid-email",
          password: "password123",
        },
        { userRepository, passwordHasher, sessionService },
      ),
    ).rejects.toThrow("Invalid login input");
  });

  it("throws invalid login input for empty password", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
    };

    const passwordHasher = {
      compare: async () => true,
    };

    const sessionService = {
      createSession: () => "session-user-1",
      getUserId: () => null,
      invalidateSession: () => {},
    };

    await expect(
      loginUser(
        {
          email: "alice@example.com",
          password: "",
        },
        { userRepository, passwordHasher, sessionService },
      ),
    ).rejects.toThrow("Invalid login input");
  });
});
