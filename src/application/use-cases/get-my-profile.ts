import type { SessionService, UserRepository } from "../ports/auth";

type GetMyProfileInput = {
  sessionId: string;
};

type GetMyProfileDependencies = {
  userRepository: UserRepository;
  sessionService: SessionService;
};

export const UNAUTHORIZED_ERROR = "Unauthorized";

export async function getMyProfile(
  input: GetMyProfileInput,
  dependencies: GetMyProfileDependencies,
): Promise<{ id: string; email: string; displayName: string }> {
  if (input.sessionId.trim().length === 0) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const user = await dependencies.userRepository.findById(userId);

  if (!user) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? "",
  };
}
