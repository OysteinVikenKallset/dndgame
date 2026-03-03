import type { FieldErrors, PageFormValues } from "./types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function generateSlugFromTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validatePageInput(values: PageFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required";
  }

  if (!values.slug.trim()) {
    errors.slug = "Slug is required";
  } else if (!SLUG_PATTERN.test(values.slug)) {
    errors.slug =
      "Slug must be lowercase and use letters, numbers, and hyphens";
  }

  if (!Array.isArray(values.components) || values.components.length === 0) {
    errors.components = "At least one component is required";
  }

  return errors;
}
