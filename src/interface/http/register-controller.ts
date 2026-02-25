import {
  EMAIL_ALREADY_IN_USE_ERROR,
  INVALID_REGISTER_INPUT_ERROR,
  registerUser,
} from "../../application/use-cases/register-user";
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
  status: number;
  body:
    | {
        user: {
          id: string;
          email: string;
          displayName: string;
        };
      }
    | {
        error: string;
      };
};

type RegisterControllerDependencies = {
  userRepository: UserRegistrationRepository;
  passwordHasher: PasswordHashingService;
};

export async function handleRegisterRequest(
  request: RegisterRequest,
  dependencies: RegisterControllerDependencies,
): Promise<RegisterResponse> {
  try {
    const created = await registerUser(request.body, dependencies);

    return {
      status: 201,
      body: {
        user: created,
      },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === EMAIL_ALREADY_IN_USE_ERROR
    ) {
      return {
        status: 409,
        body: { error: EMAIL_ALREADY_IN_USE_ERROR },
      };
    }

    if (
      error instanceof Error &&
      error.message === INVALID_REGISTER_INPUT_ERROR
    ) {
      return {
        status: 400,
        body: { error: INVALID_REGISTER_INPUT_ERROR },
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
