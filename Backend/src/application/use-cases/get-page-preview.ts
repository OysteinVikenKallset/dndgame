import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository } from "../ports/cms";

type GetPagePreviewInput = {
  sessionId: string;
  pageId: string;
};

type GetPagePreviewDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export const PREVIEW_UNAUTHORIZED_ERROR = "Unauthorized";
export const PREVIEW_FORBIDDEN_ERROR = "Forbidden";
export const PREVIEW_PAGE_NOT_FOUND_ERROR = "Page not found";

export async function getPagePreview(
  input: GetPagePreviewInput,
  dependencies: GetPagePreviewDependencies,
): Promise<{
  id: string;
  slug: string;
  locale: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  components?: Array<{
    componentType: string;
    props: Record<string, unknown>;
  }>;
  bodyRichText?: string;
}> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(PREVIEW_UNAUTHORIZED_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(PREVIEW_UNAUTHORIZED_ERROR);
  }

  const page = await dependencies.pageRepository.findById(input.pageId);

  if (!page) {
    throw new Error(PREVIEW_PAGE_NOT_FOUND_ERROR);
  }

  if (page.createdBy !== user.id) {
    throw new Error(PREVIEW_FORBIDDEN_ERROR);
  }

  return {
    id: page.id,
    slug: page.slug,
    locale: page.locale,
    title: page.title,
    status: page.status,
    version: page.version,
    ...(page.components ? { components: page.components } : {}),
    ...(page.bodyRichText ? { bodyRichText: page.bodyRichText } : {}),
  };
}
