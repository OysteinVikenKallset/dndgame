export type CmsComponentInstance = {
  componentType: string;
  props: Record<string, unknown>;
};

export type CmsPublicPage = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  showTitle?: boolean;
  showInNav?: boolean;
  template?: "page" | "post";
  createdAt?: string;
  publishedAt: string;
  components?: CmsComponentInstance[];
  bodyRichText?: string;
};

export type CmsPublicMenuSection = {
  all: boolean;
  slugs: string[];
};

export type CmsPublicSettings = {
  homepageSlug: string | null;
  menu: {
    header: CmsPublicMenuSection;
    footer: CmsPublicMenuSection;
  };
};

type CmsEnvelope = {
  data?: CmsPublicPage;
  error?: {
    code?: string;
    message?: string;
  };
};

type CmsPagesEnvelope = {
  data?: {
    items?: Array<{
      pageId: string;
      slug: string;
      locale: string;
      title: string;
      showTitle?: boolean;
      showInNav?: boolean;
      template?: "page" | "post";
      createdAt?: string;
      publishedAt: string;
    }>;
    total?: number;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type CmsSettingsEnvelope = {
  data?: {
    homepageSlug?: string | null;
    menu?: {
      header?: {
        all?: boolean;
        slugs?: string[];
      };
      footer?: {
        all?: boolean;
        slugs?: string[];
      };
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type GetPageInput = {
  slug: string;
  locale: string;
};

type GetRelatedPagesInput = {
  locale: string;
  excludeSlug: string;
};

type GetPublishedPagesInput = {
  locale: string;
  limit?: number;
};

type ResolveHomepageSlugInput = {
  locale: string;
};

const DEFAULT_CMS_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_CMS_ADMIN_URL = "http://127.0.0.1:5173/pages";
const CMS_ASSET_PROXY_PREFIX = "/api/cms-assets";

function getCmsBaseUrl(): string {
  const configured = process.env["CMS_BASE_URL"]?.trim();
  const baseUrl =
    configured && configured.length > 0 ? configured : DEFAULT_CMS_BASE_URL;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function toCmsAssetUrl(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/^\/+/, "");
  return `${CMS_ASSET_PROXY_PREFIX}/${normalizedPath}`;
}

function getRelatedSlugsConfig(): string[] {
  const raw = process.env["CMS_RELATED_SLUGS"]?.trim();

  if (!raw) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
}

function getHomepageSlugConfig(): string | null {
  const raw = process.env["CMS_HOME_SLUG"]?.trim();

  if (!raw) {
    return null;
  }

  return raw.replace(/^\/+|\/+$/g, "");
}

export function getCmsAdminUrl(): string {
  const configured = process.env["CMS_ADMIN_URL"]?.trim();

  if (!configured) {
    return DEFAULT_CMS_ADMIN_URL;
  }

  return configured;
}

export async function getPublicPageBySlug({
  slug,
  locale,
}: GetPageInput): Promise<CmsPublicPage | null> {
  const query = new URLSearchParams({ locale });
  const encodedSlug = slug
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const url = `${getCmsBaseUrl()}/api/content/pages/${encodedSlug}?${query.toString()}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error("Could not reach CMS API");
  }

  let envelope: CmsEnvelope = {};

  try {
    envelope = (await response.json()) as CmsEnvelope;
  } catch {
    envelope = {};
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const message =
      envelope.error?.message ?? `CMS request failed (${response.status})`;
    throw new Error(message);
  }

  if (!envelope.data) {
    return null;
  }

  return envelope.data;
}

export async function getRelatedPages({
  locale,
  excludeSlug,
}: GetRelatedPagesInput): Promise<CmsPublicPage[]> {
  const relatedSlugs = getRelatedSlugsConfig().filter(
    (slug) => slug !== excludeSlug,
  );

  if (relatedSlugs.length === 0) {
    return [];
  }

  const pages = await Promise.all(
    relatedSlugs.map((slug) => getPublicPageBySlug({ slug, locale })),
  );

  return pages.filter((page): page is CmsPublicPage => page !== null);
}

export async function getPublishedPages({
  locale,
  limit = 100,
}: GetPublishedPagesInput): Promise<CmsPublicPage[]> {
  const query = new URLSearchParams({
    locale,
    limit: String(limit),
  });

  const url = `${getCmsBaseUrl()}/api/content/pages?${query.toString()}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    return [];
  }

  let envelope: CmsPagesEnvelope = {};

  try {
    envelope = (await response.json()) as CmsPagesEnvelope;
  } catch {
    envelope = {};
  }

  if (!response.ok || !Array.isArray(envelope.data?.items)) {
    return [];
  }

  return envelope.data.items.map((entry) => ({
    id: entry.pageId,
    slug: entry.slug,
    locale: entry.locale,
    title: entry.title,
    ...(typeof entry.showTitle === "boolean"
      ? { showTitle: entry.showTitle }
      : {}),
    ...(typeof entry.showInNav === "boolean"
      ? { showInNav: entry.showInNav }
      : {}),
    ...(entry.template ? { template: entry.template } : {}),
    ...(entry.createdAt ? { createdAt: entry.createdAt } : {}),
    publishedAt: entry.publishedAt,
  }));
}

export async function resolveHomepageSlug({
  locale,
}: ResolveHomepageSlugInput): Promise<string | null> {
  const settings = await getPublicSettings({ locale });

  if (settings.homepageSlug) {
    return settings.homepageSlug;
  }

  const configured = getHomepageSlugConfig();

  if (configured) {
    return configured;
  }

  const pages = await getPublishedPages({ locale, limit: 1 });

  if (pages.length === 0) {
    return null;
  }

  return pages[0]?.slug ?? null;
}

export async function getPublicSettings({
  locale,
}: ResolveHomepageSlugInput): Promise<CmsPublicSettings> {
  const fallback: CmsPublicSettings = {
    homepageSlug: null,
    menu: {
      header: {
        all: true,
        slugs: [],
      },
      footer: {
        all: true,
        slugs: [],
      },
    },
  };

  const settingsQuery = new URLSearchParams({ locale });
  const settingsUrl = `${getCmsBaseUrl()}/api/content/settings?${settingsQuery.toString()}`;

  try {
    const settingsResponse = await fetch(settingsUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (settingsResponse.ok) {
      let settingsEnvelope: CmsSettingsEnvelope = {};

      try {
        settingsEnvelope =
          (await settingsResponse.json()) as CmsSettingsEnvelope;
      } catch {
        settingsEnvelope = {};
      }

      const configuredSlug = settingsEnvelope.data?.homepageSlug;

      const headerAll = settingsEnvelope.data?.menu?.header?.all;
      const headerSlugs = settingsEnvelope.data?.menu?.header?.slugs;
      const footerAll = settingsEnvelope.data?.menu?.footer?.all;
      const footerSlugs = settingsEnvelope.data?.menu?.footer?.slugs;

      return {
        homepageSlug:
          typeof configuredSlug === "string" && configuredSlug.trim().length > 0
            ? configuredSlug.trim()
            : null,
        menu: {
          header: {
            all: typeof headerAll === "boolean" ? headerAll : true,
            slugs: Array.isArray(headerSlugs)
              ? headerSlugs.filter(
                  (entry): entry is string => typeof entry === "string",
                )
              : [],
          },
          footer: {
            all: typeof footerAll === "boolean" ? footerAll : true,
            slugs: Array.isArray(footerSlugs)
              ? footerSlugs.filter(
                  (entry): entry is string => typeof entry === "string",
                )
              : [],
          },
        },
      };
    }
  } catch {
    return fallback;
  }

  return fallback;
}
