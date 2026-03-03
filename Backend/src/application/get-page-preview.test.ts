import { describe, expect, it } from "vitest";
import {
  getPagePreview,
  PREVIEW_FORBIDDEN_ERROR,
  PREVIEW_PAGE_NOT_FOUND_ERROR,
  PREVIEW_UNAUTHORIZED_ERROR,
} from "./use-cases/get-page-preview";

describe("getPagePreview", () => {
  it("returns preview for page owner", async () => {
    const result = await getPagePreview(
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
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 1,
            contentSchemaVersion: 1,
            bodyRichText: "Preview text",
          }),
          findBySlugAndLocale: async () => null,
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
      locale: "en",
      title: "About",
      status: "DRAFT",
      version: 1,
      bodyRichText: "Preview text",
    });
  });

  it("throws unauthorized when session is missing", async () => {
    await expect(
      getPagePreview(
        {
          sessionId: "",
          pageId: "page-1",
        },
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
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(PREVIEW_UNAUTHORIZED_ERROR);
  });

  it("throws unauthorized when user is missing", async () => {
    await expect(
      getPagePreview(
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
            findById: async () => null,
          },
          pageRepository: {
            findById: async () => null,
            findBySlugAndLocale: async () => null,
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(PREVIEW_UNAUTHORIZED_ERROR);
  });

  it("throws not found when page is missing", async () => {
    await expect(
      getPagePreview(
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
            findById: async () => null,
            findBySlugAndLocale: async () => null,
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(PREVIEW_PAGE_NOT_FOUND_ERROR);
  });

  it("throws forbidden when page belongs to another user", async () => {
    await expect(
      getPagePreview(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
        },
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
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(PREVIEW_FORBIDDEN_ERROR);
  });

  it("omits bodyRichText when page has no body", async () => {
    const result = await getPagePreview(
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
      locale: "en",
      title: "About",
      status: "PUBLISHED",
      version: 2,
    });
  });
});
