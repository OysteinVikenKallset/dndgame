import { InMemoryUserRepository } from "./infrastructure/auth/in-memory-user-repository";
import { InMemorySessionService } from "./infrastructure/auth/in-memory-session-service";
import { PlainPasswordHasher } from "./infrastructure/auth/plain-password-hasher";
import { handleLoginRequest } from "./interface/http/login-controller";

export function add(a: number, b: number): number {
  return a + b;
}

const userRepository = new InMemoryUserRepository([
  {
    id: "user-1",
    email: "alice@example.com",
    passwordHash: "hash:password123",
  },
]);

const passwordHasher = new PlainPasswordHasher();
const sessionService = new InMemorySessionService();

export function loginViaHttp(email: string, password: string) {
  return handleLoginRequest(
    {
      body: {
        email,
        password,
      },
    },
    {
      userRepository,
      passwordHasher,
      sessionService,
    },
  );
}
