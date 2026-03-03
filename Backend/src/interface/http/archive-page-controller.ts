import {
  archivePage,
  ARCHIVE_FORBIDDEN_ERROR,
  ARCHIVE_NOT_FOUND_ERROR,
  ARCHIVE_UNAUTHORIZED_ERROR,
} from "../../application/use-cases/archive-page";
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

type ArchivePageRequest = {
  headers: { cookie?: string };
  params: { pageId: string };
};

type ArchivePageResponse = {
  pageId: string;
  status: "ARCHIVED";
  version: number;
};

type ArchivePageControllerResponse =
  | ApiSuccessResponse<ArchivePageResponse>
  | ApiErrorResponse;

type ArchivePageControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export async function handleArchivePageRequest(
  request: ArchivePageRequest,
  dependencies: ArchivePageControllerDependencies,
): Promise<ArchivePageControllerResponse> {
  try {
    const result = await archivePage(
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
      error.message === ARCHIVE_UNAUTHORIZED_ERROR
    ) {
      return createApiErrorResponse(
        401,
        "UNAUTHORIZED",
        ARCHIVE_UNAUTHORIZED_ERROR,
      );
    }

    if (error instanceof Error && error.message === ARCHIVE_FORBIDDEN_ERROR) {
      return createApiErrorResponse(403, "FORBIDDEN", ARCHIVE_FORBIDDEN_ERROR);
    }

    if (error instanceof Error && error.message === ARCHIVE_NOT_FOUND_ERROR) {
      return createApiErrorResponse(
        404,
        "PAGE_NOT_FOUND",
        ARCHIVE_NOT_FOUND_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
