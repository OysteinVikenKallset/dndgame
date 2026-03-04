import type { CmsPage, PagePublicationSnapshot } from "../../domain/cms/page";

export type CmsPageRepository = {
  findById(pageId: string): Promise<CmsPage | null>;
  findBySlugAndLocale(slug: string, locale: string): Promise<CmsPage | null>;
  listByOwner?(input: {
    ownerId?: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    locale?: string;
    sort?: "updatedAt:desc" | "updatedAt:asc";
    limit: number;
    cursor?: string;
  }): Promise<{ items: CmsPage[]; nextCursor?: string; total: number }>;
  create(input: {
    slug: string;
    title: string;
    locale: string;
    createdBy: string;
    template?: "page" | "post";
    showTitle?: boolean;
    showInNav?: boolean;
    contentSchemaVersion: number;
    components?: Array<{
      componentType: string;
      props: Record<string, unknown>;
    }>;
    bodyRichText?: string;
  }): Promise<CmsPage>;
  update(
    pageId: string,
    input: {
      expectedVersion?: number;
      slug?: string;
      title?: string;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      template?: "page" | "post";
      showTitle?: boolean;
      showInNav?: boolean;
      updatedBy: string;
      publishedAt?: string | null;
      version?: number;
      components?: Array<{
        componentType: string;
        props: Record<string, unknown>;
      }>;
      bodyRichText?: string;
    },
  ): Promise<CmsPage | null>;
  deleteById?(pageId: string): Promise<boolean>;
};

export type CmsPublicationRepository = {
  listLatestByLocale(input: { locale: string; limit: number }): Promise<
    Array<{
      pageId: string;
      slug: string;
      locale: string;
      title: string;
      template?: "page" | "post";
      showTitle?: boolean;
      showInNav?: boolean;
      createdAt?: string;
      publishedAt: string;
    }>
  >;
  createSnapshot(input: {
    pageId: string;
    slug: string;
    locale: string;
    title: string;
    template?: "page" | "post";
    showTitle?: boolean;
    showInNav?: boolean;
    createdAt?: string;
    publishedAt: string;
    publishedVersion: number;
    components?: Array<{
      componentType: string;
      props: Record<string, unknown>;
    }>;
    bodyRichText?: string;
  }): Promise<PagePublicationSnapshot>;
  findLatestBySlugAndLocale(
    slug: string,
    locale: string,
  ): Promise<PagePublicationSnapshot | null>;
  deleteSnapshotsByPageId?(pageId: string): Promise<void>;
};
