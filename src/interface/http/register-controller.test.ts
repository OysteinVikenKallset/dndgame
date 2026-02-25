import { describe, expect, it } from "vitest";
import { handleRegisterRequest } from "./register-controller";

describe("handleRegisterRequest", () => {
  it("returns 201 with created user", async () => {
    const response = await handleRegisterRequest(
      {
        body: {
          email: "Alice@Example.com",
          password: "very-strong-password",
          displayName: "Alice",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          create: async (input) => ({
            id: "user-2",
            email: input.email,
            passwordHash: input.passwordHash,
          }),
        },
        passwordHasher: {
          hash: async (password) => `hash:${password}`,
        },
      },
    );

    expect(response).toEqual({
      status: 201,
      body: {
        user: {
          id: "user-2",
          email: "alice@example.com",
          displayName: "Alice",
        },
      },
    });
  });

  it("returns 409 when email is already in use", async () => {
    const response = await handleRegisterRequest(
      {
        body: {
          email: "Alice@Example.com",
          password: "very-strong-password",
          displayName: "Alice",
        },
      },
      {
        userRepository: {
          findByEmail: async () => ({
            id: "user-1",
            email: "alice@example.com",
            passwordHash: "existing-hash",
          }),
          findById: async () => null,
          create: async (input) => ({
            id: "user-2",
            email: input.email,
            passwordHash: input.passwordHash,
          }),
        },
        passwordHasher: {
          hash: async (password) => `hash:${password}`,
        },
      },
    );

    expect(response).toEqual({
      status: 409,
      body: {
        error: "Email already in use",
      },
    });
  });

  it("returns 500 on unexpected errors", async () => {
    const response = await handleRegisterRequest(
      {
        body: {
          email: "Alice@Example.com",
          password: "very-strong-password",
          displayName: "Alice",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          create: async () => {
            throw new Error("db unavailable");
          },
        },
        passwordHasher: {
          hash: async (password) => `hash:${password}`,
        },
      },
    );

    expect(response).toEqual({
      status: 500,
      body: {
        error: "Internal server error",
      },
    });
  });

  it("returns 400 for invalid register input", async () => {
    const response = await handleRegisterRequest(
      {
        body: {
          email: "invalid-email",
          password: "short",
          displayName: "Alice",
        },
      },
      {
        userRepository: {
          findByEmail: async () => null,
          findById: async () => null,
          create: async () => ({
            id: "user-2",
            email: "alice@example.com",
            passwordHash: "hash:very-strong-password",
          }),
        },
        passwordHasher: {
          hash: async (password) => `hash:${password}`,
        },
      },
    );

    expect(response).toEqual({
      status: 400,
      body: {
        error: "Invalid register input",
      },
    });
  });
});
