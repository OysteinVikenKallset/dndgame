import {
  createPage,
  INVALID_PAGE_INPUT_ERROR,
  SLUG_CONFLICT_ERROR,
  UNAUTHORIZED_ERROR,
} from "../../application/use-cases/create-page";
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

type CreatePageRequest = {
  headers: {
    cookie?: string;
  };
  body: {
    slug: string;
    title: string;
    locale?: string;
    template?: "page" | "post";
    showInNav?: boolean;
    components?: Array<{
      componentType: string;
      props: Record<string, unknown>;
    }>;
    bodyRichText?: string;
  };
};

type CreatePageResponse = {
  id: string;
  slug: string;
  title: string;
  locale: string;
  status: "DRAFT";
  version: number;
};

type CreatePageControllerResponse =
  | ApiSuccessResponse<CreatePageResponse>
  | ApiErrorResponse;

type CreatePageControllerDependencies = {
  sessionService: SessionService;
  userRepository: UserRepository;
  pageRepository: CmsPageRepository;
};

export async function handleCreatePageRequest(
  request: CreatePageRequest,
  dependencies: CreatePageControllerDependencies,
): Promise<CreatePageControllerResponse> {
  try {
    const result = await createPage(
      {
        sessionId: extractSessionId(request.headers.cookie),
        slug: request.body.slug,
        title: request.body.title,
        locale: request.body.locale ?? "en",
        ...(request.body.template !== undefined
          ? { template: request.body.template }
          : {}),
        ...(request.body.showInNav !== undefined
          ? { showInNav: request.body.showInNav }
          : {}),
        ...(request.body.components !== undefined
          ? { components: request.body.components }
          : {}),
        ...(request.body.bodyRichText !== undefined
          ? { bodyRichText: request.body.bodyRichText }
          : {}),
      },
      dependencies,
    );

    return createApiSuccessResponse(201, result);
  } catch (error) {
    if (
      error instanceof PageInputValidationError &&
      error.message === INVALID_PAGE_INPUT_ERROR
    ) {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        "Fix the highlighted fields",
        error.fieldErrors,
      );
    }

    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR) {
      return createApiErrorResponse(401, "UNAUTHORIZED", UNAUTHORIZED_ERROR);
    }

    if (error instanceof Error && error.message === INVALID_PAGE_INPUT_ERROR) {
      return createApiErrorResponse(
        400,
        "INVALID_PAGE_INPUT",
        INVALID_PAGE_INPUT_ERROR,
      );
    }

    if (error instanceof Error && error.message === SLUG_CONFLICT_ERROR) {
      return createApiErrorResponse(409, "SLUG_CONFLICT", SLUG_CONFLICT_ERROR);
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
