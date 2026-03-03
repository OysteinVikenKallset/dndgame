import { normalizeEmail } from "../../domain/auth/auth-user";
import type {
  PasswordHashingService,
  UserRegistrationRepository,
} from "../ports/auth";

type RegisterUserInput = {
  email: string;
  password: string;
  displayName: string;
};

type RegisterUserDependencies = {
  userRepository: UserRegistrationRepository;
  passwordHasher: PasswordHashingService;
};

export const EMAIL_ALREADY_IN_USE_ERROR = "Email already in use";
export const INVALID_REGISTER_INPUT_ERROR = "Invalid register input";

const MIN_PASSWORD_LENGTH = 12;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerUser(
  input: RegisterUserInput,
  dependencies: RegisterUserDependencies,
): Promise<{ id: string; email: string; displayName: string }> {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedDisplayName = input.displayName.trim();

  if (
    !isValidEmail(normalizedEmail) ||
    input.password.length < MIN_PASSWORD_LENGTH ||
    normalizedDisplayName.length === 0
  ) {
    throw new Error(INVALID_REGISTER_INPUT_ERROR);
  }

  const existingUser =
    await dependencies.userRepository.findByEmail(normalizedEmail);

  if (existingUser !== null) {
    throw new Error(EMAIL_ALREADY_IN_USE_ERROR);
  }

  const passwordHash = await dependencies.passwordHasher.hash(input.password);

  const createdUser = await dependencies.userRepository.create({
    email: normalizedEmail,
    passwordHash,
    displayName: normalizedDisplayName,
  });

  return {
    id: createdUser.id,
    email: normalizedEmail,
    displayName: normalizedDisplayName,
  };
}
