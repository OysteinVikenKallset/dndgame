import {
  FORBIDDEN_UNPUBLISH_ERROR,
  UNAUTHORIZED_UNPUBLISH_ERROR,
  UNPUBLISH_INVALID_STATE_ERROR,
  UNPUBLISH_PAGE_NOT_FOUND_ERROR,
  unpublishPage,
} from "../../application/use-cases/unpublish-page";
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

type UnpublishPageRequest = {
  headers: { cookie?: string };
  params: { pageId: string };
};

type UnpublishPageResponse = {
  pageId: string;
  status: "DRAFT";
  version: number;
};

type UnpublishPageControllerResponse =
  | ApiSuccessResponse<UnpublishPageResponse>
  | ApiErrorResponse;

type UnpublishPageControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export async function handleUnpublishPageRequest(
  request: UnpublishPageRequest,
  dependencies: UnpublishPageControllerDependencies,
): Promise<UnpublishPageControllerResponse> {
  try {
    const result = await unpublishPage(
      {
        sessionId: extractSessionId(request.headers.cookie),
        pageId: request.params.pageId,
      },
      dependencies,
    );

    return createApiSuccessResponse(200, result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === UNAUTHORIZED_UNPUBLISH_ERROR
    ) {
      return createApiErrorResponse(
        401,
        "UNAUTHORIZED",
        UNAUTHORIZED_UNPUBLISH_ERROR,
      );
    }

    if (error instanceof Error && error.message === FORBIDDEN_UNPUBLISH_ERROR) {
      return createApiErrorResponse(
        403,
        "FORBIDDEN",
        FORBIDDEN_UNPUBLISH_ERROR,
      );
    }

    if (
      error instanceof Error &&
      error.message === UNPUBLISH_PAGE_NOT_FOUND_ERROR
    ) {
      return createApiErrorResponse(
        404,
        "PAGE_NOT_FOUND",
        UNPUBLISH_PAGE_NOT_FOUND_ERROR,
      );
    }

    if (
      error instanceof Error &&
      error.message === UNPUBLISH_INVALID_STATE_ERROR
    ) {
      return createApiErrorResponse(
        409,
        "UNPUBLISH_INVALID_STATE",
        UNPUBLISH_INVALID_STATE_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
