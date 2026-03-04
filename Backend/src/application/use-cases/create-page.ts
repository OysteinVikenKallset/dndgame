import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository } from "../ports/cms";
import type { ComponentInstance } from "../../domain/cms/page";
import { normalizeAndValidateComponents } from "./validate-page-components";
import { PageInputValidationError } from "./page-input-validation-error";

type CreatePageInput = {
  sessionId: string;
  slug: string;
  title: string;
  locale: string;
  template?: "page" | "post";
  showTitle?: boolean;
  showInNav?: boolean;
  components?: ComponentInstance[];
  bodyRichText?: string;
};

type CreatePageDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export const UNAUTHORIZED_ERROR = "Unauthorized";
export const INVALID_PAGE_INPUT_ERROR = "Invalid page input";
export const SLUG_CONFLICT_ERROR = "Slug already in use";

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function isValidTemplate(template: string): template is "page" | "post" {
  return template === "page" || template === "post";
}

export async function createPage(
  input: CreatePageInput,
  dependencies: CreatePageDependencies,
): Promise<{
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT";
  version: number;
}> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const normalizedSlug = input.slug.trim().toLowerCase();
  const normalizedTitle = input.title.trim();
  const normalizedLocale = input.locale.trim() || "en";
  const normalizedTemplate = (input.template ?? "page").trim().toLowerCase();
  const normalizedShowTitle = input.showTitle ?? true;
  const normalizedShowInNav = input.showInNav ?? true;
  let normalizedComponents: ComponentInstance[] | undefined;

  if (input.components !== undefined) {
    try {
      normalizedComponents = normalizeAndValidateComponents(input.components);
    } catch (error) {
      if (error instanceof PageInputValidationError) {
        throw new PageInputValidationError(
          INVALID_PAGE_INPUT_ERROR,
          error.fieldErrors,
        );
      }

      throw new Error(INVALID_PAGE_INPUT_ERROR);
    }
  }

  if (
    !isValidSlug(normalizedSlug) ||
    normalizedTitle.length === 0 ||
    normalizedLocale.length === 0 ||
    !isValidTemplate(normalizedTemplate) ||
    typeof normalizedShowTitle !== "boolean" ||
    typeof normalizedShowInNav !== "boolean"
  ) {
    throw new Error(INVALID_PAGE_INPUT_ERROR);
  }

  if (normalizedComponents !== undefined && normalizedComponents.length === 0) {
    throw new Error(INVALID_PAGE_INPUT_ERROR);
  }

  const existing = await dependencies.pageRepository.findBySlugAndLocale(
    normalizedSlug,
    normalizedLocale,
  );

  if (existing && existing.status !== "ARCHIVED") {
    throw new Error(SLUG_CONFLICT_ERROR);
  }

  const page = await dependencies.pageRepository.create({
    slug: normalizedSlug,
    title: normalizedTitle,
    locale: normalizedLocale,
    createdBy: user.id,
    template: normalizedTemplate,
    showTitle: normalizedShowTitle,
    showInNav: normalizedShowInNav,
    contentSchemaVersion: 1,
    ...(normalizedComponents !== undefined
      ? { components: normalizedComponents }
      : {}),
    ...(input.bodyRichText ? { bodyRichText: input.bodyRichText } : {}),
  });

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    locale: page.locale,
    status: "DRAFT",
    version: page.version,
  };
}
