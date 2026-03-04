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

  it("accepts valid button and headline blocks", () => {
    const result = normalizeAndValidateComponents([
      {
        componentType: "button",
        props: {
          label: "Read more",
          url: "/about",
          openInNewTab: true,
        },
      },
      {
        componentType: "headline",
        props: {
          text: "Welcome to our site",
          level: "h2",
        },
      },
    ]);

    expect(result).toEqual([
      {
        componentType: "button",
        props: {
          label: "Read more",
          url: "/about",
          openInNewTab: true,
        },
      },
      {
        componentType: "headline",
        props: {
          text: "Welcome to our site",
          level: "h2",
        },
      },
    ]);
  });

  it("accepts valid grid block with nested components", () => {
    const result = normalizeAndValidateComponents([
      {
        componentType: "grid",
        props: {
          width: "50",
          contentAlign: "center",
          selfAlign: "right",
          components: [
            {
              componentType: "headline",
              props: {
                text: "Inside grid",
                level: "h3",
              },
            },
            {
              componentType: "button",
              props: {
                label: "Read",
                url: "/read",
                openInNewTab: false,
              },
            },
          ],
        },
      },
    ]);

    expect(result).toEqual([
      {
        componentType: "grid",
        props: {
          width: "50",
          contentAlign: "center",
          selfAlign: "right",
          components: [
            {
              componentType: "headline",
              props: {
                text: "Inside grid",
                level: "h3",
              },
            },
            {
              componentType: "button",
              props: {
                label: "Read",
                url: "/read",
                openInNewTab: false,
              },
            },
          ],
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

    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "button",
          props: {
            label: "",
            url: "",
          },
        },
      ]),
    ).toThrow(INVALID_PAGE_COMPONENTS_ERROR);

    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "headline",
          props: {
            text: "Heading",
            level: "h7",
          },
        },
      ]),
    ).toThrow(INVALID_PAGE_COMPONENTS_ERROR);

    expect(() =>
      normalizeAndValidateComponents([
        {
          componentType: "grid",
          props: {
            width: "40",
            contentAlign: "left",
            selfAlign: "center",
            components: [],
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
