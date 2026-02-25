import express, { type Request, type Response } from "express";
import { InMemorySessionService } from "./infrastructure/auth/in-memory-session-service";
import { InMemoryUserRepository } from "./infrastructure/auth/in-memory-user-repository";
import { PlainPasswordHasher } from "./infrastructure/auth/plain-password-hasher";
import { InMemoryRateLimiter } from "./infrastructure/rate-limit/in-memory-rate-limiter";
import { handleGetMyProfileRequest } from "./interface/http/get-my-profile-controller";
import { handleLoginRequest } from "./interface/http/login-controller";
import { handleLogoutRequest } from "./interface/http/logout-controller";
import { handleRegisterRequest } from "./interface/http/register-controller";
import { handleUpdateMyProfileRequest } from "./interface/http/update-my-profile-controller";

const app = express();
app.use(express.json());

const userRepository = new InMemoryUserRepository([
  {
    id: "user-1",
    email: "alice@example.com",
    passwordHash: "hash:password123",
  },
]);

const passwordHasher = new PlainPasswordHasher();
const sessionService = new InMemorySessionService();
const loginRateLimiter = new InMemoryRateLimiter({
  maxRequests: 5,
  windowMs: 10 * 60 * 1000,
});
const registerRateLimiter = new InMemoryRateLimiter({
  maxRequests: 5,
  windowMs: 10 * 60 * 1000,
});

function buildRateLimitKey(request: Request, email: string): string {
  return `${request.ip}:${email.trim().toLowerCase()}`;
}

async function loginRouteHandler(request: Request, response: Response) {
  const email = String(request.body?.email ?? "");
  const canProceed = loginRateLimiter.allow(buildRateLimitKey(request, email));

  if (!canProceed) {
    response.status(429).json({
      error: "Too many requests",
    });
    return;
  }

  const result = await handleLoginRequest(
    {
      body: {
        email,
        password: String(request.body?.password ?? ""),
      },
    },
    {
      userRepository,
      passwordHasher,
      sessionService,
    },
  );

  if (result.setCookie) {
    response.setHeader("Set-Cookie", result.setCookie);
  }

  response.status(result.status).json(result.body);
}

app.post("/api/auth/login", loginRouteHandler);
app.post("/login", loginRouteHandler);

app.get("/api/auth/me", async (request: Request, response: Response) => {
  const cookie = request.header("cookie");

  const result = await handleGetMyProfileRequest(
    {
      headers: cookie ? { cookie } : {},
    },
    {
      userRepository,
      sessionService,
    },
  );

  response.status(result.status).json(result.body);
});

app.post("/api/auth/logout", async (request: Request, response: Response) => {
  const cookie = request.header("cookie");

  const result = await handleLogoutRequest(
    {
      headers: cookie ? { cookie } : {},
    },
    {
      sessionService,
    },
  );

  if ("clearCookie" in result) {
    response.setHeader("Set-Cookie", result.clearCookie);
    response.status(result.status).send();
    return;
  }

  response.status(result.status).json(result.body);
});

app.post("/api/auth/register", async (request: Request, response: Response) => {
  const email = String(request.body?.email ?? "");
  const canProceed = registerRateLimiter.allow(
    buildRateLimitKey(request, email),
  );

  if (!canProceed) {
    response.status(429).json({
      error: "Too many requests",
    });
    return;
  }

  const result = await handleRegisterRequest(
    {
      body: {
        email,
        password: String(request.body?.password ?? ""),
        displayName: String(request.body?.displayName ?? ""),
      },
    },
    {
      userRepository,
      passwordHasher,
    },
  );

  response.status(result.status).json(result.body);
});

app.patch("/api/users/me", async (request: Request, response: Response) => {
  const cookie = request.header("cookie");

  const result = await handleUpdateMyProfileRequest(
    {
      headers: cookie ? { cookie } : {},
      body:
        request.body && typeof request.body === "object"
          ? (request.body as Record<string, unknown>)
          : {},
    },
    {
      userRepository,
      sessionService,
    },
  );

  response.status(result.status).json(result.body);
});

const port = Number(process.env["PORT"] ?? 3000);

if (process.env["NODE_ENV"] !== "test") {
  app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });
}

export { app };
