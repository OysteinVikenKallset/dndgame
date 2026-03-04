import type { PageComponent } from "../common/types";

export type DragLocation =
  | {
      container: "root";
      index: number;
    }
  | {
      container: "grid";
      gridIndex: number;
      index: number;
    };

export type DropLocation =
  | {
      container: "root";
      index: number;
    }
  | {
      container: "grid";
      gridIndex: number;
      index: number;
    };

type RemovalResult = {
  components: PageComponent[];
  moved: PageComponent;
};

function clampIndex(index: number, max: number): number {
  if (index < 0) {
    return 0;
  }

  if (index > max) {
    return max;
  }

  return index;
}

function isGrid(
  component: PageComponent | undefined,
): component is Extract<PageComponent, { componentType: "grid" }> {
  return component?.componentType === "grid";
}

function removeFromSource(
  components: PageComponent[],
  source: DragLocation,
): RemovalResult | null {
  if (source.container === "root") {
    const moved = components[source.index];

    if (!moved) {
      return null;
    }

    return {
      moved,
      components: components.filter((_, index) => index !== source.index),
    };
  }

  const grid = components[source.gridIndex];

  if (!isGrid(grid)) {
    return null;
  }

  const moved = grid.props.components[source.index];

  if (!moved) {
    return null;
  }

  return {
    moved,
    components: components.map((entry, index) => {
      if (index !== source.gridIndex || !isGrid(entry)) {
        return entry;
      }

      return {
        componentType: "grid",
        props: {
          ...entry.props,
          components: entry.props.components.filter(
            (_, childIndex) => childIndex !== source.index,
          ),
        },
      };
    }),
  };
}

function adjustDropLocation(
  source: DragLocation,
  destination: DropLocation,
): DropLocation {
  if (source.container === "root" && destination.container === "root") {
    if (source.index < destination.index) {
      return {
        container: "root",
        index: destination.index - 1,
      };
    }

    return destination;
  }

  if (source.container === "root" && destination.container === "grid") {
    if (source.index < destination.gridIndex) {
      return {
        container: "grid",
        gridIndex: destination.gridIndex - 1,
        index: destination.index,
      };
    }

    return destination;
  }

  if (source.container === "grid" && destination.container === "grid") {
    if (
      source.gridIndex === destination.gridIndex &&
      source.index < destination.index
    ) {
      return {
        container: "grid",
        gridIndex: destination.gridIndex,
        index: destination.index - 1,
      };
    }

    return destination;
  }

  return destination;
}

function insertToDestination(
  components: PageComponent[],
  moved: PageComponent,
  destination: DropLocation,
): PageComponent[] {
  if (destination.container === "root") {
    const next = [...components];
    const index = clampIndex(destination.index, next.length);
    next.splice(index, 0, moved);
    return next;
  }

  if (moved.componentType === "grid") {
    return components;
  }

  const grid = components[destination.gridIndex];

  if (!isGrid(grid)) {
    return components;
  }

  return components.map((entry, index) => {
    if (index !== destination.gridIndex || !isGrid(entry)) {
      return entry;
    }

    const nextChildren = [...entry.props.components];
    const insertionIndex = clampIndex(destination.index, nextChildren.length);
    nextChildren.splice(insertionIndex, 0, moved);

    return {
      componentType: "grid",
      props: {
        ...entry.props,
        components: nextChildren,
      },
    };
  });
}

export function movePageComponent(
  components: PageComponent[],
  source: DragLocation,
  destination: DropLocation,
): PageComponent[] {
  if (destination.container === "grid" && source.container === "root") {
    const candidate = components[source.index];

    if (candidate?.componentType === "grid") {
      return components;
    }
  }

  const removed = removeFromSource(components, source);

  if (!removed) {
    return components;
  }

  const adjustedDestination = adjustDropLocation(source, destination);

  return insertToDestination(
    removed.components,
    removed.moved,
    adjustedDestination,
  );
}
