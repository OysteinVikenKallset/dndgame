export type UserRole = "admin" | "editor" | "viewer";

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  displayName?: string;
  avatarUrl?: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
