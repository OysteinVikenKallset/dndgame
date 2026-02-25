import { describe, expect, it } from "vitest";
import { add, loginViaHttp } from "./index";

describe("add", () => {
  it("returns sum of two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});

describe("loginViaHttp", () => {
  it("returns 200 and user payload for valid credentials", async () => {
    const response = await loginViaHttp("alice@example.com", "password123");

    expect(response).toEqual({
      status: 200,
      body: {
        user: {
          id: "user-1",
          email: "alice@example.com",
          displayName: "",
        },
      },
      setCookie: "sessionId=session-user-1; Path=/; HttpOnly; SameSite=Lax",
    });
  });
});
