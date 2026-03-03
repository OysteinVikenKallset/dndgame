import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_PUBLISH_ERROR,
  PAGE_NOT_FOUND_ERROR,
  publishPage,
  UNAUTHORIZED_PUBLISH_ERROR,
} from "./use-cases/publish-page";

describe("publishPage", () => {
  it("publishes owned page and creates snapshot", async () => {
    const snapshots: Array<{ pageId: string }> = [];

    const result = await publishPage(
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
            bodyRichText: "Hello",
          }),
          findBySlugAndLocale: async () => null,
          create: async () => {
            throw new Error("not used");
          },
          update: async (_pageId, input) => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: input.status ?? "DRAFT",
            createdAt: "x",
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: input.updatedBy,
            version: 2,
            contentSchemaVersion: 1,
            ...(typeof input.publishedAt === "string"
              ? { publishedAt: input.publishedAt }
              : {}),
            bodyRichText: "Hello",
          }),
        },
        publicationRepository: {
          listLatestByLocale: async () => [],
          createSnapshot: async (input) => {
            snapshots.push({ pageId: input.pageId });
            return {
              id: "snapshot-1",
              pageId: input.pageId,
              slug: input.slug,
              locale: input.locale,
              title: input.title,
              publishedAt: input.publishedAt,
              publishedVersion: input.publishedVersion,
              ...(input.bodyRichText !== undefined
                ? { bodyRichText: input.bodyRichText }
                : {}),
            };
          },
          findLatestBySlugAndLocale: async () => null,
        },
      },
    );

    expect(result.pageId).toBe("page-1");
    expect(result.slug).toBe("about-us");
    expect(snapshots).toEqual([{ pageId: "page-1" }]);
  });

  it("throws unauthorized when session user missing", async () => {
    await expect(
      publishPage(
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
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
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
    ).rejects.toThrow(UNAUTHORIZED_PUBLISH_ERROR);
  });

  it("throws unauthorized when session user not found", async () => {
    await expect(
      publishPage(
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
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
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
    ).rejects.toThrow(UNAUTHORIZED_PUBLISH_ERROR);
  });

  it("throws when page is missing", async () => {
    await expect(
      publishPage(
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
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
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
    ).rejects.toThrow(PAGE_NOT_FOUND_ERROR);
  });

  it("throws forbidden when user does not own page", async () => {
    await expect(
      publishPage(
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
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
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
    ).rejects.toThrow(FORBIDDEN_PUBLISH_ERROR);
  });

  it("throws when page disappears before update", async () => {
    await expect(
      publishPage(
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
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
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
    ).rejects.toThrow(PAGE_NOT_FOUND_ERROR);
  });

  it("includes components in snapshot when present", async () => {
    const captured: Array<{ hasComponents: boolean; hasBody: boolean }> = [];

    await publishPage(
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
          }),
          findBySlugAndLocale: async () => null,
          create: async () => {
            throw new Error("not used");
          },
          update: async (_pageId, input) => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: input.status ?? "DRAFT",
            createdAt: "x",
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: input.updatedBy,
            version: 2,
            contentSchemaVersion: 1,
            ...(typeof input.publishedAt === "string"
              ? { publishedAt: input.publishedAt }
              : {}),
            components: [{ componentType: "hero", props: { title: "Hello" } }],
          }),
        },
        publicationRepository: {
          listLatestByLocale: async () => [],
          createSnapshot: async (input) => {
            captured.push({
              hasComponents: Boolean(input.components),
              hasBody: Boolean(input.bodyRichText),
            });
            return {
              id: "snapshot-2",
              pageId: input.pageId,
              slug: input.slug,
              locale: input.locale,
              title: input.title,
              publishedAt: input.publishedAt,
              publishedVersion: input.publishedVersion,
              ...(input.components !== undefined
                ? { components: input.components }
                : {}),
            };
          },
          findLatestBySlugAndLocale: async () => null,
        },
      },
    );

    expect(captured).toEqual([{ hasComponents: true, hasBody: false }]);
  });
});
