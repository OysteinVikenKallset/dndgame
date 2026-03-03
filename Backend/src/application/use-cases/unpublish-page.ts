import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository } from "../ports/cms";

type UnpublishPageInput = {
  sessionId: string;
  pageId: string;
};

type UnpublishPageDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export const UNAUTHORIZED_UNPUBLISH_ERROR = "Unauthorized";
export const FORBIDDEN_UNPUBLISH_ERROR = "Forbidden";
export const UNPUBLISH_PAGE_NOT_FOUND_ERROR = "Page not found";
export const UNPUBLISH_INVALID_STATE_ERROR = "Page is not published";

export async function unpublishPage(
  input: UnpublishPageInput,
  dependencies: UnpublishPageDependencies,
): Promise<{ pageId: string; status: "DRAFT"; version: number }> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(UNAUTHORIZED_UNPUBLISH_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(UNAUTHORIZED_UNPUBLISH_ERROR);
  }

  const page = await dependencies.pageRepository.findById(input.pageId);

  if (!page) {
    throw new Error(UNPUBLISH_PAGE_NOT_FOUND_ERROR);
  }

  if (user.role !== "admin" && page.createdBy !== user.id) {
    throw new Error(FORBIDDEN_UNPUBLISH_ERROR);
  }

  if (page.status !== "PUBLISHED") {
    throw new Error(UNPUBLISH_INVALID_STATE_ERROR);
  }

  const updated = await dependencies.pageRepository.update(page.id, {
    status: "DRAFT",
    updatedBy: user.id,
    publishedAt: null,
    version: page.version + 1,
  });

  if (!updated) {
    throw new Error(UNPUBLISH_PAGE_NOT_FOUND_ERROR);
  }

  return {
    pageId: updated.id,
    status: "DRAFT",
    version: updated.version,
  };
}
