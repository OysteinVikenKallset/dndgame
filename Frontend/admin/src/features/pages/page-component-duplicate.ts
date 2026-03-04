import type { PageComponent } from "../common/types";

export type DuplicateLocation =
  | {
      container: "root";
      index: number;
    }
  | {
      container: "grid";
      gridIndex: number;
      index: number;
    };

function cloneComponent(component: PageComponent): PageComponent {
  if (component.componentType === "richText") {
    return {
      componentType: "richText",
      props: {
        html: component.props.html,
      },
    };
  }

  if (component.componentType === "image") {
    return {
      componentType: "image",
      props: {
        mediaId: component.props.mediaId,
        url: component.props.url,
        alt: component.props.alt,
        ...(component.props.caption
          ? { caption: component.props.caption }
          : {}),
      },
    };
  }

  if (component.componentType === "textImage") {
    return {
      componentType: "textImage",
      props: {
        ...(component.props.title ? { title: component.props.title } : {}),
        text: component.props.text,
        mediaId: component.props.mediaId,
        url: component.props.url,
        alt: component.props.alt,
        layout: component.props.layout,
      },
    };
  }

  if (component.componentType === "quote") {
    return {
      componentType: "quote",
      props: {
        quote: component.props.quote,
        ...(component.props.author ? { author: component.props.author } : {}),
      },
    };
  }

  if (component.componentType === "button") {
    return {
      componentType: "button",
      props: {
        label: component.props.label,
        url: component.props.url,
        openInNewTab: component.props.openInNewTab,
      },
    };
  }

  if (component.componentType === "headline") {
    return {
      componentType: "headline",
      props: {
        text: component.props.text,
        level: component.props.level,
      },
    };
  }

  return {
    componentType: "grid",
    props: {
      width: component.props.width,
      contentAlign: component.props.contentAlign,
      selfAlign: component.props.selfAlign,
      components: component.props.components.map(cloneComponent),
    },
  };
}

export function duplicatePageComponent(
  components: PageComponent[],
  location: DuplicateLocation,
): PageComponent[] {
  if (location.container === "root") {
    const source = components[location.index];

    if (!source) {
      return components;
    }

    const copy = cloneComponent(source);
    const next = [...components];
    next.splice(location.index + 1, 0, copy);
    return next;
  }

  const parent = components[location.gridIndex];

  if (!parent || parent.componentType !== "grid") {
    return components;
  }

  const source = parent.props.components[location.index];

  if (!source) {
    return components;
  }

  const copy = cloneComponent(source);

  return components.map((entry, index) => {
    if (index !== location.gridIndex || entry.componentType !== "grid") {
      return entry;
    }

    const nextChildren = [...entry.props.components];
    nextChildren.splice(location.index + 1, 0, copy);

    return {
      componentType: "grid",
      props: {
        ...entry.props,
        components: nextChildren,
      },
    };
  });
}
