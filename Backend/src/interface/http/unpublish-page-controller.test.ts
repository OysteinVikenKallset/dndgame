import { describe, expect, it } from "vitest";
import { handleUnpublishPageRequest } from "./unpublish-page-controller";

describe("handleUnpublishPageRequest", () => {
  it("returns 200 for successful unpublish", async () => {
    const response = await handleUnpublishPageRequest(
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
          update: async () => ({
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
        },
      },
    );

    expect(response).toEqual({
      status: 200,
      body: {
        data: {
          pageId: "page-1",
          status: "DRAFT",
          version: 3,
        },
      },
    });
  });

  it("returns 409 when page is not published", async () => {
    const response = await handleUnpublishPageRequest(
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
          code: "UNPUBLISH_INVALID_STATE",
          message: "Page is not published",
        },
      },
    });
  });
});
