import { describe, expect, it } from "vitest";
import {
  normalizeAndValidateComponents,
  INVALID_PAGE_COMPONENTS_ERROR,
} from "./use-cases/validate-page-components";

describe("normalizeAndValidateComponents", () => {
  it("accepts valid richText block", () => {
    const result = normalizeAndValidateComponents([
      {
        componentType: "richText",
        props: { html: "<p>Hello</p>" },
      },
    ]);

    expect(result).toEqual([
      {
        componentType: "richText",
        props: { html: "<p>Hello</p>" },
      },
    ]);
  });

  it("throws for unknown block type", () => {
    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "hero",
          props: { heading: "Hello" },
        },
      ]),
    ).toThrow(INVALID_PAGE_COMPONENTS_ERROR);
  });

  it("throws for invalid textImage layout", () => {
    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "textImage",
          props: {
            text: "Body",
            mediaId: "media-1",
            alt: "Alt",
            url: "/uploads/a.jpg",
            layout: "top",
          },
        },
      ]),
    ).toThrow(INVALID_PAGE_COMPONENTS_ERROR);
  });

  it("accepts valid image, textImage and quote blocks", () => {
    const result = normalizeAndValidateComponents([
      {
        componentType: "image",
        props: {
          mediaId: "media-1",
          url: "/uploads/media-1.jpg",
          alt: "Hero image",
          caption: "Optional caption",
        },
      },
      {
        componentType: "textImage",
        props: {
          title: "Optional title",
          text: "Body text",
          mediaId: "media-2",
          url: "/uploads/media-2.jpg",
          alt: "Alt text",
          layout: "imageLeft",
        },
      },
      {
        componentType: "quote",
        props: {
          quote: "Quality is never an accident",
          author: "Anonymous",
        },
      },
    ]);

    expect(result).toEqual([
      {
        componentType: "image",
        props: {
          mediaId: "media-1",
          url: "/uploads/media-1.jpg",
          alt: "Hero image",
          caption: "Optional caption",
        },
      },
      {
        componentType: "textImage",
        props: {
          title: "Optional title",
          text: "Body text",
          mediaId: "media-2",
          url: "/uploads/media-2.jpg",
          alt: "Alt text",
          layout: "imageLeft",
        },
      },
      {
        componentType: "quote",
        props: {
          quote: "Quality is never an accident",
          author: "Anonymous",
        },
      },
    ]);
  });

  it("throws when required props are missing", () => {
    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "image",
          props: {
            mediaId: "",
            url: "/uploads/a.jpg",
            alt: "Alt",
          },
        },
      ]),
    ).toThrow(INVALID_PAGE_COMPONENTS_ERROR);

    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "quote",
          props: {
            author: "Unknown",
          },
        },
      ]),
    ).toThrow(INVALID_PAGE_COMPONENTS_ERROR);
  });

  it("throws when props object is malformed", () => {
    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "richText",
          props: null as unknown as Record<string, unknown>,
        },
      ]),
    ).toThrow(INVALID_PAGE_COMPONENTS_ERROR);

    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "",
          props: {},
        },
      ]),
    ).toThrow(INVALID_PAGE_COMPONENTS_ERROR);
  });
});
