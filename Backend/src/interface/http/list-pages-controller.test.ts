import { describe, expect, it } from "vitest";
import { handleListPagesRequest } from "./list-pages-controller";

describe("handleListPagesRequest", () => {
  it("returns 200 with page list for valid query", async () => {
    const response = await handleListPagesRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        query: {
          status: "PUBLISHED",
          locale: "en",
          sort: "updatedAt:desc",
          cursor: "page-1",
          limit: "20",
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
          findById: async (userId) => {
            if (userId === "user-1") {
              return {
                id: "user-1",
                email: "alice@example.com",
                displayName: "Alice",
                passwordHash: "hash",
              };
            }

            return null;
          },
        },
        pageRepository: {
          listByOwner: async () => ({
            items: [
              {
                id: "page-1",
                slug: "about-us",
                title: "About",
                locale: "en",
                status: "PUBLISHED",
                createdAt: "x",
                updatedAt: "2026-02-28T10:00:00.000Z",
                publishedAt: "2026-02-28T10:00:00.000Z",
                createdBy: "user-1",
                updatedBy: "user-1",
                version: 2,
                contentSchemaVersion: 1,
              },
            ],
            nextCursor: "page-2",
            total: 5,
          }),
          findById: async () => null,
          findBySlugAndLocale: async () => null,
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
          items: [
            {
              id: "page-1",
              slug: "about-us",
              title: "About",
              locale: "en",
              status: "PUBLISHED",
              template: "page",
              createdBy: "user-1",
              createdByDisplayName: "Alice",
              createdByUsername: "alice",
              updatedAt: "2026-02-28T10:00:00.000Z",
              publishedAt: "2026-02-28T10:00:00.000Z",
              version: 2,
            },
          ],
          meta: {
            nextCursor: "page-2",
            total: 5,
          },
        },
      },
    });
  });

  it("returns 200 when optional query values are invalid/omitted", async () => {
    const response = await handleListPagesRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        query: {
          status: "UNKNOWN",
          sort: "bad-sort",
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
          findById: async (userId) => {
            if (userId === "user-1") {
              return {
                id: "user-1",
                email: "alice@example.com",
                displayName: "Alice",
                passwordHash: "hash",
              };
            }

            return null;
          },
        },
        pageRepository: {
          listByOwner: async (input) => {
            expect(input.status).toBeUndefined();
            expect(input.sort).toBeUndefined();
            expect(input.limit).toBe(20);

            return {
              items: [],
              total: 0,
            };
          },
          findById: async () => null,
          findBySlugAndLocale: async () => null,
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
          items: [],
          meta: {
            total: 0,
          },
        },
      },
    });
  });

  it("returns 401 for unauthorized request", async () => {
    const response = await handleListPagesRequest(
      {
        headers: {},
        query: {},
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
          listByOwner: async () => ({ items: [], total: 0 }),
          findById: async () => null,
          findBySlugAndLocale: async () => null,
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

  it("returns 400 for invalid list input", async () => {
    const response = await handleListPagesRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        query: {
          limit: "0",
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
          findById: async (userId) => {
            if (userId === "user-1") {
              return {
                id: "user-1",
                email: "alice@example.com",
                displayName: "Alice",
                passwordHash: "hash",
              };
            }

            return null;
          },
        },
        pageRepository: {
          listByOwner: async () => ({ items: [], total: 0 }),
          findById: async () => null,
          findBySlugAndLocale: async () => null,
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
          code: "INVALID_LIST_INPUT",
          message: "Invalid list input",
        },
      },
    });
  });

  it("returns 500 for unexpected errors", async () => {
    const response = await handleListPagesRequest(
      {
        headers: {
          cookie: "sessionId=session-user-1",
        },
        query: {},
      },
      {
        sessionService: {
          createSession: (userId) => `session-${userId}`,
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async (userId) => {
            if (userId === "user-1") {
              return {
                id: "user-1",
                email: "alice@example.com",
                displayName: "Alice",
                passwordHash: "hash",
              };
            }

            return null;
          },
        },
        pageRepository: {
          listByOwner: async () => {
            throw new Error("db unavailable");
          },
          findById: async () => null,
          findBySlugAndLocale: async () => null,
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
