const SESSION_COOKIE_NAME = "sessionId";

export function extractSessionId(cookieHeader?: string): string {
  if (!cookieHeader) {
    return "";
  }

  const entries = cookieHeader.split(";");

  for (const entry of entries) {
    const [name, value] = entry.trim().split("=");

    if (name === SESSION_COOKIE_NAME && value) {
      return value;
    }
  }

  return "";
}

export function buildSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax`;
}

export function buildClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
