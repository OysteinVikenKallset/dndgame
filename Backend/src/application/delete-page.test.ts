import { describe, expect, it } from "vitest";
import {
  DELETE_FORBIDDEN_ERROR,
  DELETE_INVALID_STATE_ERROR,
  DELETE_NOT_FOUND_ERROR,
  DELETE_UNAUTHORIZED_ERROR,
  deletePage,
} from "./use-cases/delete-page";

describe("deletePage", () => {
  it("deletes archived page for owner", async () => {
    const deletedPageIds: string[] = [];
    const deletedSnapshotPageIds: string[] = [];

    const result = await deletePage(
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
            status: "ARCHIVED",
            createdAt: "x",
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 3,
            contentSchemaVersion: 1,
          }),
          findBySlugAndLocale: async () => null,
          listByOwner: async () => ({ items: [], total: 0 }),
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
          deleteById: async (pageId) => {
            deletedPageIds.push(pageId);
            return true;
          },
        },
        publicationRepository: {
          listLatestByLocale: async () => [],
          createSnapshot: async () => {
            throw new Error("not used");
          },
          findLatestBySlugAndLocale: async () => null,
          deleteSnapshotsByPageId: async (pageId) => {
            deletedSnapshotPageIds.push(pageId);
          },
        },
      },
    );

    expect(result).toEqual({
      pageId: "page-1",
      deleted: true,
    });
    expect(deletedPageIds).toEqual(["page-1"]);
    expect(deletedSnapshotPageIds).toEqual(["page-1"]);
  });

  it("throws invalid state when page is not archived", async () => {
    await expect(
      deletePage(
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
            deleteById: async () => true,
          },
          publicationRepository: {
            listLatestByLocale: async () => [],
            createSnapshot: async () => {
              throw new Error("not used");
            },
            findLatestBySlugAndLocale: async () => null,
          },
        },
      ),
    ).rejects.toThrow(DELETE_INVALID_STATE_ERROR);
  });

  it("throws unauthorized when no session user", async () => {
    await expect(
      deletePage(
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
            deleteById: async () => false,
          },
          publicationRepository: {
            listLatestByLocale: async () => [],
            createSnapshot: async () => {
              throw new Error("not used");
            },
            findLatestBySlugAndLocale: async () => null,
          },
        },
      ),
    ).rejects.toThrow(DELETE_UNAUTHORIZED_ERROR);
  });

  it("throws forbidden for non-owner non-admin", async () => {
    await expect(
      deletePage(
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
              status: "ARCHIVED",
              createdAt: "x",
              updatedAt: "x",
              createdBy: "user-1",
              updatedBy: "user-1",
              version: 3,
              contentSchemaVersion: 1,
            }),
            findBySlugAndLocale: async () => null,
            listByOwner: async () => ({ items: [], total: 0 }),
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
            deleteById: async () => true,
          },
          publicationRepository: {
            listLatestByLocale: async () => [],
            createSnapshot: async () => {
              throw new Error("not used");
            },
            findLatestBySlugAndLocale: async () => null,
          },
        },
      ),
    ).rejects.toThrow(DELETE_FORBIDDEN_ERROR);
  });

  it("throws not found when page does not exist", async () => {
    await expect(
      deletePage(
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
            deleteById: async () => false,
          },
          publicationRepository: {
            listLatestByLocale: async () => [],
            createSnapshot: async () => {
              throw new Error("not used");
            },
            findLatestBySlugAndLocale: async () => null,
          },
        },
      ),
    ).rejects.toThrow(DELETE_NOT_FOUND_ERROR);
  });
});
