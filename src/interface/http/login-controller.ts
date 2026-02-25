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
import { buildSessionCookie } from "./session-cookie";

type LoginRequest = {
  body: {
    email: string;
    password: string;
  };
};

type LoginResponse = {
  status: number;
  body: {
    user?: {
      id: string;
      email: string;
      displayName: string;
    };
    error?: string;
  };
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
): Promise<LoginResponse> {
  try {
    const result = await loginUser(request.body, dependencies);

    return {
      status: 200,
      body: { user: result.user },
      setCookie: buildSessionCookie(result.sessionId),
    };
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_CREDENTIALS_ERROR) {
      return {
        status: 401,
        body: { error: INVALID_CREDENTIALS_ERROR },
      };
    }

    if (error instanceof Error && error.message === INVALID_LOGIN_INPUT_ERROR) {
      return {
        status: 400,
        body: { error: INVALID_LOGIN_INPUT_ERROR },
      };
    }

    return {
      status: 500,
      body: { error: "Internal server error" },
    };
  }
}
