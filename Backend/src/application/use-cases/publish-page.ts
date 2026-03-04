import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository, CmsPublicationRepository } from "../ports/cms";

type PublishPageInput = {
  sessionId: string;
  pageId: string;
};

type PublishPageDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
  publicationRepository: CmsPublicationRepository;
};

export const UNAUTHORIZED_PUBLISH_ERROR = "Unauthorized";
export const FORBIDDEN_PUBLISH_ERROR = "Forbidden";
export const PAGE_NOT_FOUND_ERROR = "Page not found";

export async function publishPage(
  input: PublishPageInput,
  dependencies: PublishPageDependencies,
): Promise<{
  pageId: string;
  slug: string;
  locale: string;
  publishedAt: string;
}> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(UNAUTHORIZED_PUBLISH_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(UNAUTHORIZED_PUBLISH_ERROR);
  }

  const page = await dependencies.pageRepository.findById(input.pageId);

  if (!page) {
    throw new Error(PAGE_NOT_FOUND_ERROR);
  }

  if (user.role !== "admin" && page.createdBy !== user.id) {
    throw new Error(FORBIDDEN_PUBLISH_ERROR);
  }

  const publishedAt = new Date().toISOString();

  const updatedPage = await dependencies.pageRepository.update(page.id, {
    status: "PUBLISHED",
    updatedBy: user.id,
    publishedAt,
  });

  if (!updatedPage) {
    throw new Error(PAGE_NOT_FOUND_ERROR);
  }

  await dependencies.publicationRepository.createSnapshot({
    pageId: updatedPage.id,
    slug: updatedPage.slug,
    locale: updatedPage.locale,
    title: updatedPage.title,
    ...(updatedPage.template ? { template: updatedPage.template } : {}),
    ...(updatedPage.showTitle === false
      ? { showTitle: false }
      : { showTitle: true }),
    ...(updatedPage.showInNav === false
      ? { showInNav: false }
      : { showInNav: true }),
    ...(updatedPage.createdAt ? { createdAt: updatedPage.createdAt } : {}),
    publishedAt,
    publishedVersion: updatedPage.version,
    ...(updatedPage.components ? { components: updatedPage.components } : {}),
    ...(updatedPage.bodyRichText
      ? { bodyRichText: updatedPage.bodyRichText }
      : {}),
  });

  return {
    pageId: updatedPage.id,
    slug: updatedPage.slug,
    locale: updatedPage.locale,
    publishedAt,
  };
}
