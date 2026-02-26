import {
  getMyProfile,
  UNAUTHORIZED_ERROR,
} from "../../application/use-cases/get-my-profile";
import type {
  SessionService,
  UserRepository,
} from "../../application/ports/auth";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from "./api-response";
import { extractSessionId } from "./session-cookie";

type GetMyProfileRequest = {
  headers: {
    cookie?: string;
  };
};

type GetMyProfileResponse = {
  id: string;
  email: string;
  displayName: string;
};

type GetMyProfileControllerResponse =
  | ApiSuccessResponse<GetMyProfileResponse>
  | ApiErrorResponse;

type GetMyProfileControllerDependencies = {
  userRepository: UserRepository;
  sessionService: SessionService;
};

export async function handleGetMyProfileRequest(
  request: GetMyProfileRequest,
  dependencies: GetMyProfileControllerDependencies,
): Promise<GetMyProfileControllerResponse> {
  try {
    const profile = await getMyProfile(
      {
        sessionId: extractSessionId(request.headers.cookie),
      },
      dependencies,
    );

    return createApiSuccessResponse(200, profile);
  } catch (error) {
    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR) {
      return createApiErrorResponse(401, "UNAUTHORIZED", UNAUTHORIZED_ERROR);
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
