import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { createCsrfToken, hasValidCsrfToken } from "./csrf-token";

const CSRF_TOKEN_SECRET_ENV_KEY = "CSRF_TOKEN_SECRET";

describe("csrf-token", () => {
  it("creates token with default secret when env secret is not set", () => {
    const previousSecret = process.env[CSRF_TOKEN_SECRET_ENV_KEY];
    delete process.env[CSRF_TOKEN_SECRET_ENV_KEY];

    const token = createCsrfToken("session-user-1");

    expect(token).toBe(
      createHmac("sha256", "local-dev-csrf-secret")
        .update("session-user-1")
        .digest("base64url"),
    );

    if (previousSecret) {
      process.env[CSRF_TOKEN_SECRET_ENV_KEY] = previousSecret;
    }
  });

  it("creates token with configured secret", () => {
    const previousSecret = process.env[CSRF_TOKEN_SECRET_ENV_KEY];
    process.env[CSRF_TOKEN_SECRET_ENV_KEY] = "my-custom-secret";

    const token = createCsrfToken("session-user-2");

    expect(token).toBe(
      createHmac("sha256", "my-custom-secret")
        .update("session-user-2")
        .digest("base64url"),
    );

    if (previousSecret) {
      process.env[CSRF_TOKEN_SECRET_ENV_KEY] = previousSecret;
      return;
    }

    delete process.env[CSRF_TOKEN_SECRET_ENV_KEY];
  });

  it("validates matching token", () => {
    const token = createCsrfToken("session-user-3");

    expect(
      hasValidCsrfToken({
        sessionId: "session-user-3",
        providedToken: token,
      }),
    ).toBe(true);
  });

  it("returns false for missing input values and mismatched token", () => {
    const token = createCsrfToken("session-user-4");

    expect(
      hasValidCsrfToken({
        sessionId: "session-user-4",
      }),
    ).toBe(false);

    expect(
      hasValidCsrfToken({
        sessionId: "",
        providedToken: token,
      }),
    ).toBe(false);

    expect(
      hasValidCsrfToken({
        sessionId: "session-user-4",
        providedToken: "",
      }),
    ).toBe(false);

    expect(
      hasValidCsrfToken({
        sessionId: "session-user-4",
        providedToken: "bad-token",
      }),
    ).toBe(false);
  });
});
