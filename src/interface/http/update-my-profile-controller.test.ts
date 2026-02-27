import { describe, expect, it } from "vitest";
import { handleUpdateMyProfileRequest } from "./update-my-profile-controller";

describe("handleUpdateMyProfileRequest", () => {
  it("returns 200 with updated profile for valid request", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          displayName: "Alice Liddell",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          updateProfile: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash:password123",
            displayName: "Alice Liddell",
          }),
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
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
          displayName: "Alice Liddell",
        },
      },
    });
  });

  it("returns 200 with updated profile when avatarUrl is provided", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          avatarUrl: "https://example.com/avatar.png",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          updateProfile: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash:password123",
            displayName: "Alice",
            avatarUrl: "https://example.com/avatar.png",
          }),
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
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
          avatarUrl: "https://example.com/avatar.png",
        },
      },
    });
  });

  it("returns 400 for unknown fields in request body", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          role: "admin",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          updateProfile: async () => null,
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 400,
      body: {
        error: {
          code: "INVALID_UPDATE_PROFILE_INPUT",
          message: "Invalid update profile input",
        },
      },
    });
  });

  it("returns 401 for missing or invalid session", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {},
        body: {
          displayName: "Alice",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          updateProfile: async () => null,
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

  it("returns 400 when avatarUrl is not a string", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          avatarUrl: 123,
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          updateProfile: async () => null,
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 400,
      body: {
        error: {
          code: "INVALID_UPDATE_PROFILE_INPUT",
          message: "Invalid update profile input",
        },
      },
    });
  });

  it("returns 400 when no updatable fields are provided", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {},
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          updateProfile: async () => null,
        },
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 400,
      body: {
        error: {
          code: "INVALID_UPDATE_PROFILE_INPUT",
          message: "Invalid update profile input",
        },
      },
    });
  });

  it("returns 500 on unexpected error", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          displayName: "Alice",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          updateProfile: async () => {
            throw new Error("db unavailable");
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
