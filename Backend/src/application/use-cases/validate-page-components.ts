import type { ComponentInstance } from "../../domain/cms/page";
import {
  PageInputValidationError,
  type ValidationFieldError,
} from "./page-input-validation-error";

export const INVALID_PAGE_COMPONENTS_ERROR = "Invalid page components";

function throwPageComponentsError(fieldErrors: ValidationFieldError[]): never {
  throw new PageInputValidationError(
    INVALID_PAGE_COMPONENTS_ERROR,
    fieldErrors,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredString(
  input: Record<string, unknown>,
  field: string,
): string | null {
  const value = input[field];

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalString(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalBoolean(
  input: Record<string, unknown>,
  field: string,
): boolean | undefined {
  const value = input[field];

  if (typeof value !== "boolean") {
    return undefined;
  }

  return value;
}

function normalizeRichTextProps(
  componentPath: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const html = requiredString(props, "html");

  if (!html) {
    throwPageComponentsError([
      {
        path: `${componentPath}.props.html`,
        code: "REQUIRED",
        message: "Rich text HTML is required",
      },
    ]);
  }

  return { html };
}

function normalizeImageProps(
  componentPath: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const mediaId = requiredString(props, "mediaId");
  const alt = requiredString(props, "alt");
  const url = requiredString(props, "url");
  const caption = optionalString(props, "caption");

  const fieldErrors: ValidationFieldError[] = [];

  if (!mediaId) {
    fieldErrors.push({
      path: `${componentPath}.props.mediaId`,
      code: "REQUIRED",
      message: "Image selection is required",
    });
  }

  if (!alt) {
    fieldErrors.push({
      path: `${componentPath}.props.alt`,
      code: "REQUIRED",
      message: "Alt text is required",
    });
  }

  if (!url) {
    fieldErrors.push({
      path: `${componentPath}.props.url`,
      code: "REQUIRED",
      message: "Image URL is required",
    });
  }

  if (fieldErrors.length > 0) {
    throwPageComponentsError(fieldErrors);
  }

  return {
    mediaId,
    alt,
    url,
    ...(caption ? { caption } : {}),
  };
}

function normalizeTextImageProps(
  componentPath: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const text = requiredString(props, "text");
  const mediaId = requiredString(props, "mediaId");
  const alt = requiredString(props, "alt");
  const url = requiredString(props, "url");
  const layout = requiredString(props, "layout");
  const title = optionalString(props, "title");

  const fieldErrors: ValidationFieldError[] = [];

  if (!text) {
    fieldErrors.push({
      path: `${componentPath}.props.text`,
      code: "REQUIRED",
      message: "Text content is required",
    });
  }

  if (!mediaId) {
    fieldErrors.push({
      path: `${componentPath}.props.mediaId`,
      code: "REQUIRED",
      message: "Image selection is required",
    });
  }

  if (!alt) {
    fieldErrors.push({
      path: `${componentPath}.props.alt`,
      code: "REQUIRED",
      message: "Alt text is required",
    });
  }

  if (!url) {
    fieldErrors.push({
      path: `${componentPath}.props.url`,
      code: "REQUIRED",
      message: "Image URL is required",
    });
  }

  if (layout !== "imageLeft" && layout !== "imageRight") {
    fieldErrors.push({
      path: `${componentPath}.props.layout`,
      code: "INVALID_ENUM",
      message: "Layout must be imageLeft or imageRight",
    });
  }

  if (fieldErrors.length > 0) {
    throwPageComponentsError(fieldErrors);
  }

  return {
    ...(title ? { title } : {}),
    text,
    mediaId,
    alt,
    url,
    layout,
  };
}

function normalizeQuoteProps(
  componentPath: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const quote = requiredString(props, "quote");
  const author = optionalString(props, "author");

  if (!quote) {
    throwPageComponentsError([
      {
        path: `${componentPath}.props.quote`,
        code: "REQUIRED",
        message: "Quote text is required",
      },
    ]);
  }

  return {
    quote,
    ...(author ? { author } : {}),
  };
}

function normalizeButtonProps(
  componentPath: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const label = requiredString(props, "label");
  const url = requiredString(props, "url");
  const openInNewTab = optionalBoolean(props, "openInNewTab");

  const fieldErrors: ValidationFieldError[] = [];

  if (!label) {
    fieldErrors.push({
      path: `${componentPath}.props.label`,
      code: "REQUIRED",
      message: "Button text is required",
    });
  }

  if (!url) {
    fieldErrors.push({
      path: `${componentPath}.props.url`,
      code: "REQUIRED",
      message: "Button URL is required",
    });
  }

  if (
    props["openInNewTab"] !== undefined &&
    typeof props["openInNewTab"] !== "boolean"
  ) {
    fieldErrors.push({
      path: `${componentPath}.props.openInNewTab`,
      code: "INVALID_TYPE",
      message: "openInNewTab must be a boolean",
    });
  }

  if (fieldErrors.length > 0) {
    throwPageComponentsError(fieldErrors);
  }

  return {
    label,
    url,
    openInNewTab: openInNewTab ?? false,
  };
}

function normalizeHeadlineProps(
  componentPath: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const text = requiredString(props, "text");
  const level = requiredString(props, "level");

  const fieldErrors: ValidationFieldError[] = [];

  if (!text) {
    fieldErrors.push({
      path: `${componentPath}.props.text`,
      code: "REQUIRED",
      message: "Headline text is required",
    });
  }

  if (
    level !== "h1" &&
    level !== "h2" &&
    level !== "h3" &&
    level !== "h4" &&
    level !== "h5" &&
    level !== "h6"
  ) {
    fieldErrors.push({
      path: `${componentPath}.props.level`,
      code: "INVALID_ENUM",
      message: "Headline level must be h1, h2, h3, h4, h5 or h6",
    });
  }

  if (fieldErrors.length > 0) {
    throwPageComponentsError(fieldErrors);
  }

  return {
    text,
    level,
  };
}

function normalizeGridProps(
  componentPath: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const width = requiredString(props, "width");
  const contentAlign = requiredString(props, "contentAlign");
  const selfAlign = requiredString(props, "selfAlign");
  const nestedComponents = props["components"];

  const fieldErrors: ValidationFieldError[] = [];

  if (width !== "100" && width !== "50" && width !== "33" && width !== "25") {
    fieldErrors.push({
      path: `${componentPath}.props.width`,
      code: "INVALID_ENUM",
      message: "Width must be 100, 50, 33 or 25",
    });
  }

  if (
    contentAlign !== "left" &&
    contentAlign !== "center" &&
    contentAlign !== "right"
  ) {
    fieldErrors.push({
      path: `${componentPath}.props.contentAlign`,
      code: "INVALID_ENUM",
      message: "contentAlign must be left, center or right",
    });
  }

  if (selfAlign !== "left" && selfAlign !== "center" && selfAlign !== "right") {
    fieldErrors.push({
      path: `${componentPath}.props.selfAlign`,
      code: "INVALID_ENUM",
      message: "selfAlign must be left, center or right",
    });
  }

  if (!Array.isArray(nestedComponents)) {
    fieldErrors.push({
      path: `${componentPath}.props.components`,
      code: "INVALID_ARRAY",
      message: "Grid components must be an array",
    });
  }

  if (fieldErrors.length > 0) {
    throwPageComponentsError(fieldErrors);
  }

  const nestedComponentList = nestedComponents as unknown[];

  const normalizedNested = normalizeAndValidateComponentsInternal(
    nestedComponentList,
    `${componentPath}.props.components`,
    { allowGrid: false },
  );

  return {
    width,
    contentAlign,
    selfAlign,
    components: normalizedNested,
  };
}

type NormalizeOptions = {
  allowGrid: boolean;
};

function normalizePropsByType(
  componentPath: string,
  componentType: string,
  props: Record<string, unknown>,
  options: NormalizeOptions,
): Record<string, unknown> {
  if (componentType === "richText") {
    return normalizeRichTextProps(componentPath, props);
  }

  if (componentType === "image") {
    return normalizeImageProps(componentPath, props);
  }

  if (componentType === "textImage") {
    return normalizeTextImageProps(componentPath, props);
  }

  if (componentType === "quote") {
    return normalizeQuoteProps(componentPath, props);
  }

  if (componentType === "button") {
    return normalizeButtonProps(componentPath, props);
  }

  if (componentType === "headline") {
    return normalizeHeadlineProps(componentPath, props);
  }

  if (componentType === "grid") {
    if (!options.allowGrid) {
      throwPageComponentsError([
        {
          path: `${componentPath}.componentType`,
          code: "UNSUPPORTED_COMPONENT_TYPE",
          message: "Nested grid component is not supported",
        },
      ]);
    }

    return normalizeGridProps(componentPath, props);
  }

  throwPageComponentsError([
    {
      path: `${componentPath}.componentType`,
      code: "UNSUPPORTED_COMPONENT_TYPE",
      message: "Unsupported component type",
    },
  ]);
}

function normalizeAndValidateComponentsInternal(
  components: unknown[],
  pathPrefix: string,
  options: NormalizeOptions,
): ComponentInstance[] {
  return components.map((component, index) => {
    const componentPath = `${pathPrefix}[${index}]`;

    if (!isRecord(component)) {
      throwPageComponentsError([
        {
          path: `${componentPath}.componentType`,
          code: "REQUIRED",
          message: "Component type is required",
        },
      ]);
    }

    const componentTypeRaw = component["componentType"];
    const propsRaw = component["props"];

    if (typeof componentTypeRaw !== "string") {
      throwPageComponentsError([
        {
          path: `${componentPath}.componentType`,
          code: "REQUIRED",
          message: "Component type is required",
        },
      ]);
    }

    const componentType = componentTypeRaw.trim();

    if (!componentType || !isRecord(propsRaw)) {
      throwPageComponentsError([
        {
          path: `${componentPath}.props`,
          code: "INVALID_OBJECT",
          message: "Component props must be an object",
        },
      ]);
    }

    const props = normalizePropsByType(
      componentPath,
      componentType,
      propsRaw,
      options,
    );

    return {
      componentType,
      props,
    };
  });
}

export function normalizeAndValidateComponents(
  components: ComponentInstance[],
): ComponentInstance[] {
  return normalizeAndValidateComponentsInternal(components, "components", {
    allowGrid: true,
  });
}
