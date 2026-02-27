import {
  INVALID_CREDENTIALS_ERROR,
  INVALID_LOGIN_INPUT_ERROR,
  loginUser,
} from "../../application/use-cases/login-user";
import type {
  PasswordHasher,
  SessionService,
  UserRepository,
} from "../../application/ports/auth";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from "./api-response";
import { buildSessionCookie } from "./session-cookie";

type LoginRequest = {
  body: {
    email: string;
    password: string;
  };
};

type LoginResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
};

type LoginControllerResponse =
  | ApiSuccessResponse<LoginResponse>
  | ApiErrorResponse;

type LoginResponseWithCookie = LoginControllerResponse & {
  setCookie?: string;
};

type LoginControllerDependencies = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  sessionService: SessionService;
};

export async function handleLoginRequest(
  request: LoginRequest,
  dependencies: LoginControllerDependencies,
): Promise<LoginResponseWithCookie> {
  try {
    const result = await loginUser(request.body, dependencies);

    return {
      ...createApiSuccessResponse(200, { user: result.user }),
      setCookie: buildSessionCookie(result.sessionId),
    };
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_CREDENTIALS_ERROR) {
      return createApiErrorResponse(
        401,
        "INVALID_CREDENTIALS",
        INVALID_CREDENTIALS_ERROR,
      );
    }

    if (error instanceof Error && error.message === INVALID_LOGIN_INPUT_ERROR) {
      return createApiErrorResponse(
        400,
        "INVALID_LOGIN_INPUT",
        INVALID_LOGIN_INPUT_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
