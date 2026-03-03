import { describe, expect, it } from "vitest";
import {
  ARCHIVE_FORBIDDEN_ERROR,
  ARCHIVE_NOT_FOUND_ERROR,
  ARCHIVE_UNAUTHORIZED_ERROR,
  archivePage,
} from "./use-cases/archive-page";

describe("archivePage", () => {
  it("archives page for owner", async () => {
    const result = await archivePage(
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
          update: async (_id, input) => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: input.status ?? "PUBLISHED",
            createdAt: "x",
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: input.updatedBy,
            version: input.version ?? 3,
            contentSchemaVersion: 1,
          }),
        },
      },
    );

    expect(result).toEqual({
      pageId: "page-1",
      status: "ARCHIVED",
      version: 3,
    });
  });

  it("throws unauthorized when session missing", async () => {
    await expect(
      archivePage(
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
    ).rejects.toThrow(ARCHIVE_UNAUTHORIZED_ERROR);
  });

  it("throws unauthorized when user missing", async () => {
    await expect(
      archivePage(
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
    ).rejects.toThrow(ARCHIVE_UNAUTHORIZED_ERROR);
  });

  it("throws not found when page is missing", async () => {
    await expect(
      archivePage(
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
    ).rejects.toThrow(ARCHIVE_NOT_FOUND_ERROR);
  });

  it("throws forbidden when page belongs to another user", async () => {
    await expect(
      archivePage(
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
    ).rejects.toThrow(ARCHIVE_FORBIDDEN_ERROR);
  });

  it("throws not found when update returns null", async () => {
    await expect(
      archivePage(
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
    ).rejects.toThrow(ARCHIVE_NOT_FOUND_ERROR);
  });
});
