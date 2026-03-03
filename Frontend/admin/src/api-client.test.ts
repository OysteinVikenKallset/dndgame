import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, apiRequest } from "./api-client";

describe("apiRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends credentials and csrf token on mutation requests", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-csrf-token": "csrf-next",
          },
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/pages", {
      method: "POST",
      body: { title: "Hello" },
      csrfToken: "csrf-current",
      isMutation: true,
    });

    expect(result.ok).toBe(true);
    expect(result.csrfToken).toBe("csrf-next");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pages",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": "csrf-current",
        }),
      }),
    );
  });

  it("maps backend error envelope consistently", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Fix fields",
              fieldErrors: [{ path: "title", message: "Required" }],
            },
          }),
          {
            status: 400,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/pages", {
      method: "POST",
      body: { title: "" },
      csrfToken: "csrf",
      isMutation: true,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toEqual({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Fix fields",
      fieldErrors: [{ path: "title", message: "Required" }],
    });
  });

  it("returns structured network error when fetch throws", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/auth/me");

    expect(result.ok).toBe(false);
    expect(result.error).toEqual({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Could not reach API",
      fieldErrors: [],
    });
  });

  it("does not throw on malformed success JSON", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("<html>bad gateway</html>", {
          status: 200,
          headers: {
            "content-type": "text/html",
          },
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/auth/me");

    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });

  it("sends patch request for settings updates with csrf token", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: { homepagePageId: "page-1" } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await api.updateSettings(
      { homepagePageId: "page-1" },
      "csrf-current",
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: expect.objectContaining({
          "X-CSRF-Token": "csrf-current",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ homepagePageId: "page-1" }),
      }),
    );
  });

  it("sends patch request for my profile updates", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: {
              id: "user-1",
              email: "alice@example.com",
              role: "editor",
              displayName: "Alice",
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await api.updateMyProfile(
      {
        email: "alice@example.com",
        role: "editor",
        displayName: "Alice",
      },
      "csrf-current",
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/me",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: expect.objectContaining({
          "X-CSRF-Token": "csrf-current",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("clamps listPages limit to backend max", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ data: { items: [], meta: { total: 0 } } }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await api.listPages({ status: "PUBLISHED", limit: 200 });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("limit=100"),
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("uploads media using multipart form data", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: {
              id: "media-1",
              filename: "photo.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 123,
              createdAt: "2026-03-02T00:00:00.000Z",
              url: "/uploads/media-1.jpg",
            },
          }),
          {
            status: 201,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["abc"], "photo.jpg", { type: "image/jpeg" });

    const result = await api.uploadMedia(file, "csrf-current");

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/media",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          Accept: "application/json",
          "X-CSRF-Token": "csrf-current",
        }),
      }),
    );
  });
});
