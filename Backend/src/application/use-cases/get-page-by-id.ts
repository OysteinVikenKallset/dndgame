import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository } from "../ports/cms";

type GetPageByIdInput = {
  sessionId: string;
  pageId: string;
};

type GetPageByIdDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export const GET_PAGE_UNAUTHORIZED_ERROR = "Unauthorized";
export const GET_PAGE_FORBIDDEN_ERROR = "Forbidden";
export const GET_PAGE_NOT_FOUND_ERROR = "Page not found";

export async function getPageById(
  input: GetPageByIdInput,
  dependencies: GetPageByIdDependencies,
): Promise<{
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  template?: "page" | "post";
  showInNav?: boolean;
  version: number;
  updatedAt: string;
  publishedAt?: string;
  components?: Array<{
    componentType: string;
    props: Record<string, unknown>;
  }>;
  bodyRichText?: string;
}> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(GET_PAGE_UNAUTHORIZED_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(GET_PAGE_UNAUTHORIZED_ERROR);
  }

  const page = await dependencies.pageRepository.findById(input.pageId);

  if (!page) {
    throw new Error(GET_PAGE_NOT_FOUND_ERROR);
  }

  if (user.role !== "admin" && page.createdBy !== user.id) {
    throw new Error(GET_PAGE_FORBIDDEN_ERROR);
  }

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    locale: page.locale,
    status: page.status,
    ...(page.template === "post" ? { template: "post" as const } : {}),
    ...(page.showInNav === false ? { showInNav: false } : {}),
    version: page.version,
    updatedAt: page.updatedAt,
    ...(page.publishedAt ? { publishedAt: page.publishedAt } : {}),
    ...(page.components ? { components: page.components } : {}),
    ...(page.bodyRichText ? { bodyRichText: page.bodyRichText } : {}),
  };
}
