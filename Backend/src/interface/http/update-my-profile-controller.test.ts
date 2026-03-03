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
          role: "admin",
          email: "alice-admin@example.com",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          updateProfile: async () => ({
            id: "user-1",
            email: "alice-admin@example.com",
            passwordHash: "hash:password123",
            role: "admin",
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
          email: "alice-admin@example.com",
          role: "admin",
          displayName: "Alice Liddell",
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
          randomField: "abc",
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

  it("returns 400 when role is invalid", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          role: "superadmin",
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

  it("returns 400 when email is not a string", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          email: 42,
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

    expect(response.status).toBe(400);
  });

  it("returns 400 when avatarUrl is not a string", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          avatarUrl: 42,
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

    expect(response.status).toBe(400);
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

  it("returns 409 when email already exists", async () => {
    const response = await handleUpdateMyProfileRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        body: {
          email: "taken@example.com",
        },
      },
      {
        userRepository: {
          findByEmail: async () => ({
            id: "user-2",
            email: "taken@example.com",
            passwordHash: "hash",
            role: "editor",
          }),
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
      status: 409,
      body: {
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email already exists",
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
            throw new Error("db down");
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
