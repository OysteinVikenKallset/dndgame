import {
  FORBIDDEN_PUBLISH_ERROR,
  PAGE_NOT_FOUND_ERROR,
  publishPage,
  UNAUTHORIZED_PUBLISH_ERROR,
} from "../../application/use-cases/publish-page";
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

type PublishPageRequest = {
  headers: {
    cookie?: string;
  };
  params: {
    pageId: string;
  };
};

type PublishPageResponse = {
  pageId: string;
  slug: string;
  locale: string;
  publishedAt: string;
};

type PublishPageControllerResponse =
  | ApiSuccessResponse<PublishPageResponse>
  | ApiErrorResponse;

type PublishPageControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
  publicationRepository: CmsPublicationRepository;
};

export async function handlePublishPageRequest(
  request: PublishPageRequest,
  dependencies: PublishPageControllerDependencies,
): Promise<PublishPageControllerResponse> {
  try {
    const result = await publishPage(
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
      error.message === UNAUTHORIZED_PUBLISH_ERROR
    ) {
      return createApiErrorResponse(
        401,
        "UNAUTHORIZED",
        UNAUTHORIZED_PUBLISH_ERROR,
      );
    }

    if (error instanceof Error && error.message === FORBIDDEN_PUBLISH_ERROR) {
      return createApiErrorResponse(403, "FORBIDDEN", FORBIDDEN_PUBLISH_ERROR);
    }

    if (error instanceof Error && error.message === PAGE_NOT_FOUND_ERROR) {
      return createApiErrorResponse(
        404,
        "PAGE_NOT_FOUND",
        PAGE_NOT_FOUND_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
