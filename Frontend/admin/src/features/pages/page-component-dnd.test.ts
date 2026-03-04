import { describe, expect, it } from "vitest";
import type { PageComponent } from "../common/types";
import {
  movePageComponent,
  type DragLocation,
  type DropLocation,
} from "./page-component-dnd";

function richText(html: string): PageComponent {
  return {
    componentType: "richText",
    props: { html },
  };
}

function button(label: string): PageComponent {
  return {
    componentType: "button",
    props: {
      label,
      url: "/",
      openInNewTab: false,
    },
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

function move(
  components: PageComponent[],
  source: DragLocation,
  destination: DropLocation,
): PageComponent[] {
  return movePageComponent(components, source, destination);
}

describe("movePageComponent", () => {
  it("reorders root components", () => {
    const result = move(
      [richText("a"), richText("b"), richText("c")],
      { container: "root", index: 2 },
      { container: "root", index: 1 },
    );

    expect(result.map((entry) => entry.props)).toEqual([
      { html: "a" },
      { html: "c" },
      { html: "b" },
    ]);
  });

  it("moves root component into grid", () => {
    const result = move(
      [richText("a"), grid([button("x")]), richText("b")],
      { container: "root", index: 2 },
      { container: "grid", gridIndex: 1, index: 1 },
    );

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      componentType: "grid",
      props: {
        components: [
          { componentType: "button" },
          { componentType: "richText", props: { html: "b" } },
        ],
      },
    });
  });

  it("moves root component into an empty grid", () => {
    const result = move(
      [richText("a"), grid([]), richText("b")],
      { container: "root", index: 0 },
      { container: "grid", gridIndex: 1, index: 0 },
    );

    expect(result[0]).toMatchObject({
      componentType: "grid",
      props: {
        components: [{ componentType: "richText", props: { html: "a" } }],
      },
    });
    expect(result[1]).toMatchObject({
      componentType: "richText",
      props: { html: "b" },
    });
  });

  it("moves grid child to root list", () => {
    const result = move(
      [richText("a"), grid([button("x"), richText("y")])],
      { container: "grid", gridIndex: 1, index: 1 },
      { container: "root", index: 1 },
    );

    expect(result[1]).toMatchObject({
      componentType: "richText",
      props: { html: "y" },
    });
    expect(result[2]).toMatchObject({
      componentType: "grid",
      props: { components: [{ componentType: "button" }] },
    });
  });

  it("moves grid child from one grid to another grid", () => {
    const result = move(
      [grid([richText("a")]), grid([button("x")])],
      { container: "grid", gridIndex: 0, index: 0 },
      { container: "grid", gridIndex: 1, index: 1 },
    );

    expect(result[0]).toMatchObject({
      componentType: "grid",
      props: { components: [] },
    });
    expect(result[1]).toMatchObject({
      componentType: "grid",
      props: {
        components: [
          { componentType: "button" },
          { componentType: "richText", props: { html: "a" } },
        ],
      },
    });
  });

  it("does not allow moving grid into grid", () => {
    const original = [richText("a"), grid([]), grid([])];

    const result = move(
      original,
      { container: "root", index: 1 },
      { container: "grid", gridIndex: 2, index: 0 },
    );

    expect(result).toEqual(original);
  });
});
