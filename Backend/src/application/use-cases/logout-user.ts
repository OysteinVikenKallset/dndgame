import type { SessionService } from "../ports/auth";

type LogoutUserInput = {
  sessionId: string;
};

type LogoutUserDependencies = {
  sessionService: SessionService;
};

export const UNAUTHORIZED_ERROR = "Unauthorized";

export async function logoutUser(
  input: LogoutUserInput,
  dependencies: LogoutUserDependencies,
): Promise<void> {
  if (input.sessionId.trim().length === 0) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  const userId = dependencies.sessionService.getUserId(input.sessionId);

  if (!userId) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  dependencies.sessionService.invalidateSession(input.sessionId);
}
