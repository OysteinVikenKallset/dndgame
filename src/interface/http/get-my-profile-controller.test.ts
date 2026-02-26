import { describe, expect, it } from "vitest";
import { handleGetMyProfileRequest } from "./get-my-profile-controller";

describe("handleGetMyProfileRequest", () => {
  it("returns 200 with profile for valid session cookie", async () => {
    const response = await handleGetMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash:password123",
            displayName: "Alice",
          }),
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: (sessionId) =>
            sessionId === "session-user-1" ? "user-1" : null,
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          id: "user-1",
          email: "alice@example.com",
          displayName: "Alice",
        },
      },
    });
  });

  it("returns 401 when cookie header is missing", async () => {
    const response = await handleGetMyProfileRequest(
      {
        headers: {},
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
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
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      },
    });
  });

  it("returns 401 when session cookie is missing", async () => {
    const response = await handleGetMyProfileRequest(
      {
        headers: {
          cookie: "foo=bar",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
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
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      },
    });
  });

  it("returns 500 on unexpected error", async () => {
    const response = await handleGetMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => {
            throw new Error("Database unavailable");
          },
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
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
});
