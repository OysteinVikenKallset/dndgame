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

function normalizePropsByType(
  componentPath: string,
  componentType: string,
  props: Record<string, unknown>,
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

  throwPageComponentsError([
    {
      path: `${componentPath}.componentType`,
      code: "UNSUPPORTED_COMPONENT_TYPE",
      message: "Unsupported component type",
    },
  ]);
}

export function normalizeAndValidateComponents(
  components: ComponentInstance[],
): ComponentInstance[] {
  return components.map((component, index) => {
    const componentPath = `components[${index}]`;

    if (!component || typeof component.componentType !== "string") {
      throwPageComponentsError([
        {
          path: `${componentPath}.componentType`,
          code: "REQUIRED",
          message: "Component type is required",
        },
      ]);
    }

    const componentType = component.componentType.trim();

    if (!componentType || !isRecord(component.props)) {
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
      component.props,
    );

    return {
      componentType,
      props,
    };
  });
}
