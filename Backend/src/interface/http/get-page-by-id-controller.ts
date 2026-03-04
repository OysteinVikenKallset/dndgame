import {
  getPageById,
  GET_PAGE_FORBIDDEN_ERROR,
  GET_PAGE_NOT_FOUND_ERROR,
  GET_PAGE_UNAUTHORIZED_ERROR,
} from "../../application/use-cases/get-page-by-id";
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

type GetPageByIdRequest = {
  headers: { cookie?: string };
  params: { pageId: string };
};

type GetPageByIdResponse = {
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  template?: "page" | "post";
  showTitle?: boolean;
  showInNav?: boolean;
  version: number;
  updatedAt: string;
  publishedAt?: string;
  components?: Array<{
    componentType: string;
    props: Record<string, unknown>;
  }>;
  bodyRichText?: string;
};

type GetPageByIdControllerResponse =
  | ApiSuccessResponse<GetPageByIdResponse>
  | ApiErrorResponse;

type GetPageByIdControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export async function handleGetPageByIdRequest(
  request: GetPageByIdRequest,
  dependencies: GetPageByIdControllerDependencies,
): Promise<GetPageByIdControllerResponse> {
  try {
    const result = await getPageById(
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
      error.message === GET_PAGE_UNAUTHORIZED_ERROR
    ) {
      return createApiErrorResponse(
        401,
        "UNAUTHORIZED",
        GET_PAGE_UNAUTHORIZED_ERROR,
      );
    }

    if (error instanceof Error && error.message === GET_PAGE_FORBIDDEN_ERROR) {
      return createApiErrorResponse(403, "FORBIDDEN", GET_PAGE_FORBIDDEN_ERROR);
    }

    if (error instanceof Error && error.message === GET_PAGE_NOT_FOUND_ERROR) {
      return createApiErrorResponse(
        404,
        "PAGE_NOT_FOUND",
        GET_PAGE_NOT_FOUND_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
