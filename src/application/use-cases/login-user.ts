import { normalizeEmail } from "../../domain/auth/auth-user";
import type {
  PasswordHasher,
  SessionService,
  UserRepository,
} from "../ports/auth";

type LoginInput = {
  email: string;
  password: string;
};

type LoginDependencies = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  sessionService: SessionService;
};

export const INVALID_LOGIN_INPUT_ERROR = "Invalid login input";
export const INVALID_CREDENTIALS_ERROR = "Invalid credentials";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function loginUser(
  input: LoginInput,
  dependencies: LoginDependencies,
): Promise<{
  sessionId: string;
  user: { id: string; email: string; displayName: string };
}> {
  const normalizedEmail = normalizeEmail(input.email);

  if (!isValidEmail(normalizedEmail) || input.password.length === 0) {
    throw new Error(INVALID_LOGIN_INPUT_ERROR);
  }

  const user = await dependencies.userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new Error(INVALID_CREDENTIALS_ERROR);
  }

  const passwordMatches = await dependencies.passwordHasher.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error(INVALID_CREDENTIALS_ERROR);
  }

  const sessionId = dependencies.sessionService.createSession(user.id);

  return {
    sessionId,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? "",
    },
  };
}
