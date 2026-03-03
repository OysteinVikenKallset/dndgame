import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository } from "../ports/cms";
import type { ComponentInstance } from "../../domain/cms/page";
import { normalizeAndValidateComponents } from "./validate-page-components";
import { PageInputValidationError } from "./page-input-validation-error";

type UpdatePageInput = {
  sessionId: string;
  pageId: string;
  version: number;
  title?: string;
  slug?: string;
  template?: "page" | "post";
  showInNav?: boolean;
  components?: ComponentInstance[];
  bodyRichText?: string;
};

type UpdatePageDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export const UPDATE_UNAUTHORIZED_ERROR = "Unauthorized";
export const UPDATE_FORBIDDEN_ERROR = "Forbidden";
export const UPDATE_PAGE_NOT_FOUND_ERROR = "Page not found";
export const UPDATE_VERSION_CONFLICT_ERROR = "Version conflict";
export const UPDATE_INVALID_INPUT_ERROR = "Invalid page input";
export const UPDATE_SLUG_CONFLICT_ERROR = "Slug already in use";
export const UPDATE_SLUG_CHANGE_FORBIDDEN_ERROR =
  "Cannot change slug for published page";

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function isValidTemplate(template: string): template is "page" | "post" {
  return template === "page" || template === "post";
}

export async function updatePage(
  input: UpdatePageInput,
  dependencies: UpdatePageDependencies,
): Promise<{
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  updatedAt: string;
}> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(UPDATE_UNAUTHORIZED_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(UPDATE_UNAUTHORIZED_ERROR);
  }

  const page = await dependencies.pageRepository.findById(input.pageId);

  if (!page) {
    throw new Error(UPDATE_PAGE_NOT_FOUND_ERROR);
  }

  if (user.role !== "admin" && page.createdBy !== user.id) {
    throw new Error(UPDATE_FORBIDDEN_ERROR);
  }

  if (input.version !== page.version) {
    throw new Error(UPDATE_VERSION_CONFLICT_ERROR);
  }

  const normalizedTitle = input.title?.trim();
  const normalizedSlug = input.slug?.trim().toLowerCase();
  const normalizedTemplate = input.template?.trim().toLowerCase();
  const normalizedShowInNav = input.showInNav;
  let normalizedComponents: ComponentInstance[] | undefined;

  if (input.components !== undefined) {
    try {
      normalizedComponents = normalizeAndValidateComponents(input.components);
    } catch (error) {
      if (error instanceof PageInputValidationError) {
        throw new PageInputValidationError(
          UPDATE_INVALID_INPUT_ERROR,
          error.fieldErrors,
        );
      }

      throw new Error(UPDATE_INVALID_INPUT_ERROR);
    }
  }

  if (input.title !== undefined && !normalizedTitle) {
    throw new Error(UPDATE_INVALID_INPUT_ERROR);
  }

  if (input.slug !== undefined && !normalizedSlug) {
    throw new Error(UPDATE_INVALID_INPUT_ERROR);
  }

  if (normalizedSlug && !isValidSlug(normalizedSlug)) {
    throw new Error(UPDATE_INVALID_INPUT_ERROR);
  }

  if (
    normalizedTemplate !== undefined &&
    !isValidTemplate(normalizedTemplate)
  ) {
    throw new Error(UPDATE_INVALID_INPUT_ERROR);
  }

  if (
    normalizedShowInNav !== undefined &&
    typeof normalizedShowInNav !== "boolean"
  ) {
    throw new Error(UPDATE_INVALID_INPUT_ERROR);
  }

  if (
    normalizedSlug &&
    page.status === "PUBLISHED" &&
    normalizedSlug !== page.slug
  ) {
    throw new Error(UPDATE_SLUG_CHANGE_FORBIDDEN_ERROR);
  }

  if (normalizedSlug && normalizedSlug !== page.slug) {
    const existing = await dependencies.pageRepository.findBySlugAndLocale(
      normalizedSlug,
      page.locale,
    );

    if (existing && existing.id !== page.id && existing.status !== "ARCHIVED") {
      throw new Error(UPDATE_SLUG_CONFLICT_ERROR);
    }
  }

  const updated = await dependencies.pageRepository.update(input.pageId, {
    expectedVersion: page.version,
    ...(normalizedSlug ? { slug: normalizedSlug } : {}),
    ...(normalizedTitle ? { title: normalizedTitle } : {}),
    ...(normalizedTemplate ? { template: normalizedTemplate } : {}),
    ...(normalizedShowInNav !== undefined
      ? { showInNav: normalizedShowInNav }
      : {}),
    ...(normalizedComponents !== undefined
      ? { components: normalizedComponents }
      : {}),
    ...(input.bodyRichText !== undefined
      ? { bodyRichText: input.bodyRichText }
      : {}),
    updatedBy: user.id,
    version: page.version + 1,
  });

  if (!updated) {
    const latest = await dependencies.pageRepository.findById(input.pageId);

    if (latest) {
      throw new Error(UPDATE_VERSION_CONFLICT_ERROR);
    }

    throw new Error(UPDATE_PAGE_NOT_FOUND_ERROR);
  }

  return {
    id: updated.id,
    slug: updated.slug,
    title: updated.title,
    locale: updated.locale,
    status: updated.status,
    version: updated.version,
    updatedAt: updated.updatedAt,
  };
}
