import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("CMS HTTP flow", () => {
  it("supports login, create page, publish page, unpublish, and slug update", async () => {
    const port = getUniquePort(3123);
    const baseUrl = `http://127.0.0.1:${port}`;
    const slug = `about-us-flow-${Date.now()}`;

    const serverProcess = spawn("npx", ["tsx", "Backend/src/server.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "development",
      },
    });

    try {
      await waitForServer(baseUrl);

      const loginResponse = await fetchJson(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "alice@example.com",
          password: "password123",
        }),
      });

      const sessionCookie = getSessionCookie(loginResponse.headers);
      expect(loginResponse.status).toBe(200);
      expect(sessionCookie).toContain("sessionId=");

      const meResponse = await fetchJson(`${baseUrl}/api/auth/me`, {
        headers: {
          cookie: sessionCookie,
        },
      });

      expect(meResponse.status).toBe(200);
      const csrfToken = getCsrfTokenFromAuthResponse(meResponse);
      expect(csrfToken).not.toBe("");

      const createResponse = await fetchJson(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: sessionCookie,
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          slug,
          title: "About us",
          locale: "en",
          bodyRichText: "Hello from CMS",
        }),
      });

      expect(createResponse.status).toBe(201);
      expect(createResponse.json).toEqual({
        data: {
          id: expect.any(String),
          slug,
          title: "About us",
          locale: "en",
          status: "DRAFT",
          version: 1,
        },
      });

      const pageId = (createResponse.json as { data: { id: string } }).data.id;

      const publishResponse = await fetchJson(
        `${baseUrl}/api/pages/${pageId}/publish`,
        {
          method: "POST",
          headers: {
            cookie: sessionCookie,
            "x-csrf-token": csrfToken,
          },
        },
      );

      expect(publishResponse.status).toBe(200);
      expect(publishResponse.json).toEqual({
        data: {
          pageId,
          slug,
          locale: "en",
          publishedAt: expect.any(String),
        },
      });

      const publicResponse = await fetchJson(
        `${baseUrl}/api/content/pages/${slug}?locale=en`,
      );

      expect(publicResponse.status).toBe(200);
      expect(publicResponse.headers.get("cache-control")).toBe("no-store");
      expect(publicResponse.json).toEqual({
        data: {
          id: pageId,
          slug,
          locale: "en",
          title: "About us",
          publishedAt: expect.any(String),
          bodyRichText: "Hello from CMS",
        },
      });

      const listResponse = await fetchJson(
        `${baseUrl}/api/content/pages?locale=en&limit=5`,
      );

      expect(listResponse.status).toBe(200);
      expect(listResponse.headers.get("cache-control")).toBe("no-store");

      const listData = asRecord(listResponse.json)?.["data"];
      const listItems = asRecord(listData)?.["items"];

      expect(Array.isArray(listItems)).toBe(true);

      const hasPublishedPage =
        Array.isArray(listItems) &&
        listItems.some(
          (entry) =>
            asRecord(entry)?.["slug"] === slug &&
            asRecord(entry)?.["pageId"] === pageId,
        );

      expect(hasPublishedPage).toBe(true);

      const updateSettingsResponse = await fetchJson(
        `${baseUrl}/api/settings`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            cookie: sessionCookie,
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            homepagePageId: pageId,
            headerMenuAll: true,
            headerMenuPageIds: [],
            footerMenuAll: true,
            footerMenuPageIds: [],
          }),
        },
      );

      expect(updateSettingsResponse.status).toBe(200);
      expect(updateSettingsResponse.json).toEqual({
        data: {
          homepagePageId: pageId,
          headerMenuAll: true,
          headerMenuPageIds: [],
          footerMenuAll: true,
          footerMenuPageIds: [],
        },
      });

      const contentSettingsResponse = await fetchJson(
        `${baseUrl}/api/content/settings?locale=en`,
      );

      expect(contentSettingsResponse.status).toBe(200);
      const contentSettingsData = asRecord(contentSettingsResponse.json)?.[
        "data"
      ];
      expect(asRecord(contentSettingsData)?.["homepageSlug"]).toBe(slug);

      const contentMenu = asRecord(asRecord(contentSettingsData)?.["menu"]);
      const contentHeaderMenu = asRecord(contentMenu?.["header"]);
      const contentFooterMenu = asRecord(contentMenu?.["footer"]);

      expect(contentHeaderMenu?.["all"]).toBe(true);
      expect(contentFooterMenu?.["all"]).toBe(true);

      const contentHeaderSlugs = contentHeaderMenu?.["slugs"];
      const contentFooterSlugs = contentFooterMenu?.["slugs"];

      expect(Array.isArray(contentHeaderSlugs)).toBe(true);
      expect(Array.isArray(contentFooterSlugs)).toBe(true);
      expect((contentHeaderSlugs as unknown[]).includes(slug)).toBe(true);
      expect((contentFooterSlugs as unknown[]).includes(slug)).toBe(true);

      const unpublishResponse = await fetchJson(
        `${baseUrl}/api/pages/${pageId}/unpublish`,
        {
          method: "POST",
          headers: {
            cookie: sessionCookie,
            "x-csrf-token": csrfToken,
          },
        },
      );

      expect(unpublishResponse.status).toBe(200);
      expect(unpublishResponse.json).toEqual({
        data: {
          pageId,
          status: "DRAFT",
          version: expect.any(Number),
        },
      });

      const draftVersion = asRecord(unpublishResponse.json)?.["data"];
      const nextVersion = asRecord(draftVersion)?.["version"];
      expect(typeof nextVersion).toBe("number");

      const renamedSlug = `${slug}-v2`;

      const updateResponse = await fetchJson(`${baseUrl}/api/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: sessionCookie,
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          version: nextVersion,
          slug: renamedSlug,
          title: "About us v2",
          bodyRichText: "Updated after unpublish",
        }),
      });

      expect(updateResponse.status).toBe(200);
      expect(asRecord(updateResponse.json)?.["data"]).toMatchObject({
        id: pageId,
        slug: renamedSlug,
        status: "DRAFT",
      });

      const contentSettingsAfterUnpublish = await fetchJson(
        `${baseUrl}/api/content/settings?locale=en`,
      );

      expect(contentSettingsAfterUnpublish.status).toBe(200);
      const contentSettingsAfterUnpublishData = asRecord(
        contentSettingsAfterUnpublish.json,
      )?.["data"];
      expect(
        asRecord(contentSettingsAfterUnpublishData)?.["homepageSlug"],
      ).toBe(null);

      const contentMenuAfterUnpublish = asRecord(
        asRecord(contentSettingsAfterUnpublishData)?.["menu"],
      );
      const contentHeaderAfterUnpublish = asRecord(
        contentMenuAfterUnpublish?.["header"],
      );
      const contentFooterAfterUnpublish = asRecord(
        contentMenuAfterUnpublish?.["footer"],
      );

      expect(contentHeaderAfterUnpublish?.["all"]).toBe(true);
      expect(contentFooterAfterUnpublish?.["all"]).toBe(true);

      const headerSlugsAfterUnpublish = contentHeaderAfterUnpublish?.["slugs"];
      const footerSlugsAfterUnpublish = contentFooterAfterUnpublish?.["slugs"];

      expect(Array.isArray(headerSlugsAfterUnpublish)).toBe(true);
      expect(Array.isArray(footerSlugsAfterUnpublish)).toBe(true);
      expect((headerSlugsAfterUnpublish as unknown[]).includes(slug)).toBe(
        false,
      );
      expect((footerSlugsAfterUnpublish as unknown[]).includes(slug)).toBe(
        false,
      );
    } finally {
      stopServer(serverProcess);
    }
  });

  it("rejects authenticated mutations when csrf token is missing", async () => {
    const port = getUniquePort(3124);
    const baseUrl = `http://127.0.0.1:${port}`;
    const slug = `csrf-missing-${Date.now()}`;

    const serverProcess = spawn("npx", ["tsx", "Backend/src/server.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "development",
      },
    });

    try {
      await waitForServer(baseUrl);

      const loginResponse = await fetchJson(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "alice@example.com",
          password: "password123",
        }),
      });

      const sessionCookie = getSessionCookie(loginResponse.headers);

      const createResponse = await fetchJson(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: sessionCookie,
        },
        body: JSON.stringify({
          slug,
          title: "Should fail",
          locale: "en",
          bodyRichText: "Missing CSRF header",
        }),
      });

      expect(createResponse.status).toBe(403);
      expect(createResponse.json).toEqual({
        error: {
          code: "CSRF_TOKEN_INVALID",
          message: "Invalid CSRF token",
        },
      });
    } finally {
      stopServer(serverProcess);
    }
  });
});

