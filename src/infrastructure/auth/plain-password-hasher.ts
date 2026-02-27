import type { PasswordHasher } from "../../application/ports/auth";

export class PlainPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hash:${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hash:${password}`;
  }
}
