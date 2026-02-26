import {
  EMAIL_ALREADY_IN_USE_ERROR,
  INVALID_REGISTER_INPUT_ERROR,
  registerUser,
} from "../../application/use-cases/register-user";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from "./api-response";
import type {
  PasswordHashingService,
  UserRegistrationRepository,
} from "../../application/ports/auth";

type RegisterRequest = {
  body: {
    email: string;
    password: string;
    displayName: string;
  };
};

type RegisterResponse = {
  id: string;
  email: string;
  displayName: string;
};

type RegisterControllerResponse =
  | ApiSuccessResponse<RegisterResponse>
  | ApiErrorResponse;

type RegisterControllerDependencies = {
  userRepository: UserRegistrationRepository;
  passwordHasher: PasswordHashingService;
};

export async function handleRegisterRequest(
  request: RegisterRequest,
  dependencies: RegisterControllerDependencies,
): Promise<RegisterControllerResponse> {
  try {
    const created = await registerUser(request.body, dependencies);

    return createApiSuccessResponse(201, created);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === EMAIL_ALREADY_IN_USE_ERROR
    ) {
      return createApiErrorResponse(
        409,
        "EMAIL_ALREADY_IN_USE",
        EMAIL_ALREADY_IN_USE_ERROR,
      );
    }

    if (
      error instanceof Error &&
      error.message === INVALID_REGISTER_INPUT_ERROR
    ) {
      return createApiErrorResponse(
        400,
        "INVALID_REGISTER_INPUT",
        INVALID_REGISTER_INPUT_ERROR,
      );
    }

    return createApiErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
    );
  }
}
