type ApiFieldError = {
  path?: string;
  code?: string;
  message?: string;
};

export type ApiError = {
  status: number;
  code: string;
  message: string;
  fieldErrors: ApiFieldError[];
};

type ApiSuccessResult<TData> = {
  ok: true;
  data: TData;
  csrfToken: string | null;
  error: null;
};

type ApiFailureResult = {
  ok: false;
  data: null;
  csrfToken: string | null;
  error: ApiError;
};

export type ApiResult<TData> = ApiSuccessResult<TData> | ApiFailureResult;

export type MeDto = {
  id: string;
  email: string;
  displayName: string;
  role?: "admin" | "editor" | "viewer";
  csrfToken?: string;
};

export type UpdateMyProfileDto = {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  displayName: string;
  avatarUrl?: string;
};

export type PageListItemDto = {
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
};

export type PageListMetaDto = {
  nextCursor?: string;
  total: number;
};

export type PageListDto = {
  items: PageListItemDto[];
  meta: PageListMetaDto;
};

export type PageDetailsDto = {
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  template?: "page" | "post";
  showTitle?: boolean;
  showInNav?: boolean;
  components?: Array<{
    componentType: string;
    props: Record<string, unknown>;
  }>;
  version: number;
  updatedAt: string;
  publishedAt?: string;
  bodyRichText?: string;
};

export type CreatePageDto = {
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT";
  version: number;
};

export type UpdatePageDto = {
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  updatedAt: string;
};

export type PublishPageDto = {
  pageId: string;
  slug: string;
  locale: string;
  publishedAt: string;
};

export type ArchivePageDto = {
  pageId: string;
  status: "ARCHIVED";
  version: number;
};

export type UnpublishPageDto = {
  pageId: string;
  status: "DRAFT";
  version: number;
};

export type DeletePageDto = {
  pageId: string;
  deleted: true;
};

export type PreviewPageDto = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  components?: Array<{
    componentType: string;
    props: Record<string, unknown>;
  }>;
  bodyRichText?: string;
};

export type MediaAssetDto = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  url: string;
};

export type CmsSettingsDto = {
  homepagePageId: string | null;
  headerMenuAll: boolean;
  headerMenuPageIds: string[];
  footerMenuAll: boolean;
  footerMenuPageIds: string[];
};

export type UpdateSettingsInput = {
  homepagePageId?: string | null;
  headerMenuAll?: boolean;
  headerMenuPageIds?: string[];
  footerMenuAll?: boolean;
  footerMenuPageIds?: string[];
};

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  csrfToken?: string | null;
  isMutation?: boolean;
};

type ApiEnvelopeBody = {
  data?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    fieldErrors?: unknown;
  };
};

