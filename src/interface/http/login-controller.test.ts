import { describe, expect, it } from "vitest";
import { handleLoginRequest } from "./login-controller";

describe("handleLoginRequest", () => {
  it("returns 200 with user and session cookie for valid credentials", async () => {
    const response = await handleLoginRequest(
      {
        body: {
          email: "alice@example.com",
          password: "password123",
        },
      },
      {
        userRepository: {
          findByEmail: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash:password123",
          }),
          findById: async () => null,
        },
        passwordHasher: {
          compare: async (password, hash) => hash === `hash:${password}`,
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => null,
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          user: {
            id: "user-1",
            email: "alice@example.com",
            displayName: "",
          },
        },
      },
      setCookie: "sessionId=session-user-1; Path=/; HttpOnly; SameSite=Lax",
    });
  });

  it("returns 401 for invalid credentials", async () => {
    const response = await handleLoginRequest(
      {
        body: {
          email: "alice@example.com",
          password: "wrong",
        },
      },
      {
        userRepository: {
          findByEmail: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash:password123",
          }),
          findById: async () => null,
        },
        passwordHasher: {
          compare: async () => false,
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => null,
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 401,
      body: {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid credentials",
        },
      },
    });
  });

  it("returns 500 when an unexpected error occurs", async () => {
    const response = await handleLoginRequest(
      {
        body: {
          email: "alice@example.com",
          password: "password123",
        },
      },
      {
        userRepository: {
          findByEmail: async () => {
            throw new Error("Database unavailable");
          },
          findById: async () => null,
        },
        passwordHasher: {
          compare: async () => true,
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => null,
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 500,
      body: {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      },
    });
  });

  it("returns 400 for invalid login input", async () => {
    const response = await handleLoginRequest(
      {
        body: {
          email: "invalid-email",
          password: "",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
        },
        passwordHasher: {
          compare: async () => true,
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => null,
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 400,
      body: {
        error: {
          code: "INVALID_LOGIN_INPUT",
          message: "Invalid login input",
        },
      },
    });
  });
});
