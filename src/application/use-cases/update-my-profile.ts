import type { SessionService, UserProfileRepository } from "../ports/auth";

type UpdateMyProfileInput = {
  sessionId: string;
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

export async function updateMyProfile(
  input: UpdateMyProfileInput,
  dependencies: UpdateMyProfileDependencies,
): Promise<{
  id: string;
  email: string;
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

  const normalizedDisplayName = input.displayName?.trim();
  const normalizedAvatarUrl = input.avatarUrl?.trim();

  if (
    normalizedDisplayName === "" ||
    normalizedAvatarUrl === "" ||
    (normalizedDisplayName === undefined && normalizedAvatarUrl === undefined)
  ) {
    throw new Error(INVALID_UPDATE_PROFILE_INPUT_ERROR);
  }

  const updatedUser = await dependencies.userRepository.updateProfile(userId, {
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
    displayName: updatedUser.displayName ?? "",
    ...(updatedUser.avatarUrl !== undefined
      ? { avatarUrl: updatedUser.avatarUrl }
      : {}),
  };
}
