import type { UserRepository } from "../../application/ports/auth";
import type { AuthUser } from "../../domain/auth/auth-user";

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly users: AuthUser[]) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = this.users.find((entry) => entry.email === email);
    return user ?? null;
  }

  async findById(userId: string): Promise<AuthUser | null> {
    const user = this.users.find((entry) => entry.id === userId);
    return user ?? null;
  }

  async create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<AuthUser> {
    const createdUser: AuthUser = {
      id: `user-${this.users.length + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
    };

    this.users.push(createdUser);
    return createdUser;
  }

  async updateProfile(
    userId: string,
    input: {
      displayName?: string;
      avatarUrl?: string;
    },
  ): Promise<AuthUser | null> {
    const userIndex = this.users.findIndex((entry) => entry.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const user = this.users[userIndex] as AuthUser;

    const updatedUser: AuthUser = {
      ...user,
      ...(input.displayName !== undefined
        ? { displayName: input.displayName }
        : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    };

    this.users[userIndex] = updatedUser;
    return updatedUser;
  }
}
