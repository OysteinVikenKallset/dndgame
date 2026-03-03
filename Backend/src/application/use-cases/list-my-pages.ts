import type { SessionService, UserRepository } from "../ports/auth";
import type { CmsPageRepository } from "../ports/cms";

type ListMyPagesInput = {
  sessionId: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  locale?: string;
  sort?: "updatedAt:desc" | "updatedAt:asc";
  cursor?: string;
  limit?: number;
};

type ListMyPagesDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export const LIST_UNAUTHORIZED_ERROR = "Unauthorized";
export const INVALID_LIST_INPUT_ERROR = "Invalid list input";

export async function listMyPages(
  input: ListMyPagesInput,
  dependencies: ListMyPagesDependencies,
): Promise<{
  items: Array<{
    id: string;
    slug: string;
    title: string;
    locale: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    template: "page" | "post";
    createdBy: string;
    createdByDisplayName?: string;
    createdByUsername?: string;
    updatedAt: string;
    publishedAt?: string;
    version: number;
  }>;
  meta: {
    nextCursor?: string;
    total: number;
  };
}> {
  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(LIST_UNAUTHORIZED_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(LIST_UNAUTHORIZED_ERROR);
  }

  const normalizedLimit = input.limit ?? 20;

  if (normalizedLimit < 1 || normalizedLimit > 100) {
    throw new Error(INVALID_LIST_INPUT_ERROR);
  }

  const result = await dependencies.pageRepository.listByOwner!({
    ...(user.role === "admin" ? {} : { ownerId: user.id }),
    ...(input.status ? { status: input.status } : {}),
    ...(input.locale ? { locale: input.locale } : {}),
    ...(input.sort ? { sort: input.sort } : {}),
    ...(input.cursor ? { cursor: input.cursor } : {}),
    limit: normalizedLimit,
  });

  const ownerIds = Array.from(
    new Set(result.items.map((page) => page.createdBy)),
  );
  const ownerDisplayNameMap = new Map<string, string>();
  const ownerUsernameMap = new Map<string, string>();

  await Promise.all(
    ownerIds.map(async (ownerId) => {
      const owner = await dependencies.userRepository.findById(ownerId);

      if (!owner) {
        return;
      }

      const ownerDisplayName = owner.displayName?.trim();
      const ownerUsername = owner.email.split("@")[0]?.trim();

      if (ownerDisplayName) {
        ownerDisplayNameMap.set(ownerId, ownerDisplayName);
      }

      if (ownerUsername) {
        ownerUsernameMap.set(ownerId, ownerUsername);
      }
    }),
  );

  return {
    items: result.items.map((page) => {
      const ownerDisplayName = ownerDisplayNameMap.get(page.createdBy);
      const ownerUsername = ownerUsernameMap.get(page.createdBy);

      return {
        id: page.id,
        slug: page.slug,
        title: page.title,
        locale: page.locale,
        status: page.status,
        template: page.template === "post" ? "post" : "page",
        createdBy: page.createdBy,
        ...(typeof ownerDisplayName === "string"
          ? { createdByDisplayName: ownerDisplayName }
          : {}),
        ...(typeof ownerUsername === "string"
          ? { createdByUsername: ownerUsername }
          : {}),
        updatedAt: page.updatedAt,
        ...(page.publishedAt ? { publishedAt: page.publishedAt } : {}),
        version: page.version,
      };
    }),
    meta: {
      ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
      total: result.total,
    },
  };
}
