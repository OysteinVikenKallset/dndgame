import { describe, expect, it } from "vitest";
import type { PageComponent } from "../common/types";
import { duplicatePageComponent } from "./page-component-duplicate";

function richText(html: string): PageComponent {
  return {
    componentType: "richText",
    props: { html },
  };
}

function grid(children: PageComponent[]): PageComponent {
  return {
    componentType: "grid",
    props: {
      width: "100",
      contentAlign: "left",
      selfAlign: "left",
      components: children,
    },
  };
}

describe("duplicatePageComponent", () => {
  it("duplicates root component right after source", () => {
    const source = [richText("a"), richText("b")];

    const result = duplicatePageComponent(source, {
      container: "root",
      index: 0,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ props: { html: "a" } });
    expect(result[1]).toMatchObject({ props: { html: "a" } });
    expect(result[2]).toMatchObject({ props: { html: "b" } });
    expect(result[0]).not.toBe(result[1]);
  });

  it("duplicates grid child right after source", () => {
    const source = [grid([richText("x"), richText("y")])];

    const result = duplicatePageComponent(source, {
      container: "grid",
      gridIndex: 0,
      index: 0,
    });

    const first = result[0];
    expect(first?.componentType).toBe("grid");

    if (!first || first.componentType !== "grid") {
      throw new Error("Expected grid component");
    }

    expect(first.props.components).toHaveLength(3);
    expect(first.props.components[0]).toMatchObject({ props: { html: "x" } });
    expect(first.props.components[1]).toMatchObject({ props: { html: "x" } });
    expect(first.props.components[2]).toMatchObject({ props: { html: "y" } });
    expect(first.props.components[0]).not.toBe(first.props.components[1]);
  });

  it("duplicates nested content inside grid copies", () => {
    const source = [
      grid([
        {
          componentType: "grid",
          props: {
            width: "50",
            contentAlign: "left",
            selfAlign: "left",
            components: [richText("deep")],
          },
        },
      ]),
    ];

    const result = duplicatePageComponent(source, {
      container: "root",
      index: 0,
    });

    const original = result[0];
    const duplicate = result[1];

    expect(original?.componentType).toBe("grid");
    expect(duplicate?.componentType).toBe("grid");

    if (
      !original ||
      !duplicate ||
      original.componentType !== "grid" ||
      duplicate.componentType !== "grid"
    ) {
      throw new Error("Expected grid components");
    }

    const originalNested = original.props.components[0];
    const duplicateNested = duplicate.props.components[0];

    expect(originalNested).not.toBe(duplicateNested);
    expect(duplicateNested).toMatchObject({ componentType: "grid" });
  });
});
