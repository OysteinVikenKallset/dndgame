import type {
  SessionService,
  UserProfileRepository,
} from "../../application/ports/auth";
import {
  INVALID_UPDATE_PROFILE_INPUT_ERROR,
  UNAUTHORIZED_ERROR,
  updateMyProfile,
} from "../../application/use-cases/update-my-profile";
import { extractSessionId } from "./session-cookie";

type UpdateMyProfileRequest = {
  headers: {
    cookie?: string;
  };
  body: Record<string, unknown>;
};

type UpdateMyProfileResponse = {
  status: number;
  body:
    | {
        id: string;
        email: string;
        displayName: string;
        avatarUrl?: string;
      }
    | {
        error: string;
      };
};

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
): Promise<UpdateMyProfileResponse> {
  if (!hasOnlyAllowedFields(request.body)) {
    return {
      status: 400,
      body: {
        error: INVALID_UPDATE_PROFILE_INPUT_ERROR,
      },
    };
  }

  if (
    ("displayName" in request.body &&
      request.body["displayName"] !== undefined &&
      typeof request.body["displayName"] !== "string") ||
    ("avatarUrl" in request.body &&
      request.body["avatarUrl"] !== undefined &&
      typeof request.body["avatarUrl"] !== "string")
  ) {
    return {
      status: 400,
      body: {
        error: INVALID_UPDATE_PROFILE_INPUT_ERROR,
      },
    };
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

    return {
      status: 200,
      body: updated,
    };
  } catch (error) {
    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR) {
      return {
        status: 401,
        body: {
          error: UNAUTHORIZED_ERROR,
        },
      };
    }

    if (
      error instanceof Error &&
      error.message === INVALID_UPDATE_PROFILE_INPUT_ERROR
    ) {
      return {
        status: 400,
        body: {
          error: INVALID_UPDATE_PROFILE_INPUT_ERROR,
        },
      };
    }

    return {
      status: 500,
      body: {
        error: "Internal server error",
      },
    };
  }
}
