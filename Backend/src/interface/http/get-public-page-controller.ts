import {
  getPublicPageBySlug,
  PUBLIC_PAGE_NOT_FOUND_ERROR,
} from "../../application/use-cases/get-public-page-by-slug";
import type { CmsPublicationRepository } from "../../application/ports/cms";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from "./api-response";

type GetPublicPageRequest = {
  params: {
    slug: string;
  };
  query: {
    locale?: string;
  };
};

type GetPublicPageResponse = Awaited<ReturnType<typeof getPublicPageBySlug>>;

type GetPublicPageControllerResponse =
  | ApiSuccessResponse<GetPublicPageResponse>
  | ApiErrorResponse;

type GetPublicPageControllerDependencies = {
  publicationRepository: CmsPublicationRepository;
};

export async function handleGetPublicPageRequest(
  request: GetPublicPageRequest,
  dependencies: GetPublicPageControllerDependencies,
): Promise<GetPublicPageControllerResponse> {
  try {
    const result = await getPublicPageBySlug(
      {
        slug: request.params.slug,
        locale: request.query.locale ?? "en",
      },
      dependencies,
    );

    return createApiSuccessResponse(200, result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === PUBLIC_PAGE_NOT_FOUND_ERROR
    ) {
      return createApiErrorResponse(
        404,
        "PAGE_NOT_FOUND",
        PUBLIC_PAGE_NOT_FOUND_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
