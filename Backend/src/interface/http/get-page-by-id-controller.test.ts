import { describe, expect, it } from "vitest";
import { handleGetPageByIdRequest } from "./get-page-by-id-controller";

describe("handleGetPageByIdRequest", () => {
  it("returns 200 with page data", async () => {
    const response = await handleGetPageByIdRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
      },
      {
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash",
          }),
        },
        pageRepository: {
          findById: async () => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: "DRAFT",
            showTitle: false,
            createdAt: "x",
            updatedAt: "2026-02-28T10:00:00.000Z",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 1,
            contentSchemaVersion: 1,
          }),
          findBySlugAndLocale: async () => null,
          listByOwner: async () => ({ items: [], total: 0 }),
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
        },
      },
    );

    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          id: "page-1",
          slug: "about-us",
          title: "About",
          locale: "en",
          status: "DRAFT",
          showTitle: false,
          version: 1,
          updatedAt: "2026-02-28T10:00:00.000Z",
        },
      },
    });
  });

  it("returns 401 when unauthorized", async () => {
    const response = await handleGetPageByIdRequest(
      {
        headers: {},
        params: {
          pageId: "page-1",
        },
      },
      {
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => null,
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
        },
        pageRepository: {
          findById: async () => null,
          findBySlugAndLocale: async () => null,
          listByOwner: async () => ({ items: [], total: 0 }),
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
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

  it("returns 403 when forbidden", async () => {
    const response = await handleGetPageByIdRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
      },
      {
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash",
          }),
        },
        pageRepository: {
          findById: async () => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: "DRAFT",
            createdAt: "x",
            updatedAt: "x",
            createdBy: "user-2",
            updatedBy: "user-2",
            version: 1,
            contentSchemaVersion: 1,
          }),
          findBySlugAndLocale: async () => null,
          listByOwner: async () => ({ items: [], total: 0 }),
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
        },
      },
    );

    expect(response).toEqual({
      status: 403,
      body: {
        error: {
          code: "FORBIDDEN",
          message: "Forbidden",
        },
      },
    });
  });

  it("returns 404 when page is not found", async () => {
    const response = await handleGetPageByIdRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
      },
      {
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "hash",
          }),
        },
        pageRepository: {
          findById: async () => null,
          findBySlugAndLocale: async () => null,
          listByOwner: async () => ({ items: [], total: 0 }),
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
        },
      },
    );

    expect(response).toEqual({
      status: 404,
      body: {
        error: {
          code: "PAGE_NOT_FOUND",
          message: "Page not found",
        },
      },
    });
  });

  it("returns 500 for unexpected errors", async () => {
    const response = await handleGetPageByIdRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
      },
      {
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => {
            throw new Error("db unavailable");
          },
        },
        pageRepository: {
          findById: async () => null,
          findBySlugAndLocale: async () => null,
          listByOwner: async () => ({ items: [], total: 0 }),
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
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
