import express, { type Request, type Response } from "express";
import multer from "multer";
import { resolve } from "node:path";
import { PlainPasswordHasher } from "./infrastructure/auth/plain-password-hasher";
import { InMemoryRateLimiter } from "./infrastructure/rate-limit/in-memory-rate-limiter";
import {
  SqlitePageRepository,
  SqlitePublicationRepository,
} from "./infrastructure/cms/sqlite-page-repository";
import { SqliteMediaRepository } from "./infrastructure/cms/sqlite-media-repository";
import { SqliteSessionService } from "./infrastructure/auth/sqlite-session-service";
import { SqliteUserRepository } from "./infrastructure/auth/sqlite-user-repository";
import { SqliteDatabase } from "./infrastructure/sqlite/sqlite-database";
import { runSqliteMigrations } from "./infrastructure/sqlite/sqlite-migrations";
import { runSqliteBaselineSeed } from "./infrastructure/sqlite/sqlite-seed";
import { handleGetMyProfileRequest } from "./interface/http/get-my-profile-controller";
import { handleGetPagePreviewRequest } from "./interface/http/get-page-preview-controller";
import { handleGetPageByIdRequest } from "./interface/http/get-page-by-id-controller";
import { handleGetPublicPageRequest } from "./interface/http/get-public-page-controller";
import { handleLoginRequest } from "./interface/http/login-controller";
import { handleLogoutRequest } from "./interface/http/logout-controller";
import { handleListPagesRequest } from "./interface/http/list-pages-controller";
import { handleCreatePageRequest } from "./interface/http/create-page-controller";
import { handlePublishPageRequest } from "./interface/http/publish-page-controller";
import { handleArchivePageRequest } from "./interface/http/archive-page-controller";
import { handleDeletePageRequest } from "./interface/http/delete-page-controller";
import { handleUnpublishPageRequest } from "./interface/http/unpublish-page-controller";
import { handleRegisterRequest } from "./interface/http/register-controller";
import { handleUpdatePageRequest } from "./interface/http/update-page-controller";
import { handleUpdateMyProfileRequest } from "./interface/http/update-my-profile-controller";
import { createApiErrorResponse } from "./interface/http/api-response";
import { hasValidCsrfToken } from "./interface/http/csrf-token";
import {
  handleListMediaRequest,
  handleUploadMediaRequest,
} from "./interface/http/media-controller";
import { extractSessionId } from "./interface/http/session-cookie";

const app = express();
app.use(express.json());
app.use(
  "/uploads",
  express.static(resolve(process.cwd(), "Backend/data/uploads")),
);

const upload = multer({ storage: multer.memoryStorage() });

const sqlite = new SqliteDatabase();
runSqliteMigrations(sqlite.connection);

const shouldRunSeed =
  process.env["SQLITE_RUN_SEED"] !== undefined
    ? process.env["SQLITE_RUN_SEED"] === "true"
    : process.env["NODE_ENV"] !== "production";

if (shouldRunSeed) {
  runSqliteBaselineSeed(sqlite.connection);
}

const userRepository = new SqliteUserRepository(sqlite.connection);

const passwordHasher = new PlainPasswordHasher();
const sessionService = new SqliteSessionService(sqlite.connection);
const loginRateLimiter = new InMemoryRateLimiter({
  maxRequests: 5,
  windowMs: 10 * 60 * 1000,
});
const registerRateLimiter = new InMemoryRateLimiter({
  maxRequests: 5,
  windowMs: 10 * 60 * 1000,
});
const pageRepository = new SqlitePageRepository(sqlite.connection);
const publicationRepository = new SqlitePublicationRepository(
  sqlite.connection,
);
const mediaRepository = new SqliteMediaRepository(sqlite.connection);
const HOMEPAGE_PAGE_ID_KEY = "homepage_page_id";
const NAVIGATION_SETTINGS_KEY = "navigation_settings";

type MenuSelection = {
  all: boolean;
  pageIds: string[];
};

type NavigationSettings = {
  header: MenuSelection;
  footer: MenuSelection;
};

