import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_UNPUBLISH_ERROR,
  UNAUTHORIZED_UNPUBLISH_ERROR,
  UNPUBLISH_INVALID_STATE_ERROR,
  UNPUBLISH_PAGE_NOT_FOUND_ERROR,
  unpublishPage,
} from "./use-cases/unpublish-page";

describe("unpublishPage", () => {
  it("unpublishes a published page for owner", async () => {
    const result = await unpublishPage(
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
            publishedAt: "2026-03-01T10:00:00.000Z",
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
      status: "DRAFT",
      version: 3,
    });
  });

  it("allows admin to unpublish pages owned by others", async () => {
    const result = await unpublishPage(
      {
        sessionId: "session-admin",
        pageId: "page-1",
      },
      {
        sessionService: {
          createSession: () => "session-admin",
          getUserId: () => "user-9",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async () => ({
            id: "user-9",
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
            status: "PUBLISHED",
            createdAt: "x",
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 4,
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
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: "user-9",
            version: 5,
            contentSchemaVersion: 1,
          }),
        },
      },
    );

    expect(result.version).toBe(5);
  });

  it("throws unauthorized when session is missing", async () => {
    await expect(
      unpublishPage(
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
    ).rejects.toThrow(UNAUTHORIZED_UNPUBLISH_ERROR);
  });

  it("throws not found when page does not exist", async () => {
    await expect(
      unpublishPage(
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
    ).rejects.toThrow(UNPUBLISH_PAGE_NOT_FOUND_ERROR);
  });

  it("throws forbidden for non-owner non-admin", async () => {
    await expect(
      unpublishPage(
        { sessionId: "session-user-2", pageId: "page-1" },
        {
          sessionService: {
            createSession: () => "session-user-2",
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
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(FORBIDDEN_UNPUBLISH_ERROR);
  });

  it("throws invalid state when page is not published", async () => {
    await expect(
      unpublishPage(
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
      ),
    ).rejects.toThrow(UNPUBLISH_INVALID_STATE_ERROR);
  });
});
