import type { CmsPublicationRepository } from "../ports/cms";
import type { ComponentInstance } from "../../domain/cms/page";

type GetPublicPageBySlugInput = {
  slug: string;
  locale: string;
};

type GetPublicPageBySlugDependencies = {
  publicationRepository: CmsPublicationRepository;
};

export const PUBLIC_PAGE_NOT_FOUND_ERROR = "Page not found";

export async function getPublicPageBySlug(
  input: GetPublicPageBySlugInput,
  dependencies: GetPublicPageBySlugDependencies,
): Promise<{
  id: string;
  slug: string;
  locale: string;
  title: string;
  template?: "page" | "post";
  createdAt?: string;
  publishedAt: string;
  components?: ComponentInstance[];
  bodyRichText?: string;
}> {
  const normalizedSlug = input.slug.trim().toLowerCase();
  const normalizedLocale = input.locale.trim() || "en";

  const snapshot =
    await dependencies.publicationRepository.findLatestBySlugAndLocale(
      normalizedSlug,
      normalizedLocale,
    );

  if (!snapshot) {
    throw new Error(PUBLIC_PAGE_NOT_FOUND_ERROR);
  }

  return {
    id: snapshot.pageId,
    slug: snapshot.slug,
    locale: snapshot.locale,
    title: snapshot.title,
    ...((snapshot.template ?? "page") === "post"
      ? {
          template: "post" as const,
          createdAt: snapshot.createdAt ?? snapshot.publishedAt,
        }
      : {}),
    publishedAt: snapshot.publishedAt,
    ...(snapshot.components ? { components: snapshot.components } : {}),
    ...(snapshot.bodyRichText ? { bodyRichText: snapshot.bodyRichText } : {}),
  };
}
