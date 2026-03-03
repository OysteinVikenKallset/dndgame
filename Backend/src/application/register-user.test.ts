import { describe, expect, it } from "vitest";
import { registerUser } from "./use-cases/register-user";

describe("registerUser", () => {
  it("returns created user for valid input", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      create: async (input: {
        email: string;
        passwordHash: string;
        displayName: string;
      }) => ({
        id: "user-2",
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
      }),
    };

    const passwordHasher = {
      hash: async (password: string) => `hash:${password}`,
    };

    const result = await registerUser(
      {
        email: "Alice@Example.com",
        password: "very-strong-password",
        displayName: "Alice",
      },
      { userRepository, passwordHasher },
    );

    expect(result).toEqual({
      id: "user-2",
      email: "alice@example.com",
      displayName: "Alice",
    });
  });

  it("throws when email is already in use", async () => {
    const userRepository = {
      findByEmail: async () => ({
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "existing-hash",
      }),
      findById: async () => null,
      create: async () => ({
        id: "user-2",
        email: "alice@example.com",
        passwordHash: "hash:very-strong-password",
      }),
    };

    const passwordHasher = {
      hash: async (password: string) => `hash:${password}`,
    };

    await expect(
      registerUser(
        {
          email: "Alice@Example.com",
          password: "very-strong-password",
          displayName: "Alice",
        },
        { userRepository, passwordHasher },
      ),
    ).rejects.toThrow("Email already in use");
  });

  it("throws for invalid email format", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      create: async () => ({
        id: "user-2",
        email: "alice@example.com",
        passwordHash: "hash:very-strong-password",
      }),
    };

    const passwordHasher = {
      hash: async (password: string) => `hash:${password}`,
    };

    await expect(
      registerUser(
        {
          email: "not-an-email",
          password: "very-strong-password",
          displayName: "Alice",
        },
        { userRepository, passwordHasher },
      ),
    ).rejects.toThrow("Invalid register input");
  });

  it("throws for short password", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      create: async () => ({
        id: "user-2",
        email: "alice@example.com",
        passwordHash: "hash:short",
      }),
    };

    const passwordHasher = {
      hash: async (password: string) => `hash:${password}`,
    };

    await expect(
      registerUser(
        {
          email: "alice@example.com",
          password: "short",
          displayName: "Alice",
        },
        { userRepository, passwordHasher },
      ),
    ).rejects.toThrow("Invalid register input");
  });

  it("throws for empty display name after trim", async () => {
    const userRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      create: async () => ({
        id: "user-2",
        email: "alice@example.com",
        passwordHash: "hash:very-strong-password",
      }),
    };

    const passwordHasher = {
      hash: async (password: string) => `hash:${password}`,
    };

    await expect(
      registerUser(
        {
          email: "alice@example.com",
          password: "very-strong-password",
          displayName: "   ",
        },
        { userRepository, passwordHasher },
      ),
    ).rejects.toThrow("Invalid register input");
  });
});
