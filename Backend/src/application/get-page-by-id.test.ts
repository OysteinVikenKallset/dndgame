import { describe, expect, it } from "vitest";
import {
  GET_PAGE_FORBIDDEN_ERROR,
  GET_PAGE_NOT_FOUND_ERROR,
  GET_PAGE_UNAUTHORIZED_ERROR,
  getPageById,
} from "./use-cases/get-page-by-id";

describe("getPageById", () => {
  it("returns page for owner", async () => {
    const result = await getPageById(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
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
            updatedAt: "2026-02-28T10:00:00.000Z",
            publishedAt: "2026-02-28T10:00:00.000Z",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 3,
            contentSchemaVersion: 1,
            bodyRichText: "Body",
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

    expect(result).toEqual({
      id: "page-1",
      slug: "about-us",
      title: "About",
      locale: "en",
      status: "PUBLISHED",
      version: 3,
      updatedAt: "2026-02-28T10:00:00.000Z",
      publishedAt: "2026-02-28T10:00:00.000Z",
      bodyRichText: "Body",
    });
  });

  it("omits optional fields when absent", async () => {
    const result = await getPageById(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
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

    expect(result).toEqual({
      id: "page-1",
      slug: "about-us",
      title: "About",
      locale: "en",
      status: "DRAFT",
      version: 1,
      updatedAt: "2026-02-28T10:00:00.000Z",
    });
  });

  it("includes showInNav when explicitly false", async () => {
    const result = await getPageById(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
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
            showInNav: false,
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

    expect(result.showInNav).toBe(false);
  });

  it("throws unauthorized when session is missing", async () => {
    await expect(
      getPageById(
        { sessionId: "", pageId: "page-1" },
        {
          sessionService: {
            createSession: () => "session-user-1",
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
      ),
    ).rejects.toThrow(GET_PAGE_UNAUTHORIZED_ERROR);
  });

  it("throws unauthorized when user is missing", async () => {
    await expect(
      getPageById(
        { sessionId: "session-user-1", pageId: "page-1" },
        {
          sessionService: {
            createSession: () => "session-user-1",
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
      ),
    ).rejects.toThrow(GET_PAGE_UNAUTHORIZED_ERROR);
  });

  it("throws not found when page does not exist", async () => {
    await expect(
      getPageById(
        { sessionId: "session-user-1", pageId: "page-1" },
        {
          sessionService: {
            createSession: () => "session-user-1",
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
      ),
    ).rejects.toThrow(GET_PAGE_NOT_FOUND_ERROR);
  });

  it("throws forbidden when page belongs to someone else", async () => {
    await expect(
      getPageById(
        { sessionId: "session-user-1", pageId: "page-1" },
        {
          sessionService: {
            createSession: () => "session-user-1",
            getUserId: () => "user-2",
            invalidateSession: () => {},
          },
          userRepository: {
            findByEmail: async () => null,
            findById: async () => ({
              id: "user-2",
              email: "bob@example.com",
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
      ),
    ).rejects.toThrow(GET_PAGE_FORBIDDEN_ERROR);
  });

  it("allows admin to read page from another owner", async () => {
    const result = await getPageById(
      { sessionId: "session-user-1", pageId: "page-1" },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => "user-2",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-2",
            email: "admin@example.com",
            passwordHash: "hash",
            role: "admin",
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

    expect(result.id).toBe("page-1");
  });
});
