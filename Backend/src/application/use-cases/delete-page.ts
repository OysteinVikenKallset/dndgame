import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository, CmsPublicationRepository } from "../ports/cms";

type DeletePageInput = {
  sessionId: string;
  pageId: string;
};

type DeletePageDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
  publicationRepository: CmsPublicationRepository;
};

export const DELETE_UNAUTHORIZED_ERROR = "Unauthorized";
export const DELETE_FORBIDDEN_ERROR = "Forbidden";
export const DELETE_NOT_FOUND_ERROR = "Page not found";
export const DELETE_INVALID_STATE_ERROR = "Only archived pages can be deleted";

export async function deletePage(
  input: DeletePageInput,
  dependencies: DeletePageDependencies,
): Promise<{ pageId: string; deleted: true }> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(DELETE_UNAUTHORIZED_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(DELETE_UNAUTHORIZED_ERROR);
  }

  const page = await dependencies.pageRepository.findById(input.pageId);

  if (!page) {
    throw new Error(DELETE_NOT_FOUND_ERROR);
  }

  if (user.role !== "admin" && page.createdBy !== user.id) {
    throw new Error(DELETE_FORBIDDEN_ERROR);
  }

  if (page.status !== "ARCHIVED") {
    throw new Error(DELETE_INVALID_STATE_ERROR);
  }

  if (!dependencies.pageRepository.deleteById) {
    throw new Error("Delete not supported");
  }

  await dependencies.publicationRepository.deleteSnapshotsByPageId?.(page.id);

  const deleted = await dependencies.pageRepository.deleteById(page.id);

  if (!deleted) {
    throw new Error(DELETE_NOT_FOUND_ERROR);
  }

  return {
    pageId: page.id,
    deleted: true,
  };
}
