import type {
  SessionService,
  UserProfileRepository,
} from "../../application/ports/auth";
import {
  EMAIL_ALREADY_EXISTS_ERROR,
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
  role: "admin" | "editor" | "viewer";
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
    (key) =>
      key === "email" ||
      key === "role" ||
      key === "displayName" ||
      key === "avatarUrl",
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
    ("email" in request.body &&
      request.body["email"] !== undefined &&
      typeof request.body["email"] !== "string") ||
    ("role" in request.body &&
      request.body["role"] !== undefined &&
      (typeof request.body["role"] !== "string" ||
        !["admin", "editor", "viewer"].includes(request.body["role"]))) ||
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
        ...(typeof request.body["email"] === "string"
          ? { email: request.body["email"] }
          : {}),
        ...(typeof request.body["role"] === "string" &&
        (request.body["role"] === "admin" ||
          request.body["role"] === "editor" ||
          request.body["role"] === "viewer")
          ? { role: request.body["role"] }
          : {}),
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

    if (
      error instanceof Error &&
      error.message === EMAIL_ALREADY_EXISTS_ERROR
    ) {
      return createApiErrorResponse(409, "EMAIL_ALREADY_EXISTS", error.message);
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
