import { createHmac, timingSafeEqual } from "node:crypto";

const CSRF_SECRET_ENV_KEY = "CSRF_TOKEN_SECRET";
const DEFAULT_CSRF_SECRET = "local-dev-csrf-secret";

function resolveCsrfSecret(): string {
  const fromEnv = process.env[CSRF_SECRET_ENV_KEY]?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  return DEFAULT_CSRF_SECRET;
}

export function createCsrfToken(sessionId: string): string {
  return createHmac("sha256", resolveCsrfSecret())
    .update(sessionId)
    .digest("base64url");
}

export function hasValidCsrfToken(input: {
  sessionId: string;
  providedToken?: string;
}): boolean {
  const providedToken = input.providedToken?.trim() ?? "";

  if (!input.sessionId || !providedToken) {
    return false;
  }

  const expectedToken = createCsrfToken(input.sessionId);

  if (providedToken.length !== expectedToken.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(providedToken),
    Buffer.from(expectedToken),
  );
}
