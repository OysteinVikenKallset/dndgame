export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  avatarUrl?: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
