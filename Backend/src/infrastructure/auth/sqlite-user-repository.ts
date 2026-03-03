import type {
  UserProfileRepository,
  UserRegistrationRepository,
} from "../../application/ports/auth";
import type { AuthUser } from "../../domain/auth/auth-user";
import type Database from "better-sqlite3";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function toAuthUser(row: UserRow | undefined): AuthUser | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role:
      row.role === "admin" || row.role === "viewer" || row.role === "editor"
        ? row.role
        : "editor",
    ...(row.display_name !== null ? { displayName: row.display_name } : {}),
    ...(row.avatar_url !== null ? { avatarUrl: row.avatar_url } : {}),
  };
}

function nextId(existingIds: string[], prefix: string): string {
  const max = existingIds.reduce((currentMax, value) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(value);

    if (!match) {
      return currentMax;
    }

    const parsed = Number(match[1]);
    if (Number.isNaN(parsed)) {
      return currentMax;
    }

    return Math.max(currentMax, parsed);
  }, 0);

  return `${prefix}-${max + 1}`;
}

export class SqliteUserRepository
  implements UserRegistrationRepository, UserProfileRepository
{
  constructor(private readonly db: Database.Database) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const row = this.db
      .prepare(
        `SELECT id, email, password_hash, role, display_name, avatar_url
         FROM users
         WHERE email = ?`,
      )
      .get(email) as UserRow | undefined;

    return toAuthUser(row);
  }

  async findById(userId: string): Promise<AuthUser | null> {
    const row = this.db
      .prepare(
        `SELECT id, email, password_hash, role, display_name, avatar_url
         FROM users
         WHERE id = ?`,
      )
      .get(userId) as UserRow | undefined;

    return toAuthUser(row);
  }

  async create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<AuthUser> {
    const existingRows = this.db
      .prepare("SELECT id FROM users")
      .all() as Array<{ id: string }>;
    const userId = nextId(
      existingRows.map((row) => row.id),
      "user",
    );

    this.db
      .prepare(
        `INSERT INTO users (id, email, password_hash, role, display_name)
        VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        userId,
        input.email,
        input.passwordHash,
        "editor",
        input.displayName,
      );

    return {
      id: userId,
      email: input.email,
      passwordHash: input.passwordHash,
      role: "editor",
      displayName: input.displayName,
    };
  }

  async updateProfile(
    userId: string,
    input: {
      email?: string;
      role?: "admin" | "editor" | "viewer";
      displayName?: string;
      avatarUrl?: string;
    },
  ): Promise<AuthUser | null> {
    const current = await this.findById(userId);

    if (!current) {
      return null;
    }

    const nextEmail = input.email !== undefined ? input.email : current.email;
    const nextRole =
      input.role !== undefined ? input.role : (current.role ?? "editor");
    const nextDisplayName =
      input.displayName !== undefined
        ? input.displayName
        : (current.displayName ?? null);
    const nextAvatarUrl =
      input.avatarUrl !== undefined
        ? input.avatarUrl
        : (current.avatarUrl ?? null);

    this.db
      .prepare(
        `UPDATE users
         SET email = ?, role = ?, display_name = ?, avatar_url = ?
         WHERE id = ?`,
      )
      .run(nextEmail, nextRole, nextDisplayName, nextAvatarUrl, userId);

    return {
      ...current,
      email: nextEmail,
      role: nextRole,
      ...(nextDisplayName !== null ? { displayName: nextDisplayName } : {}),
      ...(nextAvatarUrl !== null ? { avatarUrl: nextAvatarUrl } : {}),
    };
  }
}