function buildRateLimitKey(request: Request, email: string): string {
  return `${request.ip}:${email.trim().toLowerCase()}`;
}

function asSingleParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function requireValidCsrfToken(request: Request, response: Response): boolean {
  const sessionId = extractSessionId(request.header("cookie"));

  if (!sessionId) {
    return true;
  }

  const providedToken = request.header("x-csrf-token") ?? "";

  if (hasValidCsrfToken({ sessionId, providedToken })) {
    return true;
  }

  response
    .status(403)
    .json(
      createApiErrorResponse(403, "CSRF_TOKEN_INVALID", "Invalid CSRF token")
        .body,
    );
  return false;
}

async function getAuthenticatedUser(request: Request): Promise<{
  id: string;
  role: string;
} | null> {
  const sessionId = extractSessionId(request.header("cookie"));

  if (!sessionId) {
    return null;
  }

  const userId = sessionService.getUserId(sessionId);

  if (!userId) {
    return null;
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    role: user.role ?? "editor",
  };
}

function readHomepagePageIdSetting(): string | null {
  const row = sqlite.connection
    .prepare(`SELECT value FROM cms_settings WHERE key = ?`)
    .get(HOMEPAGE_PAGE_ID_KEY) as { value: string | null } | undefined;

  if (!row || row.value === null) {
    return null;
  }

  const trimmed = row.value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function writeHomepagePageIdSetting(pageId: string | null): void {
  sqlite.connection
    .prepare(
      `INSERT INTO cms_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(HOMEPAGE_PAGE_ID_KEY, pageId, new Date().toISOString());
}

function uniqueTrimmedStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function defaultNavigationSettings(): NavigationSettings {
  return {
    header: { all: true, pageIds: [] },
    footer: { all: true, pageIds: [] },
  };
}

function toMenuSelection(value: unknown): MenuSelection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record["all"] !== "boolean") {
    return null;
  }

  const pageIds = record["pageIds"];

  if (
    !Array.isArray(pageIds) ||
    pageIds.some((entry) => typeof entry !== "string")
  ) {
    return null;
  }

  return {
    all: record["all"],
    pageIds: uniqueTrimmedStrings(pageIds as string[]),
  };
}

function readNavigationSettings(): NavigationSettings {
  const row = sqlite.connection
    .prepare(`SELECT value FROM cms_settings WHERE key = ?`)
    .get(NAVIGATION_SETTINGS_KEY) as { value: string | null } | undefined;

  if (!row || row.value === null) {
    return defaultNavigationSettings();
  }

  try {
    const parsed = JSON.parse(row.value) as Record<string, unknown>;
    const header = toMenuSelection(parsed["header"]);
    const footer = toMenuSelection(parsed["footer"]);

    if (!header || !footer) {
      return defaultNavigationSettings();
    }

    return { header, footer };
  } catch {
    return defaultNavigationSettings();
  }
}

function writeNavigationSettings(settings: NavigationSettings): void {
  sqlite.connection
    .prepare(
      `INSERT INTO cms_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(
      NAVIGATION_SETTINGS_KEY,
      JSON.stringify(settings),
      new Date().toISOString(),
    );
}

async function filterPublishedPageIds(pageIds: string[]): Promise<string[]> {
  const filtered: string[] = [];

  for (const pageId of pageIds) {
    const page = await pageRepository.findById(pageId);

    if (page && page.status === "PUBLISHED") {
      filtered.push(pageId);
    }
  }

  return uniqueTrimmedStrings(filtered);
}

async function loginRouteHandler(request: Request, response: Response) {
  const email = String(request.body?.email ?? "");
  const canProceed = loginRateLimiter.allow(buildRateLimitKey(request, email));

  if (!canProceed) {
    response
      .status(429)
      .json(
        createApiErrorResponse(429, "RATE_LIMITED", "Too many requests").body,
      );
    return;
  }

  const result = await handleLoginRequest(
    {
      body: {
        email,
        password: String(request.body?.password ?? ""),
      },
    },
    {
      userRepository,
      passwordHasher,
      sessionService,
    },
  );

  if (result.setCookie) {
    response.setHeader("Set-Cookie", result.setCookie);
  }

  response.status(result.status).json(result.body);
}

app.post("/api/auth/login", loginRouteHandler);

app.get("/api/auth/csrf", async (request: Request, response: Response) => {
  const cookie = request.header("cookie");

  const result = await handleGetMyProfileRequest(
    {
      headers: cookie ? { cookie } : {},
    },
    {
      userRepository,
      sessionService,
    },
  );

  if (result.status !== 200 || !("data" in result.body)) {
    response.status(result.status).json(result.body);
    return;
  }

  response
    .status(200)
    .setHeader("x-csrf-token", result.body.data.csrfToken)
    .json({ data: { csrfToken: result.body.data.csrfToken } });
});

app.get("/api/auth/me", async (request: Request, response: Response) => {
  const cookie = request.header("cookie");

  const result = await handleGetMyProfileRequest(
    {
      headers: cookie ? { cookie } : {},
    },
    {
      userRepository,
      sessionService,
    },
  );

  if (result.status === 200 && "data" in result.body) {
    response.setHeader("x-csrf-token", result.body.data.csrfToken);
  }

  response.status(result.status).json(result.body);
});

app.post("/api/auth/logout", async (request: Request, response: Response) => {
  if (!requireValidCsrfToken(request, response)) {
    return;
  }

  const cookie = request.header("cookie");

  const result = await handleLogoutRequest(
    {
      headers: cookie ? { cookie } : {},
    },
    {
      sessionService,
    },
  );

  if ("clearCookie" in result) {
    response.setHeader("Set-Cookie", result.clearCookie);
    response.status(result.status).send();
    return;
  }

  response.status(result.status).json(result.body);
});

app.post("/api/auth/register", async (request: Request, response: Response) => {
  const email = String(request.body?.email ?? "");
  const canProceed = registerRateLimiter.allow(
    buildRateLimitKey(request, email),
  );

  if (!canProceed) {
    response
      .status(429)
      .json(
        createApiErrorResponse(429, "RATE_LIMITED", "Too many requests").body,
      );
    return;
  }

  const result = await handleRegisterRequest(
    {
      body: {
        email,
        password: String(request.body?.password ?? ""),
        displayName: String(request.body?.displayName ?? ""),
      },
    },
    {
      userRepository,
      passwordHasher,
    },
  );

  response.status(result.status).json(result.body);
});

app.patch("/api/users/me", async (request: Request, response: Response) => {
  if (!requireValidCsrfToken(request, response)) {
    return;
  }

  const cookie = request.header("cookie");

  const result = await handleUpdateMyProfileRequest(
    {
      headers: cookie ? { cookie } : {},
      body:
        request.body && typeof request.body === "object"
          ? (request.body as Record<string, unknown>)
          : {},
    },
    {
      userRepository,
      sessionService,
    },
  );

  response.status(result.status).json(result.body);
});

app.post("/api/pages", async (request: Request, response: Response) => {
  if (!requireValidCsrfToken(request, response)) {
    return;
  }

  const cookie = request.header("cookie");

  const result = await handleCreatePageRequest(
    {
      headers: cookie ? { cookie } : {},
      body: {
        slug: String(request.body?.slug ?? ""),
        title: String(request.body?.title ?? ""),
        locale: String(request.body?.locale ?? "en"),
        ...(request.body?.template === "page" ||
        request.body?.template === "post"
          ? { template: request.body.template }
          : {}),
        ...(typeof request.body?.showInNav === "boolean"
          ? { showInNav: request.body.showInNav }
          : {}),
        ...(Array.isArray(request.body?.components)
          ? {
              components: request.body.components as Array<{
                componentType: string;
                props: Record<string, unknown>;
              }>,
            }
          : {}),
        ...(request.body?.bodyRichText !== undefined
          ? { bodyRichText: String(request.body?.bodyRichText) }
          : {}),
      },
    },
    {
      sessionService,
      userRepository,
      pageRepository,
    },
  );

  response.status(result.status).json(result.body);
});

app.get("/api/settings", async (request: Request, response: Response) => {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    response
      .status(401)
      .json(createApiErrorResponse(401, "UNAUTHORIZED", "Unauthorized").body);
    return;
  }

  if (user.role !== "admin") {
    response
      .status(403)
      .json(createApiErrorResponse(403, "FORBIDDEN", "Forbidden").body);
    return;
  }

  const navigationSettings = readNavigationSettings();
  const headerMenuPageIds = await filterPublishedPageIds(
    navigationSettings.header.pageIds,
  );
  const footerMenuPageIds = await filterPublishedPageIds(
    navigationSettings.footer.pageIds,
  );

  response.status(200).json({
    data: {
      homepagePageId: readHomepagePageIdSetting(),
      headerMenuAll: navigationSettings.header.all,
      headerMenuPageIds,
      footerMenuAll: navigationSettings.footer.all,
      footerMenuPageIds,
    },
  });
});

app.patch("/api/settings", async (request: Request, response: Response) => {
  if (!requireValidCsrfToken(request, response)) {
    return;
  }

  const user = await getAuthenticatedUser(request);

  if (!user) {
    response
      .status(401)
      .json(createApiErrorResponse(401, "UNAUTHORIZED", "Unauthorized").body);
    return;
  }

  if (user.role !== "admin") {
    response
      .status(403)
      .json(createApiErrorResponse(403, "FORBIDDEN", "Forbidden").body);
    return;
  }

  const rawBody =
    request.body && typeof request.body === "object"
      ? (request.body as Record<string, unknown>)
      : {};
  const allowedKeys = new Set([
    "homepagePageId",
    "headerMenuAll",
    "headerMenuPageIds",
    "footerMenuAll",
    "footerMenuPageIds",
  ]);
  const unknownKey = Object.keys(rawBody).find(
    (entry) => !allowedKeys.has(entry),
  );

  if (unknownKey) {
    response
      .status(400)
      .json(
        createApiErrorResponse(
          400,
          "INVALID_SETTINGS_INPUT",
          "Invalid settings input",
        ).body,
      );
    return;
  }

  const homepagePageIdValue = rawBody["homepagePageId"];
  const headerMenuAllValue = rawBody["headerMenuAll"];
  const headerMenuPageIdsValue = rawBody["headerMenuPageIds"];
  const footerMenuAllValue = rawBody["footerMenuAll"];
  const footerMenuPageIdsValue = rawBody["footerMenuPageIds"];

  if (
    homepagePageIdValue !== null &&
    homepagePageIdValue !== undefined &&
    typeof homepagePageIdValue !== "string"
  ) {
    response
      .status(400)
      .json(
        createApiErrorResponse(
          400,
          "INVALID_SETTINGS_INPUT",
          "Invalid settings input",
        ).body,
      );
    return;
  }

  if (
    headerMenuAllValue !== undefined &&
    typeof headerMenuAllValue !== "boolean"
  ) {
    response
      .status(400)
      .json(
        createApiErrorResponse(
          400,
          "INVALID_SETTINGS_INPUT",
          "Invalid settings input",
        ).body,
      );
    return;
  }

  if (
    footerMenuAllValue !== undefined &&
    typeof footerMenuAllValue !== "boolean"
  ) {
    response
      .status(400)
      .json(
        createApiErrorResponse(
          400,
          "INVALID_SETTINGS_INPUT",
          "Invalid settings input",
        ).body,
      );
    return;
  }

  if (
    headerMenuPageIdsValue !== undefined &&
    (!Array.isArray(headerMenuPageIdsValue) ||
      headerMenuPageIdsValue.some((entry) => typeof entry !== "string"))
  ) {
    response
      .status(400)
      .json(
        createApiErrorResponse(
          400,
          "INVALID_SETTINGS_INPUT",
          "Invalid settings input",
        ).body,
      );
    return;
  }

  if (
    footerMenuPageIdsValue !== undefined &&
    (!Array.isArray(footerMenuPageIdsValue) ||
      footerMenuPageIdsValue.some((entry) => typeof entry !== "string"))
  ) {
    response
      .status(400)
      .json(
        createApiErrorResponse(
          400,
          "INVALID_SETTINGS_INPUT",
          "Invalid settings input",
        ).body,
      );
    return;
  }

  const homepagePageId =
    typeof homepagePageIdValue === "string" &&
    homepagePageIdValue.trim().length > 0
      ? homepagePageIdValue.trim()
      : null;

  if (homepagePageId) {
    const homepagePage = await pageRepository.findById(homepagePageId);

    if (!homepagePage || homepagePage.status !== "PUBLISHED") {
      response
        .status(400)
        .json(
          createApiErrorResponse(
            400,
            "INVALID_HOMEPAGE_PAGE",
            "Homepage must reference a published page",
          ).body,
        );
      return;
    }
  }

  const currentNavigationSettings = readNavigationSettings();
  const nextHeaderMenuAll =
    typeof headerMenuAllValue === "boolean"
      ? headerMenuAllValue
      : currentNavigationSettings.header.all;
  const nextFooterMenuAll =
    typeof footerMenuAllValue === "boolean"
      ? footerMenuAllValue
      : currentNavigationSettings.footer.all;
  const nextHeaderMenuPageIdsInput =
    headerMenuPageIdsValue !== undefined
      ? uniqueTrimmedStrings(headerMenuPageIdsValue as string[])
      : currentNavigationSettings.header.pageIds;
  const nextFooterMenuPageIdsInput =
    footerMenuPageIdsValue !== undefined
      ? uniqueTrimmedStrings(footerMenuPageIdsValue as string[])
      : currentNavigationSettings.footer.pageIds;

  const nextHeaderMenuPageIds = await filterPublishedPageIds(
    nextHeaderMenuPageIdsInput,
  );
  const nextFooterMenuPageIds = await filterPublishedPageIds(
    nextFooterMenuPageIdsInput,
  );

  const nextNavigationSettings: NavigationSettings = {
    header: {
      all: nextHeaderMenuAll,
      pageIds: nextHeaderMenuPageIds,
    },
    footer: {
      all: nextFooterMenuAll,
      pageIds: nextFooterMenuPageIds,
    },
  };

  writeHomepagePageIdSetting(homepagePageId);
  writeNavigationSettings(nextNavigationSettings);

  response.status(200).json({
    data: {
      homepagePageId,
      headerMenuAll: nextNavigationSettings.header.all,
      headerMenuPageIds: nextNavigationSettings.header.pageIds,
      footerMenuAll: nextNavigationSettings.footer.all,
      footerMenuPageIds: nextNavigationSettings.footer.pageIds,
    },
  });
});

app.get("/api/pages", async (request: Request, response: Response) => {
  const cookie = request.header("cookie");

  const statusQuery = request.query["status"];
  const localeQuery = request.query["locale"];
  const sortQuery = request.query["sort"];
  const cursorQuery = request.query["cursor"];
  const limitQuery = request.query["limit"];

  const result = await handleListPagesRequest(
    {
      headers: cookie ? { cookie } : {},
      query: {
        ...(typeof statusQuery === "string" ? { status: statusQuery } : {}),
        ...(typeof localeQuery === "string" ? { locale: localeQuery } : {}),
        ...(typeof sortQuery === "string" ? { sort: sortQuery } : {}),
        ...(typeof cursorQuery === "string" ? { cursor: cursorQuery } : {}),
        ...(typeof limitQuery === "string" ? { limit: limitQuery } : {}),
      },
    },
    {
      sessionService,
      userRepository,
      pageRepository,
    },
  );

  response.status(result.status).json(result.body);
});

app.get("/api/pages/:pageId", async (request: Request, response: Response) => {
  const cookie = request.header("cookie");

  const result = await handleGetPageByIdRequest(
    {
      headers: cookie ? { cookie } : {},
      params: {
        pageId: asSingleParam(request.params["pageId"]),
      },
    },
    {
      sessionService,
      userRepository,
      pageRepository,
    },
  );

  response.status(result.status).json(result.body);
});

app.patch(
  "/api/pages/:pageId",
  async (request: Request, response: Response) => {
    if (!requireValidCsrfToken(request, response)) {
      return;
    }

    const cookie = request.header("cookie");

    const result = await handleUpdatePageRequest(
      {
        headers: cookie ? { cookie } : {},
        params: {
          pageId: asSingleParam(request.params["pageId"]),
        },
        body:
          request.body && typeof request.body === "object"
            ? (request.body as Record<string, unknown>)
            : {},
      },
      {
        sessionService,
        userRepository,
        pageRepository,
      },
    );

    response.status(result.status).json(result.body);
  },
);

app.post(
  "/api/media",
  upload.single("file"),
  async (request: Request, response: Response) => {
    if (!requireValidCsrfToken(request, response)) {
      return;
    }

    const cookie = request.header("cookie");

    const uploadedFile = request.file;
    const result = await handleUploadMediaRequest(
      {
        headers: cookie ? { cookie } : {},
        ...(uploadedFile
          ? {
              file: {
                originalname: uploadedFile.originalname,
                mimetype: uploadedFile.mimetype,
                size: uploadedFile.size,
                buffer: uploadedFile.buffer,
              },
            }
          : {}),
      },
      {
        sessionService,
        userRepository,
        mediaRepository,
      },
    );

    response.status(result.status).json(result.body);
  },
);

app.get("/api/media", async (request: Request, response: Response) => {
  const cookie = request.header("cookie");

  const result = await handleListMediaRequest(
    {
      headers: cookie ? { cookie } : {},
    },
    {
      sessionService,
      userRepository,
      mediaRepository,
    },
  );

  response.status(result.status).json(result.body);
});

app.post(
  "/api/pages/:pageId/publish",
  async (request: Request, response: Response) => {
    if (!requireValidCsrfToken(request, response)) {
      return;
    }

    const cookie = request.header("cookie");

    const result = await handlePublishPageRequest(
      {
        headers: cookie ? { cookie } : {},
        params: {
          pageId: asSingleParam(request.params["pageId"]),
        },
      },
      {
        sessionService,
        userRepository,
        pageRepository,
        publicationRepository,
      },
    );

    response.status(result.status).json(result.body);
  },
);

app.post(
  "/api/pages/:pageId/archive",
  async (request: Request, response: Response) => {
    if (!requireValidCsrfToken(request, response)) {
      return;
    }

    const cookie = request.header("cookie");

    const result = await handleArchivePageRequest(
      {
        headers: cookie ? { cookie } : {},
        params: {
          pageId: asSingleParam(request.params["pageId"]),
        },
      },
      {
        sessionService,
        userRepository,
        pageRepository,
      },
    );

    response.status(result.status).json(result.body);
  },
);

app.post(
  "/api/pages/:pageId/unpublish",
  async (request: Request, response: Response) => {
    if (!requireValidCsrfToken(request, response)) {
      return;
    }

    const cookie = request.header("cookie");

    const result = await handleUnpublishPageRequest(
      {
        headers: cookie ? { cookie } : {},
        params: {
          pageId: asSingleParam(request.params["pageId"]),
        },
      },
      {
        sessionService,
        userRepository,
        pageRepository,
      },
    );

    response.status(result.status).json(result.body);
  },
);

app.delete(
  "/api/pages/:pageId",
  async (request: Request, response: Response) => {
    if (!requireValidCsrfToken(request, response)) {
      return;
    }

    const cookie = request.header("cookie");

    const result = await handleDeletePageRequest(
      {
        headers: cookie ? { cookie } : {},
        params: {
          pageId: asSingleParam(request.params["pageId"]),
        },
      },
      {
        sessionService,
        userRepository,
        pageRepository,
        publicationRepository,
      },
    );

    if (
      result.status === 200 &&
      "data" in result.body &&
      result.body.data.deleted
    ) {
      const homepagePageId = readHomepagePageIdSetting();

      if (homepagePageId === result.body.data.pageId) {
        writeHomepagePageIdSetting(null);
      }
    }

    response.status(result.status).json(result.body);
  },
);

app.get("/api/content/pages", async (request: Request, response: Response) => {
  const localeQuery = request.query["locale"];
  const limitQuery = request.query["limit"];

  const locale =
    typeof localeQuery === "string" && localeQuery.trim()
      ? localeQuery.trim()
      : "en";

  const parsedLimit =
    typeof limitQuery === "string" ? Number.parseInt(limitQuery, 10) : NaN;
  const limit = Number.isInteger(parsedLimit)
    ? Math.min(200, Math.max(1, parsedLimit))
    : 100;

  const items = await publicationRepository.listLatestByLocale({
    locale,
    limit,
  });

  response
    .status(200)
    .setHeader("Cache-Control", "no-store")
    .json({
      data: {
        items,
        total: items.length,
      },
    });
});

app.get(
  "/api/content/settings",
  async (request: Request, response: Response) => {
    const localeQuery = request.query["locale"];
    const locale = typeof localeQuery === "string" ? localeQuery : "en";
    const homepagePageId = readHomepagePageIdSetting();
    const publishedPages = await publicationRepository.listLatestByLocale({
      locale,
      limit: 500,
    });
    const pageById = new Map<string, string>();

    for (const page of publishedPages) {
      pageById.set(page.pageId, page.slug);
    }

    const navigationSettings = readNavigationSettings();
    const headerSlugs = navigationSettings.header.all
      ? publishedPages.map((page) => page.slug)
      : navigationSettings.header.pageIds
          .map((pageId) => pageById.get(pageId))
          .filter((slug): slug is string => Boolean(slug));
    const footerSlugs = navigationSettings.footer.all
      ? publishedPages.map((page) => page.slug)
      : navigationSettings.footer.pageIds
          .map((pageId) => pageById.get(pageId))
          .filter((slug): slug is string => Boolean(slug));

    if (!homepagePageId) {
      response.status(200).json({
        data: {
          homepageSlug: null,
          menu: {
            header: {
              all: navigationSettings.header.all,
              slugs: headerSlugs,
            },
            footer: {
              all: navigationSettings.footer.all,
              slugs: footerSlugs,
            },
          },
        },
      });
      return;
    }

    const page = await pageRepository.findById(homepagePageId);

    if (!page || page.status !== "PUBLISHED" || page.locale !== locale) {
      response.status(200).json({
        data: {
          homepageSlug: null,
          menu: {
            header: {
              all: navigationSettings.header.all,
              slugs: headerSlugs,
            },
            footer: {
              all: navigationSettings.footer.all,
              slugs: footerSlugs,
            },
          },
        },
      });
      return;
    }

    response.status(200).json({
      data: {
        homepageSlug: page.slug,
        menu: {
          header: {
            all: navigationSettings.header.all,
            slugs: headerSlugs,
          },
          footer: {
            all: navigationSettings.footer.all,
            slugs: footerSlugs,
          },
        },
      },
    });
  },
);

app.get(
  "/api/content/pages/:pageId/preview",
  async (request: Request, response: Response) => {
    const cookie = request.header("cookie");

    const result = await handleGetPagePreviewRequest(
      {
        headers: cookie ? { cookie } : {},
        params: {
          pageId: asSingleParam(request.params["pageId"]),
        },
      },
      {
        sessionService,
        userRepository,
        pageRepository,
      },
    );

    response.status(result.status).json(result.body);
  },
);

app.get(
  "/api/content/pages/:slug",
  async (request: Request, response: Response) => {
    const localeQuery = request.query["locale"];
    const locale = typeof localeQuery === "string" ? localeQuery : "en";

    const result = await handleGetPublicPageRequest(
      {
        params: {
          slug: asSingleParam(request.params["slug"]),
        },
        query: {
          locale,
        },
      },
      {
        publicationRepository,
      },
    );

    if ("data" in result.body) {
      response.setHeader("Cache-Control", "no-store");
    }

    response.status(result.status).json(result.body);
  },
);

const port = Number(process.env["PORT"] ?? 3000);

if (process.env["NODE_ENV"] !== "test") {
  app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });
}

export { app };