async function waitForServer(baseUrl: string): Promise<void> {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/me`);

      if (response.status === 401) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Server did not start in time");
}

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; json: unknown; headers: Headers }> {
  const response = await fetch(url, init);
  const json = (await response.json()) as unknown;

  return {
    status: response.status,
    json,
    headers: response.headers,
  };
}

function getSessionCookie(headers: Headers): string {
  const allSetCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.();

  if (!allSetCookie || allSetCookie.length === 0) {
    throw new Error("Missing Set-Cookie header");
  }

  return allSetCookie[0] ?? "";
}

function getCsrfTokenFromAuthResponse(response: {
  json: unknown;
  headers: Headers;
}): string {
  const headerToken = response.headers.get("x-csrf-token");

  if (headerToken && headerToken.trim().length > 0) {
    return headerToken;
  }

  const envelope = asRecord(response.json);
  const data = asRecord(envelope?.["data"]);
  const csrfToken = data?.["csrfToken"];

  if (typeof csrfToken !== "string") {
    throw new Error("Missing csrf token in auth response");
  }

  return csrfToken;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function stopServer(serverProcess: ChildProcessWithoutNullStreams): void {
  if (!serverProcess.killed) {
    serverProcess.kill("SIGTERM");
  }
}

function getUniquePort(basePort: number): number {
  return basePort + Number(process.hrtime.bigint() % 1000n);
}
