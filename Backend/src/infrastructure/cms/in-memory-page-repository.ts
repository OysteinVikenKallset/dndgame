import type {
  CmsPageRepository,
  CmsPublicationRepository,
} from "../../application/ports/cms";
import type {
  CmsPage,
  ComponentInstance,
  PagePublicationSnapshot,
} from "../../domain/cms/page";

type CreatePageInput = {
  slug: string;
  title: string;
  locale: string;
  createdBy: string;
  contentSchemaVersion: number;
  components?: ComponentInstance[];
  bodyRichText?: string;
};

type UpdatePageInput = {
  expectedVersion?: number;
  slug?: string;
  title?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedBy: string;
  publishedAt?: string | null;
  version?: number;
  components?: ComponentInstance[];
  bodyRichText?: string;
};

export class InMemoryPageRepository implements CmsPageRepository {
  constructor(private readonly pages: CmsPage[] = []) {}

  async findById(pageId: string): Promise<CmsPage | null> {
    const page = this.pages.find((entry) => entry.id === pageId);
    return page ?? null;
  }

  async findBySlugAndLocale(
    slug: string,
    locale: string,
  ): Promise<CmsPage | null> {
    const page = this.pages.find(
      (entry) => entry.slug === slug && entry.locale === locale,
    );
    return page ?? null;
  }

  async listByOwner(input: {
    ownerId?: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    locale?: string;
    sort?: "updatedAt:desc" | "updatedAt:asc";
    limit: number;
    cursor?: string;
  }): Promise<{ items: CmsPage[]; nextCursor?: string; total: number }> {
    const filtered = this.pages.filter((page) => {
      if (input.ownerId && page.createdBy !== input.ownerId) {
        return false;
      }

      if (input.status && page.status !== input.status) {
        return false;
      }

      if (input.locale && page.locale !== input.locale) {
        return false;
      }

      return true;
    });

    const sort = input.sort ?? "updatedAt:desc";

    filtered.sort((left, right) => {
      if (sort === "updatedAt:asc") {
        return left.updatedAt.localeCompare(right.updatedAt);
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });

    let startIndex = 0;

    if (input.cursor) {
      const cursorIndex = filtered.findIndex(
        (entry) => entry.id === input.cursor,
      );
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const limit = Math.max(1, input.limit);
    const items = filtered.slice(startIndex, startIndex + limit);
    const nextItem = filtered[startIndex + limit];

    return {
      items,
      ...(nextItem ? { nextCursor: nextItem.id } : {}),
      total: filtered.length,
    };
  }

  async create(input: CreatePageInput): Promise<CmsPage> {
    const now = new Date().toISOString();
    const page: CmsPage = {
      id: `page-${this.pages.length + 1}`,
      slug: input.slug,
      title: input.title,
      locale: input.locale,
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      version: 1,
      contentSchemaVersion: input.contentSchemaVersion,
      ...(input.components ? { components: input.components } : {}),
      ...(input.bodyRichText ? { bodyRichText: input.bodyRichText } : {}),
    };

    this.pages.push(page);
    return page;
  }

  async update(
    pageId: string,
    input: UpdatePageInput,
  ): Promise<CmsPage | null> {
    const pageIndex = this.pages.findIndex((entry) => entry.id === pageId);

    if (pageIndex === -1) {
      return null;
    }

    const current = this.pages[pageIndex] as CmsPage;

    if (
      input.expectedVersion !== undefined &&
      current.version !== input.expectedVersion
    ) {
      return null;
    }

    const now = new Date().toISOString();

    const updatedPage: CmsPage = {
      ...current,
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.components !== undefined
        ? { components: input.components }
        : {}),
      ...(input.bodyRichText !== undefined
        ? { bodyRichText: input.bodyRichText }
        : {}),
      updatedAt: now,
      updatedBy: input.updatedBy,
      version: input.version ?? current.version + 1,
    };

    if (typeof input.publishedAt === "string") {
      updatedPage.publishedAt = input.publishedAt;
    }

    if (input.publishedAt === null) {
      delete updatedPage.publishedAt;
    }

    this.pages[pageIndex] = updatedPage;
    return updatedPage;
  }
}

export class InMemoryPublicationRepository implements CmsPublicationRepository {
  constructor(private readonly snapshots: PagePublicationSnapshot[] = []) {}

  async listLatestByLocale(input: { locale: string; limit: number }): Promise<
    Array<{
      pageId: string;
      slug: string;
      locale: string;
      title: string;
      publishedAt: string;
    }>
  > {
    const latestBySlug = new Map<string, PagePublicationSnapshot>();

    for (const snapshot of this.snapshots) {
      if (snapshot.locale !== input.locale) {
        continue;
      }

      latestBySlug.set(snapshot.slug, snapshot);
    }

    return Array.from(latestBySlug.values())
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
      .slice(0, Math.max(1, input.limit))
      .map((snapshot) => ({
        pageId: snapshot.pageId,
        slug: snapshot.slug,
        locale: snapshot.locale,
        title: snapshot.title,
        publishedAt: snapshot.publishedAt,
      }));
  }

  async createSnapshot(input: {
    pageId: string;
    slug: string;
    locale: string;
    title: string;
    publishedAt: string;
    publishedVersion: number;
    components?: ComponentInstance[];
    bodyRichText?: string;
  }): Promise<PagePublicationSnapshot> {
    const snapshot: PagePublicationSnapshot = {
      id: `snapshot-${this.snapshots.length + 1}`,
      pageId: input.pageId,
      slug: input.slug,
      locale: input.locale,
      title: input.title,
      publishedAt: input.publishedAt,
      publishedVersion: input.publishedVersion,
      ...(input.components ? { components: input.components } : {}),
      ...(input.bodyRichText ? { bodyRichText: input.bodyRichText } : {}),
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  async findLatestBySlugAndLocale(
    slug: string,
    locale: string,
  ): Promise<PagePublicationSnapshot | null> {
    for (let index = this.snapshots.length - 1; index >= 0; index -= 1) {
      const snapshot = this.snapshots[index];

      if (snapshot && snapshot.slug === slug && snapshot.locale === locale) {
        return snapshot;
      }
    }

    return null;
  }
}
