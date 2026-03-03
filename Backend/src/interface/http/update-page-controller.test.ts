import { describe, expect, it } from "vitest";
import { handleUpdatePageRequest } from "./update-page-controller";

describe("handleUpdatePageRequest", () => {
  it("returns 200 for valid update request", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
          title: "About us",
          slug: "about-us",
          bodyRichText: "Updated",
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
          update: async () => ({
            id: "page-1",
            slug: "about-us",
            title: "About us",
            locale: "en",
            status: "DRAFT",
            createdAt: "x",
            updatedAt: "2026-02-28T10:00:00.000Z",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 2,
            contentSchemaVersion: 1,
          }),
        },
      },
    );

    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          id: "page-1",
          slug: "about-us",
          title: "About us",
          locale: "en",
          status: "DRAFT",
          version: 2,
          updatedAt: "2026-02-28T10:00:00.000Z",
        },
      },
    });
  });

  it("returns 200 and ignores non-string optional values", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
          title: 123,
          slug: true,
          bodyRichText: { text: "x" },
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
          update: async () => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: "DRAFT",
            createdAt: "x",
            updatedAt: "2026-02-28T10:00:00.000Z",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 2,
            contentSchemaVersion: 1,
          }),
        },
      },
    );

    expect(response.status).toBe(200);
  });

  it("returns 400 for unknown fields", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
          role: "admin",
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
      status: 400,
      body: {
        error: {
          code: "INVALID_PAGE_INPUT",
          message: "Fix the highlighted fields",
          fieldErrors: [
            {
              path: "body",
              code: "UNKNOWN_FIELD",
              message: "Request body contains unsupported fields",
            },
          ],
        },
      },
    });
  });

  it("returns 400 for missing integer version", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: "1.2",
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
      status: 400,
      body: {
        error: {
          code: "INVALID_PAGE_INPUT",
          message: "Fix the highlighted fields",
          fieldErrors: [
            {
              path: "version",
              code: "INVALID_TYPE",
              message: "Version must be an integer",
            },
          ],
        },
      },
    });
  });

  it("returns 400 for non-boolean showInNav", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
          showInNav: "no",
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
      status: 400,
      body: {
        error: {
          code: "INVALID_PAGE_INPUT",
          message: "Fix the highlighted fields",
          fieldErrors: [
            {
              path: "showInNav",
              code: "INVALID_TYPE",
              message: "showInNav must be a boolean",
            },
          ],
        },
      },
    });
  });

  it("returns component fieldErrors for invalid textImage block", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
          components: [
            {
              componentType: "textImage",
              props: {
                text: "Body",
                mediaId: "media-1",
                url: "/uploads/media-1.jpg",
                layout: "imageLeft",
              },
            },
          ],
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
      status: 400,
      body: {
        error: {
          code: "INVALID_PAGE_INPUT",
          message: "Fix the highlighted fields",
          fieldErrors: [
            {
              path: "components[0].props.alt",
              code: "REQUIRED",
              message: "Alt text is required",
            },
          ],
        },
      },
    });
  });

  it("maps unauthorized error to 401", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {},
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
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

    expect(response.status).toBe(401);
  });

  it("maps forbidden error to 403", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
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

    expect(response.status).toBe(403);
  });

  it("maps not found error to 404", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
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

    expect(response.status).toBe(404);
  });

  it("maps version conflict to 409", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
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
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 2,
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
      status: 409,
      body: {
        error: {
          code: "CONFLICT_VERSION",
          message: "Version conflict",
        },
      },
    });
  });

  it("maps slug conflict to 409", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
          slug: "new-slug",
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
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 1,
            contentSchemaVersion: 1,
          }),
          findBySlugAndLocale: async () => ({
            id: "page-2",
            slug: "new-slug",
            title: "Existing",
            locale: "en",
            status: "DRAFT",
            createdAt: "x",
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 1,
            contentSchemaVersion: 1,
          }),
          listByOwner: async () => ({ items: [], total: 0 }),
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
        },
      },
    );

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "SLUG_CONFLICT",
        message: "Slug already in use",
      },
    });
  });

  it("maps slug change forbidden to 409", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
          slug: "new-slug",
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
            status: "PUBLISHED",
            createdAt: "x",
            updatedAt: "x",
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

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "SLUG_CHANGE_FORBIDDEN",
        message: "Cannot change slug for published page",
      },
    });
  });

  it("maps invalid input from use-case to 400", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
          title: "   ",
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

    expect(response.status).toBe(400);
  });

  it("returns 500 for unexpected errors", async () => {
    const response = await handleUpdatePageRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        params: {
          pageId: "page-1",
        },
        body: {
          version: 1,
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
          findById: async () => {
            throw new Error("db unavailable");
          },
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
