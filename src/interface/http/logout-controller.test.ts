import { describe, expect, it } from "vitest";
import { handleLogoutRequest } from "./logout-controller";

describe("handleLogoutRequest", () => {
  it("returns 204 and clears cookie for valid session", async () => {
    const response = await handleLogoutRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
      },
      {
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: (sessionId) =>
            sessionId === "session-user-1" ? "user-1" : null,
          invalidateSession: () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 204,
      clearCookie: "sessionId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    });
  });

  it("returns 401 for missing session", async () => {
    const response = await handleLogoutRequest(
      {
        headers: {},
      },
      {
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
        error: "Unauthorized",
      },
    });
  });

  it("returns 500 on unexpected error", async () => {
    const response = await handleLogoutRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
      },
      {
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {
            throw new Error("storage unavailable");
          },
        },
      },
    );

    expect(response).toEqual({
      status: 500,
      body: {
        error: "Internal server error",
      },
    });
  });
});
