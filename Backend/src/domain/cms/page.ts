export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type PageTemplate = "page" | "post";

export type ComponentInstance = {
  componentType: string;
  props: Record<string, unknown>;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: PageStatus;
  template?: PageTemplate;
  showTitle?: boolean;
  showInNav?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  contentSchemaVersion: number;
  components?: ComponentInstance[];
  bodyRichText?: string;
};

export type PagePublicationSnapshot = {
  id: string;
  pageId: string;
  slug: string;
  locale: string;
  title: string;
  template?: PageTemplate;
  showTitle?: boolean;
  showInNav?: boolean;
  createdAt?: string;
  publishedAt: string;
  publishedVersion: number;
  components?: ComponentInstance[];
  bodyRichText?: string;
};
