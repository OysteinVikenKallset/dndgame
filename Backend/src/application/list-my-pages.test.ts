import { describe, expect, it } from "vitest";
import {
  INVALID_LIST_INPUT_ERROR,
  LIST_UNAUTHORIZED_ERROR,
  listMyPages,
} from "./use-cases/list-my-pages";

describe("listMyPages", () => {
  it("returns owner-filtered list with meta", async () => {
    const result = await listMyPages(
      {
        sessionId: "session-user-1",
        status: "PUBLISHED",
        locale: "en",
        sort: "updatedAt:desc",
        cursor: "page-0",
        limit: 20,
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
            displayName: "Alice",
            passwordHash: "hash",
          }),
        },
        pageRepository: {
          findById: async () => null,
          findBySlugAndLocale: async () => null,
          listByOwner: async () => ({
            items: [
              {
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
                version: 2,
                contentSchemaVersion: 1,
              },
            ],
            nextCursor: "page-2",
            total: 3,
          }),
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
        },
      },
    );

    expect(result).toEqual({
      items: [
        {
          id: "page-1",
          slug: "about-us",
          title: "About",
          locale: "en",
          status: "PUBLISHED",
          template: "page",
          createdBy: "user-1",
          createdByDisplayName: "Alice",
          createdByUsername: "alice",
          updatedAt: "2026-02-28T10:00:00.000Z",
          publishedAt: "2026-02-28T10:00:00.000Z",
          version: 2,
        },
      ],
      meta: {
        nextCursor: "page-2",
        total: 3,
      },
    });
  });

  it("uses defaults and omits optional fields when absent", async () => {
    const result = await listMyPages(
      {
        sessionId: "session-user-1",
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
            displayName: "Alice",
            passwordHash: "hash",
          }),
        },
        pageRepository: {
          findById: async () => null,
          findBySlugAndLocale: async () => null,
          listByOwner: async (input) => {
            expect(input.limit).toBe(20);
            return {
              items: [
                {
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
                },
              ],
              total: 1,
            };
          },
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
        },
      },
    );

    expect(result).toEqual({
      items: [
        {
          id: "page-1",
          slug: "about-us",
          title: "About",
          locale: "en",
          status: "DRAFT",
          template: "page",
          createdBy: "user-1",
          createdByDisplayName: "Alice",
          createdByUsername: "alice",
          updatedAt: "2026-02-28T10:00:00.000Z",
          version: 1,
        },
      ],
      meta: {
        total: 1,
      },
    });
  });

  it("throws unauthorized when session is missing", async () => {
    await expect(
      listMyPages(
        {
          sessionId: "",
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
    ).rejects.toThrow(LIST_UNAUTHORIZED_ERROR);
  });

  it("throws unauthorized when user is missing", async () => {
    await expect(
      listMyPages(
        {
          sessionId: "session-user-1",
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
    ).rejects.toThrow(LIST_UNAUTHORIZED_ERROR);
  });

  it("throws on invalid limit", async () => {
    await expect(
      listMyPages(
        {
          sessionId: "session-user-1",
          limit: 0,
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
            listByOwner: async () => ({ items: [], total: 0 }),
            create: async () => {
              throw new Error("not used");
            },
            update: async () => null,
          },
        },
      ),
    ).rejects.toThrow(INVALID_LIST_INPUT_ERROR);
  });

  it("lists all pages when user is admin", async () => {
    const result = await listMyPages(
      {
        sessionId: "session-user-1",
      },
      {
        sessionService: {
          createSession: () => "session-user-1",
          getUserId: () => "user-1",
          invalidateSession: () => {},
        },
        userRepository: {
          findByEmail: async () => null,
          findById: async (userId) => {
            if (userId === "user-1") {
              return {
                id: "user-1",
                email: "alice@example.com",
                displayName: "Alice",
                passwordHash: "hash",
                role: "admin",
              };
            }

            if (userId === "user-2") {
              return {
                id: "user-2",
                email: "bob@example.com",
                displayName: "Bob",
                passwordHash: "hash",
                role: "editor",
              };
            }

            return null;
          },
        },
        pageRepository: {
          findById: async () => null,
          findBySlugAndLocale: async () => null,
          listByOwner: async (input) => {
            expect(input.ownerId).toBeUndefined();
            return {
              items: [
                {
                  id: "page-2",
                  slug: "team",
                  title: "Team",
                  locale: "en",
                  status: "DRAFT",
                  createdAt: "x",
                  updatedAt: "2026-02-28T12:00:00.000Z",
                  createdBy: "user-2",
                  updatedBy: "user-2",
                  version: 1,
                  contentSchemaVersion: 1,
                },
              ],
              total: 1,
            };
          },
          create: async () => {
            throw new Error("not used");
          },
          update: async () => null,
        },
      },
    );

    expect(result.items[0]).toMatchObject({
      createdBy: "user-2",
      createdByDisplayName: "Bob",
      createdByUsername: "bob",
    });
  });
});
