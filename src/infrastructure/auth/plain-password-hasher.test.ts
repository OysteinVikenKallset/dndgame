import { describe, expect, it } from "vitest";
import { PlainPasswordHasher } from "./plain-password-hasher";

describe("PlainPasswordHasher", () => {
  it("hashes password in expected format", async () => {
    const hasher = new PlainPasswordHasher();

    await expect(hasher.hash("password123")).resolves.toBe("hash:password123");
  });

  it("returns true when hash matches password format", async () => {
    const hasher = new PlainPasswordHasher();

    await expect(
      hasher.compare("password123", "hash:password123"),
    ).resolves.toBe(true);
  });

  it("returns false when hash does not match password", async () => {
    const hasher = new PlainPasswordHasher();

    await expect(hasher.compare("password123", "hash:wrong")).resolves.toBe(
      false,
    );
  });
});
