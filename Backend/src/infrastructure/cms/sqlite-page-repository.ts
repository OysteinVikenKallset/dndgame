import type {
  CmsPageRepository,
  CmsPublicationRepository,
} from "../../application/ports/cms";
import type {
  CmsPage,
  ComponentInstance,
  PagePublicationSnapshot,
} from "../../domain/cms/page";
import type Database from "better-sqlite3";

type PageRow = {
  id: number;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  template: "page" | "post";
  show_in_nav: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string;
  updated_by: string;
  version: number;
  content_schema_version: number;
  components_json: string | null;
  body_rich_text: string | null;
};

type SnapshotRow = {
  id: number;
  page_id: string;
  slug: string;
  locale: string;
  title: string;
  template: "page" | "post";
  show_in_nav: number | null;
  created_at: string | null;
  published_at: string;
  published_version: number;
  components_json: string | null;
  body_rich_text: string | null;
};

function toPageId(dbId: number): string {
  return `page-${dbId}`;
}

function toDbPageId(pageId: string): number | null {
  const match = /^page-(\d+)$/.exec(pageId);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseComponents(raw: string | null): ComponentInstance[] | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed as ComponentInstance[];
  } catch {
    return undefined;
  }
}

function mapPage(row: PageRow | undefined): CmsPage | null {
  if (!row) {
    return null;
  }

  const components = parseComponents(row.components_json);

  return {
    id: toPageId(row.id),
    slug: row.slug,
    title: row.title,
    locale: row.locale,
    status: row.status,
    template: row.template,
    showInNav: row.show_in_nav === 0 ? false : true,
    createdAt: row.created_at ?? row.published_at,
    updatedAt: row.updated_at,
    ...(row.published_at ? { publishedAt: row.published_at } : {}),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    version: row.version,
    contentSchemaVersion: row.content_schema_version,
    ...(components !== undefined ? { components } : {}),
    ...(row.body_rich_text !== null
      ? { bodyRichText: row.body_rich_text }
      : {}),
  };
}

function mapSnapshot(
  row: SnapshotRow | undefined,
): PagePublicationSnapshot | null {
  if (!row) {
    return null;
  }

  const components = parseComponents(row.components_json);

  return {
    id: `snapshot-${row.id}`,
    pageId: row.page_id,
    slug: row.slug,
    locale: row.locale,
    title: row.title,
    template: row.template,
    showInNav: row.show_in_nav === 0 ? false : true,
    createdAt: row.created_at ?? row.published_at,
    publishedAt: row.published_at,
    publishedVersion: row.published_version,
    ...(components !== undefined ? { components } : {}),
    ...(row.body_rich_text !== null
      ? { bodyRichText: row.body_rich_text }
      : {}),
  };
}

export class SqlitePageRepository implements CmsPageRepository {
  constructor(private readonly db: Database.Database) {}

  async findById(pageId: string): Promise<CmsPage | null> {
    const dbPageId = toDbPageId(pageId);
    if (!dbPageId) {
      return null;
    }

    const row = this.db
      .prepare(
        `SELECT id, slug, title, locale, status, created_at, updated_at, published_at,
          template, show_in_nav, created_by, updated_by, version, content_schema_version,
                components_json, body_rich_text
         FROM pages
         WHERE id = ?`,
      )
      .get(dbPageId) as PageRow | undefined;

    return mapPage(row);
  }

  async findBySlugAndLocale(
    slug: string,
    locale: string,
  ): Promise<CmsPage | null> {
    const row = this.db
      .prepare(
        `SELECT id, slug, title, locale, status, created_at, updated_at, published_at,
          template, show_in_nav, created_by, updated_by, version, content_schema_version,
                components_json, body_rich_text
         FROM pages
         WHERE slug = ? AND locale = ?
         ORDER BY id DESC
         LIMIT 1`,
      )
      .get(slug, locale) as PageRow | undefined;

    return mapPage(row);
  }

