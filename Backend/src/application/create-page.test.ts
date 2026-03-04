import { describe, expect, it } from "vitest";
import {
  createPage,
  INVALID_PAGE_INPUT_ERROR,
  SLUG_CONFLICT_ERROR,
  UNAUTHORIZED_ERROR,
} from "./use-cases/create-page";

describe("createPage", () => {
  it("creates a draft page for authenticated user", async () => {
    const result = await createPage(
      {
        sessionId: "session-user-1",
        slug: "about-us",
        title: "About us",
        locale: "en",
        bodyRichText: "Hello",
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
          create: async (input) => ({
            id: "page-1",
            slug: input.slug,
            title: input.title,
            locale: input.locale,
            status: "DRAFT",
            createdAt: "2026-02-28T10:00:00.000Z",
            updatedAt: "2026-02-28T10:00:00.000Z",
            createdBy: input.createdBy,
            updatedBy: input.createdBy,
            version: 1,
            contentSchemaVersion: input.contentSchemaVersion,
            ...(input.bodyRichText !== undefined
              ? { bodyRichText: input.bodyRichText }
              : {}),
          }),
          update: async () => null,
        },
      },
    );

    expect(result).toEqual({
      id: "page-1",
      slug: "about-us",
      title: "About us",
      locale: "en",
      status: "DRAFT",
      version: 1,
    });
  });

  it("throws unauthorized when session is missing", async () => {
    await expect(
      createPage(
        {
          sessionId: "",
          slug: "about-us",
          title: "About us",
          locale: "en",
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
    ).rejects.toThrow(UNAUTHORIZED_ERROR);
  });

  it("throws unauthorized when session user is unknown", async () => {
    await expect(
      createPage(
        {
          sessionId: "session-user-1",
          slug: "about-us",
          title: "About us",
          locale: "en",
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
    ).rejects.toThrow(UNAUTHORIZED_ERROR);
  });

  it("throws invalid input for bad slug/title/locale", async () => {
    await expect(
      createPage(
        {
          sessionId: "session-user-1",
          slug: "Bad Slug",
          title: "",
          locale: "",
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
    ).rejects.toThrow(INVALID_PAGE_INPUT_ERROR);
  });

  it("throws slug conflict when non-archived slug exists", async () => {
    await expect(
      createPage(
        {
          sessionId: "session-user-1",
          slug: "about-us",
          title: "About us",
          locale: "en",
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
            findBySlugAndLocale: async () => ({
              id: "page-1",
              slug: "about-us",
              title: "About",
              locale: "en",
              status: "DRAFT",
              createdAt: "2026-02-28T10:00:00.000Z",
              updatedAt: "2026-02-28T10:00:00.000Z",
              createdBy: "user-1",
              updatedBy: "user-1",
              version: 1,
              contentSchemaVersion: 1,
            }),
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(SLUG_CONFLICT_ERROR);
  });

  it("allows archived slug reuse and omits bodyRichText when not provided", async () => {
    const result = await createPage(
      {
        sessionId: "session-user-1",
        slug: "about-us",
        title: "About us",
        locale: "   ",
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
          findBySlugAndLocale: async () => ({
            id: "page-old",
            slug: "about-us",
            title: "Old",
            locale: "en",
            status: "ARCHIVED",
            createdAt: "x",
            updatedAt: "x",
            createdBy: "user-1",
            updatedBy: "user-1",
            version: 1,
            contentSchemaVersion: 1,
          }),
          create: async (input) => ({
            id: "page-2",
            slug: input.slug,
            title: input.title,
            locale: input.locale,
            status: "DRAFT",
            createdAt: "x",
            updatedAt: "x",
            createdBy: input.createdBy,
            updatedBy: input.createdBy,
            version: 1,
            contentSchemaVersion: input.contentSchemaVersion,
          }),
          update: async () => null,
        },
      },
    );

    expect(result).toEqual({
      id: "page-2",
      slug: "about-us",
      title: "About us",
      locale: "en",
      status: "DRAFT",
      version: 1,
    });
  });

  it("persists showInNav when explicitly disabled", async () => {
    let capturedShowInNav: boolean | undefined;

    await createPage(
      {
        sessionId: "session-user-1",
        slug: "hidden-from-nav",
        title: "Hidden",
        locale: "en",
        showInNav: false,
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
          create: async (input) => {
            capturedShowInNav = input.showInNav;
            return {
              id: "page-3",
              slug: input.slug,
              title: input.title,
              locale: input.locale,
              status: "DRAFT",
              ...(input.showInNav !== undefined
                ? { showInNav: input.showInNav }
                : {}),
              createdAt: "x",
              updatedAt: "x",
              createdBy: input.createdBy,
              updatedBy: input.createdBy,
              version: 1,
              contentSchemaVersion: input.contentSchemaVersion,
            };
          },
          update: async () => null,
        },
      },
    );

    expect(capturedShowInNav).toBe(false);
  });

  it("persists showTitle when explicitly disabled", async () => {
    let capturedShowTitle: boolean | undefined;

    await createPage(
      {
        sessionId: "session-user-1",
        slug: "hidden-title",
        title: "Hidden title",
        locale: "en",
        showTitle: false,
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
          create: async (input) => {
            capturedShowTitle = input.showTitle;
            return {
              id: "page-3b",
              slug: input.slug,
              title: input.title,
              locale: input.locale,
              status: "DRAFT",
              ...(input.showTitle !== undefined
                ? { showTitle: input.showTitle }
                : {}),
              createdAt: "x",
              updatedAt: "x",
              createdBy: input.createdBy,
              updatedBy: input.createdBy,
              version: 1,
              contentSchemaVersion: input.contentSchemaVersion,
            };
          },
          update: async () => null,
        },
      },
    );

    expect(capturedShowTitle).toBe(false);
  });

  it("persists validated components on create", async () => {
    let capturedComponents:
      | Array<{ componentType: string; props: Record<string, unknown> }>
      | undefined;

    await createPage(
      {
        sessionId: "session-user-1",
        slug: "components-page",
        title: "Components page",
        locale: "en",
        components: [
          {
            componentType: "richText",
            props: {
              html: "<p>Hello</p>",
            },
          },
        ],
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
          create: async (input) => {
            capturedComponents = input.components;
            return {
              id: "page-4",
              slug: input.slug,
              title: input.title,
              locale: input.locale,
              status: "DRAFT",
              createdAt: "x",
              updatedAt: "x",
              createdBy: input.createdBy,
              updatedBy: input.createdBy,
              version: 1,
              contentSchemaVersion: input.contentSchemaVersion,
            };
          },
          update: async () => null,
        },
      },
    );

    expect(capturedComponents).toEqual([
      {
        componentType: "richText",
        props: {
          html: "<p>Hello</p>",
        },
      },
    ]);
  });

  it("throws invalid input when components are malformed", async () => {
    await expect(
      createPage(
        {
          sessionId: "session-user-1",
          slug: "components-invalid",
          title: "Components invalid",
          locale: "en",
          components: [
            {
              componentType: "unknown",
              props: {},
            },
          ],
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
    ).rejects.toThrow(INVALID_PAGE_INPUT_ERROR);
  });
});
