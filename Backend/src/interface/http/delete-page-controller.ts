import {
  deletePage,
  DELETE_FORBIDDEN_ERROR,
  DELETE_INVALID_STATE_ERROR,
  DELETE_NOT_FOUND_ERROR,
  DELETE_UNAUTHORIZED_ERROR,
} from "../../application/use-cases/delete-page";
import type {
  SessionService,
  UserRepository,
} from "../../application/ports/auth";
import type {
  CmsPageRepository,
  CmsPublicationRepository,
} from "../../application/ports/cms";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from "./api-response";
import { extractSessionId } from "./session-cookie";

type DeletePageRequest = {
  headers: { cookie?: string };
  params: { pageId: string };
};

type DeletePageResponse = {
  pageId: string;
  deleted: true;
};

type DeletePageControllerResponse =
  | ApiSuccessResponse<DeletePageResponse>
  | ApiErrorResponse;

type DeletePageControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
  publicationRepository: CmsPublicationRepository;
};

export async function handleDeletePageRequest(
  request: DeletePageRequest,
  dependencies: DeletePageControllerDependencies,
): Promise<DeletePageControllerResponse> {
  try {
    const result = await deletePage(
      {
        sessionId: extractSessionId(request.headers.cookie),
        pageId: request.params.pageId,
      },
      dependencies,
    );

    return createApiSuccessResponse(200, result);
  } catch (error) {
    if (error instanceof Error && error.message === DELETE_UNAUTHORIZED_ERROR) {
      return createApiErrorResponse(
        401,
        "UNAUTHORIZED",
        DELETE_UNAUTHORIZED_ERROR,
      );
    }

    if (error instanceof Error && error.message === DELETE_FORBIDDEN_ERROR) {
      return createApiErrorResponse(403, "FORBIDDEN", DELETE_FORBIDDEN_ERROR);
    }

    if (error instanceof Error && error.message === DELETE_NOT_FOUND_ERROR) {
      return createApiErrorResponse(
        404,
        "PAGE_NOT_FOUND",
        DELETE_NOT_FOUND_ERROR,
      );
    }

    if (
      error instanceof Error &&
      error.message === DELETE_INVALID_STATE_ERROR
    ) {
      return createApiErrorResponse(
        409,
        "DELETE_INVALID_STATE",
        DELETE_INVALID_STATE_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
