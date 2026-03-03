import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository } from "../ports/cms";

type ArchivePageInput = {
  sessionId: string;
  pageId: string;
};

type ArchivePageDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export const ARCHIVE_UNAUTHORIZED_ERROR = "Unauthorized";
export const ARCHIVE_FORBIDDEN_ERROR = "Forbidden";
export const ARCHIVE_NOT_FOUND_ERROR = "Page not found";

export async function archivePage(
  input: ArchivePageInput,
  dependencies: ArchivePageDependencies,
): Promise<{ pageId: string; status: "ARCHIVED"; version: number }> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(ARCHIVE_UNAUTHORIZED_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(ARCHIVE_UNAUTHORIZED_ERROR);
  }

  const page = await dependencies.pageRepository.findById(input.pageId);

  if (!page) {
    throw new Error(ARCHIVE_NOT_FOUND_ERROR);
  }

  if (user.role !== "admin" && page.createdBy !== user.id) {
    throw new Error(ARCHIVE_FORBIDDEN_ERROR);
  }

  const updated = await dependencies.pageRepository.update(page.id, {
    status: "ARCHIVED",
    updatedBy: user.id,
    version: page.version + 1,
  });

  if (!updated) {
    throw new Error(ARCHIVE_NOT_FOUND_ERROR);
  }

  return {
    pageId: updated.id,
    status: "ARCHIVED",
    version: updated.version,
  };
}
