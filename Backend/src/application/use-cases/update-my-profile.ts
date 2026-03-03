import { normalizeEmail, type UserRole } from "../../domain/auth/auth-user";
import type { SessionService, UserProfileRepository } from "../ports/auth";

type UpdateMyProfileInput = {
  sessionId: string;
  email?: string;
  role?: UserRole;
  displayName?: string;
  avatarUrl?: string;
};

type UpdateMyProfileDependencies = {
  userRepository: UserProfileRepository;
  sessionService: SessionService;
};

export const UNAUTHORIZED_ERROR = "Unauthorized";
export const INVALID_UPDATE_PROFILE_INPUT_ERROR =
  "Invalid update profile input";
export const EMAIL_ALREADY_EXISTS_ERROR = "Email already exists";

export async function updateMyProfile(
  input: UpdateMyProfileInput,
  dependencies: UpdateMyProfileDependencies,
): Promise<{
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
}> {
  if (input.sessionId.trim().length === 0) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const normalizedEmail =
    input.email !== undefined ? normalizeEmail(input.email) : undefined;
  const normalizedDisplayName = input.displayName?.trim();
  const normalizedAvatarUrl = input.avatarUrl?.trim();

  if (
    normalizedEmail === "" ||
    normalizedDisplayName === "" ||
    normalizedAvatarUrl === "" ||
    (normalizedEmail === undefined &&
      input.role === undefined &&
      normalizedDisplayName === undefined &&
      normalizedAvatarUrl === undefined)
  ) {
    throw new Error(INVALID_UPDATE_PROFILE_INPUT_ERROR);
  }

  if (normalizedEmail !== undefined) {
    const existingUser =
      await dependencies.userRepository.findByEmail(normalizedEmail);

    if (existingUser && existingUser.id !== userId) {
      throw new Error(EMAIL_ALREADY_EXISTS_ERROR);
    }
  }

  const updatedUser = await dependencies.userRepository.updateProfile(userId, {
    ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(normalizedDisplayName !== undefined
      ? { displayName: normalizedDisplayName }
      : {}),
    ...(normalizedAvatarUrl !== undefined
      ? { avatarUrl: normalizedAvatarUrl }
      : {}),
  });

  if (!updatedUser) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role ?? "editor",
    displayName: updatedUser.displayName ?? "",
    ...(updatedUser.avatarUrl !== undefined
      ? { avatarUrl: updatedUser.avatarUrl }
      : {}),
  };
}