function readCookie(name: string): string | null {
  const encoded = encodeURIComponent(name);
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${encoded}=`));

  if (!cookie) {
    return null;
  }

  const value = cookie.slice(encoded.length + 1);
  return decodeURIComponent(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractCsrfToken(response: Response, body: unknown): string | null {
  const headerToken = response.headers.get("x-csrf-token");
  if (headerToken && headerToken.trim().length > 0) {
    return headerToken;
  }

  const parsedBody = asRecord(body);
  const data = asRecord(parsedBody?.["data"]);
  const bodyToken = data?.["csrfToken"];

  if (typeof bodyToken === "string" && bodyToken.trim().length > 0) {
    return bodyToken;
  }

  const cookieToken = readCookie("XSRF-TOKEN");
  if (cookieToken && cookieToken.trim().length > 0) {
    return cookieToken;
  }

  return null;
}

function toApiError(status: number, body: unknown): ApiError {
  const parsedBody = asRecord(body);
  const parsedError = asRecord(parsedBody?.["error"]);
  const code = parsedError?.["code"];
  const message = parsedError?.["message"];
  const rawFieldErrors = parsedError?.["fieldErrors"];
  const fieldErrors = Array.isArray(rawFieldErrors)
    ? (rawFieldErrors as ApiFieldError[])
    : [];

  if (typeof code === "string" && typeof message === "string") {
    return {
      status,
      code,
      message,
      fieldErrors,
    };
  }

  return {
    status,
    code: "UNKNOWN_ERROR",
    message: "Something went wrong.",
    fieldErrors: [],
  };
}

function toUnknownApiError(message: string): ApiError {
  return {
    status: 0,
    code: "NETWORK_ERROR",
    message,
    fieldErrors: [],
  };
}

export async function apiRequest<TData = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<TData>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.isMutation) {
    headers["X-CSRF-Token"] = options.csrfToken ?? "";
  }

  try {
    const response = await fetch(path, {
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    let body: ApiEnvelopeBody | null = null;

    if (text) {
      try {
        body = JSON.parse(text) as ApiEnvelopeBody;
      } catch {
        body = null;
      }
    }

    const csrfToken = extractCsrfToken(response, body);

    if (!response.ok) {
      return {
        ok: false,
        error: toApiError(response.status, body),
        csrfToken,
        data: null,
      };
    }

    return {
      ok: true,
      data: (body?.data ?? null) as TData,
      csrfToken,
      error: null,
    };
  } catch {
    return {
      ok: false,
      error: toUnknownApiError("Could not reach API"),
      csrfToken: null,
      data: null,
    };
  }
}

type ListPagesQuery = {
  status?: string;
  cursor?: string;
  limit?: number;
};

const MIN_PAGE_LIST_LIMIT = 1;
const MAX_PAGE_LIST_LIMIT = 100;

function normalizeListLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  if (limit < MIN_PAGE_LIST_LIMIT) {
    return MIN_PAGE_LIST_LIMIT;
  }

  if (limit > MAX_PAGE_LIST_LIMIT) {
    return MAX_PAGE_LIST_LIMIT;
  }

  return Math.trunc(limit);
}

export const api = {
  getMe: () => apiRequest<MeDto>("/api/auth/me"),
  login: (
    input: { email: string; password: string },
    csrfToken?: string | null,
  ) =>
    apiRequest<{ user: MeDto }>("/api/auth/login", {
      method: "POST",
      body: input,
      csrfToken,
      isMutation: true,
    }),
  logout: (csrfToken?: string | null) =>
    apiRequest<null>("/api/auth/logout", {
      method: "POST",
      body: {},
      csrfToken,
      isMutation: true,
    }),
  updateMyProfile: (
    input: {
      email?: string;
      role?: "admin" | "editor" | "viewer";
      displayName?: string;
    },
    csrfToken?: string | null,
  ) =>
    apiRequest<UpdateMyProfileDto>("/api/users/me", {
      method: "PATCH",
      body: input,
      csrfToken,
      isMutation: true,
    }),
  listPages: ({ status, cursor, limit = 20 }: ListPagesQuery) => {
    const normalizedLimit = normalizeListLimit(limit);
    const query = new URLSearchParams({
      sort: "updatedAt:desc",
      locale: "en",
      limit: String(normalizedLimit),
    });

    if (status && status !== "ALL") {
      query.set("status", status);
    }

    if (cursor) {
      query.set("cursor", cursor);
    }

    return apiRequest<PageListDto>(`/api/pages?${query.toString()}`);
  },
  createPage: (
    input: {
      title: string;
      slug: string;
      locale: string;
      template: "page" | "post";
      showTitle: boolean;
      showInNav: boolean;
      components?: Array<{
        componentType: string;
        props: Record<string, unknown>;
      }>;
      bodyRichText: string;
    },
    csrfToken?: string | null,
  ) =>
    apiRequest<CreatePageDto>("/api/pages", {
      method: "POST",
      body: input,
      csrfToken,
      isMutation: true,
    }),
  getPageById: (pageId: string) =>
    apiRequest<PageDetailsDto>(`/api/pages/${pageId}`),
  updatePage: (
    pageId: string,
    input: {
      version: number;
      title: string;
      slug: string;
      template: "page" | "post";
      showTitle: boolean;
      showInNav: boolean;
      components?: Array<{
        componentType: string;
        props: Record<string, unknown>;
      }>;
      bodyRichText: string;
    },
    csrfToken?: string | null,
  ) =>
    apiRequest<UpdatePageDto>(`/api/pages/${pageId}`, {
      method: "PATCH",
      body: input,
      csrfToken,
      isMutation: true,
    }),
  publishPage: (pageId: string, csrfToken?: string | null) =>
    apiRequest<PublishPageDto>(`/api/pages/${pageId}/publish`, {
      method: "POST",
      body: {},
      csrfToken,
      isMutation: true,
    }),
  archivePage: (pageId: string, csrfToken?: string | null) =>
    apiRequest<ArchivePageDto>(`/api/pages/${pageId}/archive`, {
      method: "POST",
      body: {},
      csrfToken,
      isMutation: true,
    }),
  unpublishPage: (pageId: string, csrfToken?: string | null) =>
    apiRequest<UnpublishPageDto>(`/api/pages/${pageId}/unpublish`, {
      method: "POST",
      body: {},
      csrfToken,
      isMutation: true,
    }),
  deletePage: (pageId: string, csrfToken?: string | null) =>
    apiRequest<DeletePageDto>(`/api/pages/${pageId}`, {
      method: "DELETE",
      csrfToken,
      isMutation: true,
    }),
  getSettings: () => apiRequest<CmsSettingsDto>("/api/settings"),
  updateSettings: (input: UpdateSettingsInput, csrfToken?: string | null) =>
    apiRequest<CmsSettingsDto>("/api/settings", {
      method: "PATCH",
      body: input,
      csrfToken,
      isMutation: true,
    }),
  previewPage: (pageId: string) =>
    apiRequest<PreviewPageDto>(`/api/content/pages/${pageId}/preview`),
  listMedia: () => apiRequest<MediaAssetDto[]>("/api/media"),
  uploadMedia: async (file: File, csrfToken?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken ?? "",
    };

    try {
      const response = await fetch("/api/media", {
        method: "POST",
        credentials: "include",
        headers,
        body: formData,
      });

      const text = await response.text();
      let body: ApiEnvelopeBody | null = null;

      if (text) {
        try {
          body = JSON.parse(text) as ApiEnvelopeBody;
        } catch {
          body = null;
        }
      }

      const nextCsrfToken = extractCsrfToken(response, body);

      if (!response.ok) {
        return {
          ok: false as const,
          error: toApiError(response.status, body),
          csrfToken: nextCsrfToken,
          data: null,
        };
      }

      return {
        ok: true as const,
        data: (body?.data ?? null) as MediaAssetDto,
        csrfToken: nextCsrfToken,
        error: null,
      };
    } catch {
      return {
        ok: false as const,
        error: toUnknownApiError("Could not reach API"),
        csrfToken: null,
        data: null,
      };
    }
  },
};
