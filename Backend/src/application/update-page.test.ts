import { describe, expect, it } from "vitest";
import {
  UPDATE_FORBIDDEN_ERROR,
  UPDATE_INVALID_INPUT_ERROR,
  UPDATE_PAGE_NOT_FOUND_ERROR,
  UPDATE_SLUG_CHANGE_FORBIDDEN_ERROR,
  UPDATE_SLUG_CONFLICT_ERROR,
  UPDATE_UNAUTHORIZED_ERROR,
  UPDATE_VERSION_CONFLICT_ERROR,
  updatePage,
} from "./use-cases/update-page";

function authDeps() {
  return {
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
  };
}

describe("updatePage", () => {
  it("updates page for owner and increments version", async () => {
    const result = await updatePage(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
        version: 1,
        title: " About us ",
        slug: "about-company",
        bodyRichText: "Updated",
      },
      {
        ...authDeps(),
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
          update: async (_pageId, input) => ({
            id: "page-1",
            slug: input.slug ?? "about-us",
            title: input.title ?? "About",
            locale: "en",
            status: "DRAFT",
            createdAt: "x",
            updatedAt: "2026-02-28T10:00:00.000Z",
            createdBy: "user-1",
            updatedBy: input.updatedBy,
            version: input.version ?? 2,
            contentSchemaVersion: 1,
            ...(input.bodyRichText !== undefined
              ? { bodyRichText: input.bodyRichText }
              : {}),
          }),
        },
      },
    );

    expect(result).toEqual({
      id: "page-1",
      slug: "about-company",
      title: "About us",
      locale: "en",
      status: "DRAFT",
      version: 2,
      updatedAt: "2026-02-28T10:00:00.000Z",
    });
  });

  it("supports body-only update without title/slug", async () => {
    const result = await updatePage(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
        version: 3,
        bodyRichText: "Only body",
      },
      {
        ...authDeps(),
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
            version: 4,
            contentSchemaVersion: 1,
          }),
        },
      },
    );

    expect(result.version).toBe(4);
  });

  it("updates showInNav when provided", async () => {
    const result = await updatePage(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
        version: 1,
        showInNav: false,
      },
      {
        ...authDeps(),
        pageRepository: {
          findById: async () => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: "DRAFT",
            showInNav: true,
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
          update: async (_pageId, input) => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: "DRAFT",
            ...(input.showInNav !== undefined
              ? { showInNav: input.showInNav }
              : {}),
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

    expect(result).toMatchObject({
      id: "page-1",
      version: 2,
    });
  });

  it("updates showTitle when provided", async () => {
    const result = await updatePage(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
        version: 1,
        showTitle: false,
      },
      {
        ...authDeps(),
        pageRepository: {
          findById: async () => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: "DRAFT",
            showTitle: true,
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
          update: async (_pageId, input) => ({
            id: "page-1",
            slug: "about-us",
            title: "About",
            locale: "en",
            status: "DRAFT",
            ...(input.showTitle !== undefined
              ? { showTitle: input.showTitle }
              : {}),
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

    expect(result).toMatchObject({
      id: "page-1",
      version: 2,
    });
  });

  it("throws unauthorized when session missing", async () => {
    await expect(
      updatePage(
        {
          sessionId: "",
          pageId: "page-1",
          version: 1,
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
            listByOwner: async () => ({ items: [], total: 0 }),
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(UPDATE_UNAUTHORIZED_ERROR);
  });

  it("throws unauthorized when user missing", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
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
            listByOwner: async () => ({ items: [], total: 0 }),
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(UPDATE_UNAUTHORIZED_ERROR);
  });

  it("throws not found when page missing", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
        },
        {
          ...authDeps(),
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
    ).rejects.toThrow(UPDATE_PAGE_NOT_FOUND_ERROR);
  });

  it("throws forbidden for non-owner", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
        },
        {
          ...authDeps(),
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
      ),
    ).rejects.toThrow(UPDATE_FORBIDDEN_ERROR);
  });

  it("allows admin to update page owned by another user", async () => {
    const result = await updatePage(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
        version: 1,
        title: "Updated by admin",
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
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
          update: async () => ({
            id: "page-1",
            slug: "about-us",
            title: "Updated by admin",
            locale: "en",
            status: "DRAFT",
            createdAt: "x",
            updatedAt: "2026-02-28T10:00:00.000Z",
            createdBy: "user-2",
            updatedBy: "user-9",
            version: 2,
            contentSchemaVersion: 1,
          }),
        },
      },
    );

    expect(result.title).toBe("Updated by admin");
  });

  it("throws version conflict", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
        },
        {
          ...authDeps(),
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
    ).rejects.toThrow(UPDATE_VERSION_CONFLICT_ERROR);
  });

  it("updates components when provided", async () => {
    const result = await updatePage(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
        version: 1,
        components: [
          {
            componentType: "richText",
            props: {
              html: "<p>Updated body</p>",
            },
          },
        ],
      },
      {
        ...authDeps(),
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

    expect(result.version).toBe(2);
  });

  it("throws invalid input when components are malformed", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
          components: [
            {
              componentType: "unsupported",
              props: {},
            },
          ],
        },
        {
          ...authDeps(),
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
    ).rejects.toThrow(UPDATE_INVALID_INPUT_ERROR);
  });

  it("throws version conflict when write loses race in repository", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
          title: "About us",
        },
        {
          ...authDeps(),
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
    ).rejects.toThrow(UPDATE_VERSION_CONFLICT_ERROR);
  });

  it("throws invalid input for empty title", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
          title: "   ",
        },
        {
          ...authDeps(),
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
    ).rejects.toThrow(UPDATE_INVALID_INPUT_ERROR);
  });

  it("throws invalid input for empty slug", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
          slug: "   ",
        },
        {
          ...authDeps(),
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
    ).rejects.toThrow(UPDATE_INVALID_INPUT_ERROR);
  });

  it("throws invalid input for malformed slug", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
          slug: "Bad Slug",
        },
        {
          ...authDeps(),
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
    ).rejects.toThrow(UPDATE_INVALID_INPUT_ERROR);
  });

  it("throws when changing slug for published page", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
          slug: "new-slug",
        },
        {
          ...authDeps(),
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
      ),
    ).rejects.toThrow(UPDATE_SLUG_CHANGE_FORBIDDEN_ERROR);
  });

  it("throws slug conflict for active page", async () => {
    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
          slug: "new-slug",
        },
        {
          ...authDeps(),
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
      ),
    ).rejects.toThrow(UPDATE_SLUG_CONFLICT_ERROR);
  });

  it("allows archived slug during update", async () => {
    const result = await updatePage(
      {
        sessionId: "session-user-1",
        pageId: "page-1",
        version: 1,
        slug: "new-slug",
      },
      {
        ...authDeps(),
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
            status: "ARCHIVED",
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
          update: async (_id, input) => ({
            id: "page-1",
            slug: input.slug ?? "about-us",
            title: "About",
            locale: "en",
            status: "DRAFT",
            createdAt: "x",
            updatedAt: "2026-02-28T10:00:00.000Z",
            createdBy: "user-1",
            updatedBy: input.updatedBy,
            version: 2,
            contentSchemaVersion: 1,
          }),
        },
      },
    );

    expect(result.slug).toBe("new-slug");
  });

  it("throws not found if update returns null", async () => {
    let readCount = 0;

    await expect(
      updatePage(
        {
          sessionId: "session-user-1",
          pageId: "page-1",
          version: 1,
        },
        {
          ...authDeps(),
          pageRepository: {
            findById: async () => {
              readCount += 1;

              if (readCount === 1) {
                return {
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
                };
              }

              return null;
            },
            findBySlugAndLocale: async () => null,
            listByOwner: async () => ({ items: [], total: 0 }),
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(UPDATE_PAGE_NOT_FOUND_ERROR);
  });
});
