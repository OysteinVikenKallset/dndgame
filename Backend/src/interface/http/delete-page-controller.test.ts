import { describe, expect, it } from "vitest";
import { handleDeletePageRequest } from "./delete-page-controller";

describe("handleDeletePageRequest", () => {
  it("returns 200 for successful delete", async () => {
    const response = await handleDeletePageRequest(
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
          deleteSnapshotsByPageId: async () => {},
        },
      },
    );

    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          pageId: "page-1",
          deleted: true,
        },
      },
    });
  });

  it("returns 409 when page is not archived", async () => {
    const response = await handleDeletePageRequest(
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
    );

    expect(response).toEqual({
      status: 409,
      body: {
        error: {
          code: "DELETE_INVALID_STATE",
          message: "Only archived pages can be deleted",
        },
      },
    });
  });
});
