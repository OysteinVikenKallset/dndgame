import {
  updatePage,
  UPDATE_FORBIDDEN_ERROR,
  UPDATE_INVALID_INPUT_ERROR,
  UPDATE_PAGE_NOT_FOUND_ERROR,
  UPDATE_SLUG_CHANGE_FORBIDDEN_ERROR,
  UPDATE_SLUG_CONFLICT_ERROR,
  UPDATE_UNAUTHORIZED_ERROR,
  UPDATE_VERSION_CONFLICT_ERROR,
} from "../../application/use-cases/update-page";
import type {
  SessionService,
  UserRepository,
} from "../../application/ports/auth";
import type { CmsPageRepository } from "../../application/ports/cms";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from "./api-response";
import { extractSessionId } from "./session-cookie";
import { PageInputValidationError } from "../../application/use-cases/page-input-validation-error";

type UpdatePageRequest = {
  headers: { cookie?: string };
  params: { pageId: string };
  body: Record<string, unknown>;
};

type UpdatePageResponse = {
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  updatedAt: string;
};

type UpdatePageControllerResponse =
  | ApiSuccessResponse<UpdatePageResponse>
  | ApiErrorResponse;

type UpdatePageControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

const ALLOWED_KEYS = new Set([
  "version",
  "title",
  "slug",
  "template",
  "showTitle",
  "showInNav",
  "components",
  "bodyRichText",
]);

export async function handleUpdatePageRequest(
  request: UpdatePageRequest,
  dependencies: UpdatePageControllerDependencies,
): Promise<UpdatePageControllerResponse> {
  try {
    const keys = Object.keys(request.body);
    const hasUnknownKeys = keys.some((entry) => !ALLOWED_KEYS.has(entry));

    if (hasUnknownKeys) {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        "Fix the highlighted fields",
        [
          {
            path: "body",
            code: "UNKNOWN_FIELD",
            message: "Request body contains unsupported fields",
          },
        ],
      );
    }

    const version = Number(request.body["version"]);

    if (!Number.isInteger(version)) {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        "Fix the highlighted fields",
        [
          {
            path: "version",
            code: "INVALID_TYPE",
            message: "Version must be an integer",
          },
        ],
      );
    }

    const title = request.body["title"];
    const slug = request.body["slug"];
    const template = request.body["template"];
    const showTitle = request.body["showTitle"];
    const showInNav = request.body["showInNav"];
    const bodyRichText = request.body["bodyRichText"];
    const components = request.body["components"];

    if (template !== undefined && template !== "page" && template !== "post") {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        "Fix the highlighted fields",
        [
          {
            path: "template",
            code: "INVALID_ENUM",
            message: "Template must be page or post",
          },
        ],
      );
    }

    if (showInNav !== undefined && typeof showInNav !== "boolean") {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        "Fix the highlighted fields",
        [
          {
            path: "showInNav",
            code: "INVALID_TYPE",
            message: "showInNav must be a boolean",
          },
        ],
      );
    }

    if (showTitle !== undefined && typeof showTitle !== "boolean") {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        "Fix the highlighted fields",
        [
          {
            path: "showTitle",
            code: "INVALID_TYPE",
            message: "showTitle must be a boolean",
          },
        ],
      );
    }

    const result = await updatePage(
      {
        sessionId: extractSessionId(request.headers.cookie),
        pageId: request.params.pageId,
        version,
        ...(typeof title === "string" ? { title } : {}),
        ...(typeof slug === "string" ? { slug } : {}),
        ...(template === "page" || template === "post" ? { template } : {}),
        ...(typeof showTitle === "boolean" ? { showTitle } : {}),
        ...(typeof showInNav === "boolean" ? { showInNav } : {}),
        ...(Array.isArray(components)
          ? {
              components: components as Array<{
                componentType: string;
                props: Record<string, unknown>;
              }>,
            }
          : {}),
        ...(typeof bodyRichText === "string" ? { bodyRichText } : {}),
      },
      dependencies,
    );

    return createApiSuccessResponse(200, result);
  } catch (error) {
    if (
      error instanceof PageInputValidationError &&
      error.message === UPDATE_INVALID_INPUT_ERROR
    ) {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        "Fix the highlighted fields",
        error.fieldErrors,
      );
    }

    if (error instanceof Error && error.message === UPDATE_UNAUTHORIZED_ERROR) {
      return createApiErrorResponse(
        401,
        "UNAUTHORIZED",
        UPDATE_UNAUTHORIZED_ERROR,
      );
    }

    if (error instanceof Error && error.message === UPDATE_FORBIDDEN_ERROR) {
      return createApiErrorResponse(403, "FORBIDDEN", UPDATE_FORBIDDEN_ERROR);
    }

    if (
      error instanceof Error &&
      error.message === UPDATE_PAGE_NOT_FOUND_ERROR
    ) {
      return createApiErrorResponse(
        404,
        "PAGE_NOT_FOUND",
        UPDATE_PAGE_NOT_FOUND_ERROR,
      );
    }

    if (
      error instanceof Error &&
      error.message === UPDATE_VERSION_CONFLICT_ERROR
    ) {
      return createApiErrorResponse(
        409,
        "CONFLICT_VERSION",
        UPDATE_VERSION_CONFLICT_ERROR,
      );
    }

    if (
      error instanceof Error &&
      error.message === UPDATE_SLUG_CONFLICT_ERROR
    ) {
      return createApiErrorResponse(
        409,
        "SLUG_CONFLICT",
        UPDATE_SLUG_CONFLICT_ERROR,
      );
    }

    if (
      error instanceof Error &&
      error.message === UPDATE_SLUG_CHANGE_FORBIDDEN_ERROR
    ) {
      return createApiErrorResponse(
        409,
        "SLUG_CHANGE_FORBIDDEN",
        UPDATE_SLUG_CHANGE_FORBIDDEN_ERROR,
      );
    }

    if (
      error instanceof Error &&
      error.message === UPDATE_INVALID_INPUT_ERROR
    ) {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        UPDATE_INVALID_INPUT_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
