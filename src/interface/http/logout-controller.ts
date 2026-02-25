import {
  logoutUser,
  UNAUTHORIZED_ERROR,
} from "../../application/use-cases/logout-user";
import type { SessionService } from "../../application/ports/auth";
import { buildClearSessionCookie, extractSessionId } from "./session-cookie";

type LogoutRequest = {
  headers: {
    cookie?: string;
  };
};

type LogoutResponse =
  | {
      status: 204;
      clearCookie: string;
    }
  | {
      status: 401 | 500;
      body: {
        error: string;
      };
    };

type LogoutControllerDependencies = {
  sessionService: SessionService;
};

export async function handleLogoutRequest(
  request: LogoutRequest,
  dependencies: LogoutControllerDependencies,
): Promise<LogoutResponse> {
  try {
    await logoutUser(
      {
        sessionId: extractSessionId(request.headers.cookie),
      },
      dependencies,
    );

    return {
      status: 204,
      clearCookie: buildClearSessionCookie(),
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

    return {
      status: 500,
      body: {
        error: "Internal server error",
      },
    };
  }
}
