import {
  getPagePreview,
  PREVIEW_FORBIDDEN_ERROR,
  PREVIEW_PAGE_NOT_FOUND_ERROR,
  PREVIEW_UNAUTHORIZED_ERROR,
} from "../../application/use-cases/get-page-preview";
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

type GetPagePreviewRequest = {
  headers: {
    cookie?: string;
  };
  params: {
    pageId: string;
  };
};

type GetPagePreviewResponse = {
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

type GetPagePreviewControllerResponse =
  | ApiSuccessResponse<GetPagePreviewResponse>
  | ApiErrorResponse;

type GetPagePreviewControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export async function handleGetPagePreviewRequest(
  request: GetPagePreviewRequest,
  dependencies: GetPagePreviewControllerDependencies,
): Promise<GetPagePreviewControllerResponse> {
  try {
    const result = await getPagePreview(
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
      error.message === PREVIEW_UNAUTHORIZED_ERROR
    ) {
      return createApiErrorResponse(
        401,
        "UNAUTHORIZED",
        PREVIEW_UNAUTHORIZED_ERROR,
      );
    }

    if (error instanceof Error && error.message === PREVIEW_FORBIDDEN_ERROR) {
      return createApiErrorResponse(403, "FORBIDDEN", PREVIEW_FORBIDDEN_ERROR);
    }

    if (
      error instanceof Error &&
      error.message === PREVIEW_PAGE_NOT_FOUND_ERROR
    ) {
      return createApiErrorResponse(
        404,
        "PAGE_NOT_FOUND",
        PREVIEW_PAGE_NOT_FOUND_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
