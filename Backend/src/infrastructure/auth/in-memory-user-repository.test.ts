import { describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "./in-memory-user-repository";

describe("InMemoryUserRepository", () => {
  it("returns user when email exists", async () => {
    const repository = new InMemoryUserRepository([
      {
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
      },
    ]);

    await expect(repository.findByEmail("alice@example.com")).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      passwordHash: "hash:password123",
    });
  });

  it("returns user when id exists", async () => {
    const repository = new InMemoryUserRepository([
      {
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
        displayName: "Alice",
      },
    ]);

    await expect(repository.findById("user-1")).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      passwordHash: "hash:password123",
      displayName: "Alice",
    });
  });

  it("returns null when id does not exist", async () => {
    const repository = new InMemoryUserRepository([]);

    await expect(repository.findById("unknown-user")).resolves.toBeNull();
  });

  it("returns null when email does not exist", async () => {
    const repository = new InMemoryUserRepository([]);

    await expect(
      repository.findByEmail("unknown@example.com"),
    ).resolves.toBeNull();
  });

  it("creates and stores a new user", async () => {
    const repository = new InMemoryUserRepository([]);

    await expect(
      repository.create({
        email: "new@example.com",
        passwordHash: "hash:password123",
        displayName: "New User",
      }),
    ).resolves.toEqual({
      id: "user-1",
      email: "new@example.com",
      passwordHash: "hash:password123",
      displayName: "New User",
    });

    await expect(repository.findByEmail("new@example.com")).resolves.toEqual({
      id: "user-1",
      email: "new@example.com",
      passwordHash: "hash:password123",
      displayName: "New User",
    });
  });

  it("updates displayName and avatarUrl for existing user", async () => {
    const repository = new InMemoryUserRepository([
      {
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
        displayName: "Alice",
      },
    ]);

    await expect(
      repository.updateProfile("user-1", {
        displayName: "Alice Liddell",
        avatarUrl: "https://example.com/avatar.png",
      }),
    ).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      passwordHash: "hash:password123",
      displayName: "Alice Liddell",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("keeps user unchanged when no profile fields are provided", async () => {
    const repository = new InMemoryUserRepository([
      {
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash:password123",
        displayName: "Alice",
      },
    ]);

    await expect(repository.updateProfile("user-1", {})).resolves.toEqual({
      id: "user-1",
      email: "alice@example.com",
      passwordHash: "hash:password123",
      displayName: "Alice",
    });
  });

  it("returns null when updating profile for unknown user", async () => {
    const repository = new InMemoryUserRepository([]);

    await expect(
      repository.updateProfile("missing-user", {
        displayName: "Alice",
      }),
    ).resolves.toBeNull();
  });
});
