import {
  getMyProfile,
  UNAUTHORIZED_ERROR,
} from "../../application/use-cases/get-my-profile";
import type {
  SessionService,
  UserRepository,
} from "../../application/ports/auth";
import { extractSessionId } from "./session-cookie";

type GetMyProfileRequest = {
  headers: {
    cookie?: string;
  };
};

type GetMyProfileResponse = {
  status: number;
  body:
    | {
        id: string;
        email: string;
        displayName: string;
      }
    | {
        error: string;
      };
};

type GetMyProfileControllerDependencies = {
  userRepository: UserRepository;
  sessionService: SessionService;
};

export async function handleGetMyProfileRequest(
  request: GetMyProfileRequest,
  dependencies: GetMyProfileControllerDependencies,
): Promise<GetMyProfileResponse> {
  try {
    const profile = await getMyProfile(
      {
        sessionId: extractSessionId(request.headers.cookie),
      },
      dependencies,
    );

    return {
      status: 200,
      body: profile,
    };
  } catch (error) {
    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR) {
      return {
        status: 401,
        body: { error: UNAUTHORIZED_ERROR },
      };
    }

    return {
      status: 500,
      body: { error: "Internal server error" },
    };
  }
}
