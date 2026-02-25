import type { AuthUser } from "../../domain/auth/auth-user";

export type UserRepository = {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(userId: string): Promise<AuthUser | null>;
};

export type UserRegistrationRepository = UserRepository & {
  create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<AuthUser>;
};

export type UserProfileRepository = UserRepository & {
  updateProfile(
    userId: string,
    input: {
      displayName?: string;
      avatarUrl?: string;
    },
  ): Promise<AuthUser | null>;
};

export type PasswordHasher = {
  compare(password: string, hash: string): Promise<boolean>;
};

export type PasswordHashingService = {
  hash(password: string): Promise<string>;
};

export type SessionService = {
  createSession(userId: string): string;
  getUserId(sessionId: string): string | null;
  invalidateSession(sessionId: string): void;
};
