import type {
  SessionService,
  UserProfileRepository,
} from "../../application/ports/auth";
import {
  INVALID_UPDATE_PROFILE_INPUT_ERROR,
  UNAUTHORIZED_ERROR,
  updateMyProfile,
} from "../../application/use-cases/update-my-profile";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from "./api-response";
import { extractSessionId } from "./session-cookie";

type UpdateMyProfileRequest = {
  headers: {
    cookie?: string;
  };
  body: Record<string, unknown>;
};

type UpdateMyProfileResponse = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
};

type UpdateMyProfileControllerResponse =
  | ApiSuccessResponse<UpdateMyProfileResponse>
  | ApiErrorResponse;

type UpdateMyProfileControllerDependencies = {
  userRepository: UserProfileRepository;
  sessionService: SessionService;
};

function hasOnlyAllowedFields(body: Record<string, unknown>): boolean {
  return Object.keys(body).every(
    (key) => key === "displayName" || key === "avatarUrl",
  );
}

export async function handleUpdateMyProfileRequest(
  request: UpdateMyProfileRequest,
  dependencies: UpdateMyProfileControllerDependencies,
): Promise<UpdateMyProfileControllerResponse> {
  if (!hasOnlyAllowedFields(request.body)) {
    return createApiErrorResponse(
      400,
      "INVALID_UPDATE_PROFILE_INPUT",
      INVALID_UPDATE_PROFILE_INPUT_ERROR,
    );
  }

  if (
    ("displayName" in request.body &&
      request.body["displayName"] !== undefined &&
      typeof request.body["displayName"] !== "string") ||
    ("avatarUrl" in request.body &&
      request.body["avatarUrl"] !== undefined &&
      typeof request.body["avatarUrl"] !== "string")
  ) {
    return createApiErrorResponse(
      400,
      "INVALID_UPDATE_PROFILE_INPUT",
      INVALID_UPDATE_PROFILE_INPUT_ERROR,
    );
  }

  try {
    const updated = await updateMyProfile(
      {
        sessionId: extractSessionId(request.headers.cookie),
        ...(typeof request.body["displayName"] === "string"
          ? { displayName: request.body["displayName"] }
          : {}),
        ...(typeof request.body["avatarUrl"] === "string"
          ? { avatarUrl: request.body["avatarUrl"] }
          : {}),
      },
      dependencies,
    );

    return createApiSuccessResponse(200, updated);
  } catch (error) {
    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR) {
      return createApiErrorResponse(401, "UNAUTHORIZED", UNAUTHORIZED_ERROR);
    }

    if (
      error instanceof Error &&
      error.message === INVALID_UPDATE_PROFILE_INPUT_ERROR
    ) {
      return createApiErrorResponse(
        400,
        "INVALID_UPDATE_PROFILE_INPUT",
        INVALID_UPDATE_PROFILE_INPUT_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
