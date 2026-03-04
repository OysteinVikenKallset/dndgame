import { describe, expect, it } from "vitest";
import {
  getPublicPageBySlug,
  PUBLIC_PAGE_NOT_FOUND_ERROR,
} from "./use-cases/get-public-page-by-slug";

describe("getPublicPageBySlug", () => {
  it("returns published snapshot payload", async () => {
    const result = await getPublicPageBySlug(
      {
        slug: "ABOUT-US",
        locale: "en",
      },
      {
        publicationRepository: {
          listLatestByLocale: async () => [],
          createSnapshot: async () => {
            throw new Error("not used");
          },
          findLatestBySlugAndLocale: async () => ({
            id: "snapshot-1",
            pageId: "page-1",
            slug: "about-us",
            locale: "en",
            title: "About",
            showTitle: false,
            publishedAt: "2026-02-28T10:00:00.000Z",
            publishedVersion: 2,
            components: [
              {
                componentType: "hero",
                props: {
                  heading: "About us",
                  kicker: "CMS powered",
                },
              },
            ],
            bodyRichText: "Body",
          }),
        },
      },
    );

    expect(result).toEqual({
      id: "page-1",
      slug: "about-us",
      locale: "en",
      title: "About",
      showTitle: false,
      publishedAt: "2026-02-28T10:00:00.000Z",
      components: [
        {
          componentType: "hero",
          props: {
            heading: "About us",
            kicker: "CMS powered",
          },
        },
      ],
      bodyRichText: "Body",
    });
  });

  it("throws when snapshot does not exist", async () => {
    await expect(
      getPublicPageBySlug(
        {
          slug: "about-us",
          locale: "en",
        },
        {
          publicationRepository: {
            listLatestByLocale: async () => [],
            createSnapshot: async () => {
              throw new Error("not used");
            },
            findLatestBySlugAndLocale: async () => null,
          },
        },
      ),
    ).rejects.toThrow(PUBLIC_PAGE_NOT_FOUND_ERROR);
  });

  it("defaults locale to en and omits bodyRichText when absent", async () => {
    const result = await getPublicPageBySlug(
      {
        slug: "about-us",
        locale: "",
      },
      {
        publicationRepository: {
          listLatestByLocale: async () => [],
          createSnapshot: async () => {
            throw new Error("not used");
          },
          findLatestBySlugAndLocale: async (_slug, locale) => ({
            id: "snapshot-2",
            pageId: "page-2",
            slug: "about-us",
            locale,
            title: "About",
            publishedAt: "2026-02-28T10:00:00.000Z",
            publishedVersion: 1,
          }),
        },
      },
    );

    expect(result).toEqual({
      id: "page-2",
      slug: "about-us",
      locale: "en",
      title: "About",
      publishedAt: "2026-02-28T10:00:00.000Z",
    });
  });
});