  async listByOwner(input: {
    ownerId?: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    locale?: string;
    sort?: "updatedAt:desc" | "updatedAt:asc";
    limit: number;
    cursor?: string;
  }): Promise<{ items: CmsPage[]; nextCursor?: string; total: number }> {
    const parameters: unknown[] = [];
    const whereClauses: string[] = [];

    if (input.ownerId) {
      whereClauses.push("created_by = ?");
      parameters.push(input.ownerId);
    }

    if (input.status) {
      whereClauses.push("status = ?");
      parameters.push(input.status);
    }

    if (input.locale) {
      whereClauses.push("locale = ?");
      parameters.push(input.locale);
    }

    const rows = this.db
      .prepare(
        `SELECT id, slug, title, locale, status, created_at, updated_at, published_at,
          template, show_in_nav, created_by, updated_by, version, content_schema_version,
                components_json, body_rich_text
         FROM pages
         ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""}`,
      )
      .all(...parameters) as PageRow[];

    const mapped = rows
      .map((row) => mapPage(row))
      .filter((row): row is CmsPage => row !== null);

    const sort = input.sort ?? "updatedAt:desc";

    mapped.sort((left, right) => {
      if (sort === "updatedAt:asc") {
        return left.updatedAt.localeCompare(right.updatedAt);
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });

    let startIndex = 0;

    if (input.cursor) {
      const cursorIndex = mapped.findIndex(
        (entry) => entry.id === input.cursor,
      );
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const limit = Math.max(1, input.limit);
    const items = mapped.slice(startIndex, startIndex + limit);
    const nextItem = mapped[startIndex + limit];

    return {
      items,
      ...(nextItem ? { nextCursor: nextItem.id } : {}),
      total: mapped.length,
    };
  }

  async create(input: {
    slug: string;
    title: string;
    locale: string;
    createdBy: string;
    template?: "page" | "post";
    showInNav?: boolean;
    contentSchemaVersion: number;
    components?: Array<{
      componentType: string;
      props: Record<string, unknown>;
    }>;
    bodyRichText?: string;
  }): Promise<CmsPage> {
    const now = new Date().toISOString();

    const result = this.db
      .prepare(
        `INSERT INTO pages (
           slug, title, locale, status,
           template, show_in_nav,
           created_at, updated_at,
           created_by, updated_by,
           version, content_schema_version,
           components_json, body_rich_text
         )
         VALUES (?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      )
      .run(
        input.slug,
        input.title,
        input.locale,
        input.template ?? "page",
        input.showInNav === false ? 0 : 1,
        now,
        now,
        input.createdBy,
        input.createdBy,
        input.contentSchemaVersion,
        input.components ? JSON.stringify(input.components) : null,
        input.bodyRichText ?? null,
      );

    const insertedId = Number(result.lastInsertRowid);

    const created = await this.findById(toPageId(insertedId));

    if (!created) {
      throw new Error("Failed to read created page");
    }

    return created;
  }

  async update(
    pageId: string,
    input: {
      expectedVersion?: number;
      slug?: string;
      title?: string;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      template?: "page" | "post";
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
  ): Promise<CmsPage | null> {
    const dbPageId = toDbPageId(pageId);

    if (!dbPageId) {
      return null;
    }

    const current = await this.findById(pageId);

    if (!current) {
      return null;
    }

    const now = new Date().toISOString();
    const nextVersion = input.version ?? current.version + 1;

    const nextSlug = input.slug ?? current.slug;
    const nextTitle = input.title ?? current.title;
    const nextStatus = input.status ?? current.status;
    const nextTemplate = input.template ?? current.template;
    const nextShowInNav = input.showInNav ?? current.showInNav ?? true;
    const nextPublishedAt =
      input.publishedAt !== undefined
        ? input.publishedAt
        : (current.publishedAt ?? null);
    const nextComponents =
      input.components !== undefined ? input.components : current.components;
    const nextBodyRichText =
      input.bodyRichText !== undefined
        ? input.bodyRichText
        : (current.bodyRichText ?? null);

    const runResult =
      input.expectedVersion !== undefined
        ? this.db
            .prepare(
              `UPDATE pages
               SET slug = ?,
                   title = ?,
                   status = ?,
                   template = ?,
                   show_in_nav = ?,
                   updated_at = ?,
                   published_at = ?,
                   updated_by = ?,
                   version = ?,
                   components_json = ?,
                   body_rich_text = ?
               WHERE id = ? AND version = ?`,
            )
            .run(
              nextSlug,
              nextTitle,
              nextStatus,
              nextTemplate,
              nextShowInNav === false ? 0 : 1,
              now,
              nextPublishedAt,
              input.updatedBy,
              nextVersion,
              nextComponents ? JSON.stringify(nextComponents) : null,
              nextBodyRichText,
              dbPageId,
              input.expectedVersion,
            )
        : this.db
            .prepare(
              `UPDATE pages
               SET slug = ?,
                   title = ?,
                   status = ?,
                   template = ?,
                   show_in_nav = ?,
                   updated_at = ?,
                   published_at = ?,
                   updated_by = ?,
                   version = ?,
                   components_json = ?,
                   body_rich_text = ?
               WHERE id = ?`,
            )
            .run(
              nextSlug,
              nextTitle,
              nextStatus,
              nextTemplate,
              nextShowInNav === false ? 0 : 1,
              now,
              nextPublishedAt,
              input.updatedBy,
              nextVersion,
              nextComponents ? JSON.stringify(nextComponents) : null,
              nextBodyRichText,
              dbPageId,
            );

    if (runResult.changes === 0) {
      return null;
    }

    return this.findById(pageId);
  }

  async deleteById(pageId: string): Promise<boolean> {
    const dbPageId = toDbPageId(pageId);

    if (!dbPageId) {
      return false;
    }

    const result = this.db
      .prepare(`DELETE FROM pages WHERE id = ?`)
      .run(dbPageId);

    return result.changes > 0;
  }
}

export class SqlitePublicationRepository implements CmsPublicationRepository {
  constructor(private readonly db: Database.Database) {}

  async listLatestByLocale(input: { locale: string; limit: number }): Promise<
    Array<{
      pageId: string;
      slug: string;
      locale: string;
      title: string;
      template: "page" | "post";
      showInNav: boolean;
      createdAt: string;
      publishedAt: string;
    }>
  > {
    const rows = this.db
      .prepare(
        `SELECT ps.page_id, ps.slug, ps.locale, ps.title, ps.template, p.show_in_nav, ps.created_at, ps.published_at
         FROM publication_snapshots ps
         INNER JOIN pages p ON p.id = CAST(SUBSTR(ps.page_id, 6) AS INTEGER)
         INNER JOIN (
           SELECT slug, locale, MAX(id) AS max_id
           FROM publication_snapshots
           WHERE locale = ?
           GROUP BY slug, locale
         ) latest ON latest.max_id = ps.id
         WHERE p.status = 'PUBLISHED'
         ORDER BY ps.published_at DESC
         LIMIT ?`,
      )
      .all(input.locale, input.limit) as Array<{
      page_id: string;
      slug: string;
      locale: string;
      title: string;
      template: "page" | "post";
      show_in_nav: number;
      created_at: string;
      published_at: string;
    }>;

    return rows.map((row) => ({
      pageId: row.page_id,
      slug: row.slug,
      locale: row.locale,
      title: row.title,
      template: row.template,
      showInNav: row.show_in_nav === 0 ? false : true,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    }));
  }

  async createSnapshot(input: {
    pageId: string;
    slug: string;
    locale: string;
    title: string;
    template: "page" | "post";
    showInNav?: boolean;
    createdAt: string;
    publishedAt: string;
    publishedVersion: number;
    components?: Array<{
      componentType: string;
      props: Record<string, unknown>;
    }>;
    bodyRichText?: string;
  }): Promise<PagePublicationSnapshot> {
    const result = this.db
      .prepare(
        `INSERT INTO publication_snapshots (
           page_id, slug, locale, title, template, created_at, published_at,
           show_in_nav, published_version, components_json, body_rich_text
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.pageId,
        input.slug,
        input.locale,
        input.title,
        input.template,
        input.createdAt,
        input.publishedAt,
        input.showInNav === false ? 0 : 1,
        input.publishedVersion,
        input.components ? JSON.stringify(input.components) : null,
        input.bodyRichText ?? null,
      );

    const insertedId = Number(result.lastInsertRowid);

    const row = this.db
      .prepare(
        `SELECT id, page_id, slug, locale, title, template, show_in_nav, created_at, published_at, published_version,
                components_json, body_rich_text
         FROM publication_snapshots
         WHERE id = ?`,
      )
      .get(insertedId) as SnapshotRow | undefined;

    const snapshot = mapSnapshot(row);

    if (!snapshot) {
      throw new Error("Failed to read created publication snapshot");
    }

    return snapshot;
  }

  async findLatestBySlugAndLocale(
    slug: string,
    locale: string,
  ): Promise<PagePublicationSnapshot | null> {
    const row = this.db
      .prepare(
        `SELECT id, page_id, slug, locale, title, template, show_in_nav, created_at, published_at, published_version,
                components_json, body_rich_text
         FROM publication_snapshots
         WHERE slug = ? AND locale = ?
           AND EXISTS (
             SELECT 1
             FROM pages p
             WHERE p.id = CAST(SUBSTR(publication_snapshots.page_id, 6) AS INTEGER)
               AND p.status = 'PUBLISHED'
           )
         ORDER BY id DESC
         LIMIT 1`,
      )
      .get(slug, locale) as SnapshotRow | undefined;

    return mapSnapshot(row);
  }

  async deleteSnapshotsByPageId(pageId: string): Promise<void> {
    this.db
      .prepare(`DELETE FROM publication_snapshots WHERE page_id = ?`)
      .run(pageId);
  }
}
