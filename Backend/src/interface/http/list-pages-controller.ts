import {
  listMyPages,
  INVALID_LIST_INPUT_ERROR,
  LIST_UNAUTHORIZED_ERROR,
} from "../../application/use-cases/list-my-pages";
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

type ListPagesRequest = {
  headers: { cookie?: string };
  query: {
    status?: string;
    locale?: string;
    sort?: string;
    cursor?: string;
    limit?: string;
  };
};

type ListPagesResponse = {
  items: Array<{
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
  }>;
  meta: { nextCursor?: string; total: number };
};

type ListPagesControllerResponse =
  | ApiSuccessResponse<ListPagesResponse>
  | ApiErrorResponse;

type ListPagesControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

function parseStatus(
  value?: string,
): "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined {
  if (value === "DRAFT" || value === "PUBLISHED" || value === "ARCHIVED") {
    return value;
  }

  return undefined;
}

function parseSort(
  value?: string,
): "updatedAt:desc" | "updatedAt:asc" | undefined {
  if (value === "updatedAt:desc" || value === "updatedAt:asc") {
    return value;
  }

  return undefined;
}

export async function handleListPagesRequest(
  request: ListPagesRequest,
  dependencies: ListPagesControllerDependencies,
): Promise<ListPagesControllerResponse> {
  try {
    const parsedLimit = request.query.limit
      ? Number(request.query.limit)
      : undefined;
    const parsedStatus = parseStatus(request.query.status);
    const parsedSort = parseSort(request.query.sort);

    const result = await listMyPages(
      {
        sessionId: extractSessionId(request.headers.cookie),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
        ...(request.query.locale ? { locale: request.query.locale } : {}),
        ...(parsedSort !== undefined ? { sort: parsedSort } : {}),
        ...(request.query.cursor ? { cursor: request.query.cursor } : {}),
        ...(parsedLimit !== undefined ? { limit: parsedLimit } : {}),
      },
      dependencies,
    );

    return createApiSuccessResponse(200, result);
  } catch (error) {
    if (error instanceof Error && error.message === LIST_UNAUTHORIZED_ERROR) {
      return createApiErrorResponse(
        401,
        "UNAUTHORIZED",
        LIST_UNAUTHORIZED_ERROR,
      );
    }

    if (error instanceof Error && error.message === INVALID_LIST_INPUT_ERROR) {
      return createApiErrorResponse(
        400,
        "INVALID_LIST_INPUT",
        INVALID_LIST_INPUT_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
