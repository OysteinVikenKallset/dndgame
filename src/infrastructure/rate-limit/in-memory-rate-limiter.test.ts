import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "./in-memory-rate-limiter";

describe("InMemoryRateLimiter", () => {
  it("uses default clock when now is not provided", () => {
    const limiter = new InMemoryRateLimiter({
      maxRequests: 1,
      windowMs: 1_000,
    });

    expect(limiter.allow("ip:email")).toBe(true);
    expect(limiter.allow("ip:email")).toBe(false);
  });

  it("allows requests up to maxRequests", () => {
    let now = 1_000;
    const limiter = new InMemoryRateLimiter({
      maxRequests: 2,
      windowMs: 1_000,
      now: () => now,
    });

    expect(limiter.allow("ip:email")).toBe(true);
    now += 1;
    expect(limiter.allow("ip:email")).toBe(true);
  });

  it("blocks requests after maxRequests within same window", () => {
    let now = 2_000;
    const limiter = new InMemoryRateLimiter({
      maxRequests: 2,
      windowMs: 1_000,
      now: () => now,
    });

    expect(limiter.allow("ip:email")).toBe(true);
    now += 1;
    expect(limiter.allow("ip:email")).toBe(true);
    now += 1;
    expect(limiter.allow("ip:email")).toBe(false);
  });

  it("allows again when window has passed", () => {
    let now = 3_000;
    const limiter = new InMemoryRateLimiter({
      maxRequests: 1,
      windowMs: 100,
      now: () => now,
    });

    expect(limiter.allow("ip:email")).toBe(true);
    expect(limiter.allow("ip:email")).toBe(false);

    now += 101;
    expect(limiter.allow("ip:email")).toBe(true);
  });

  it("tracks different keys independently", () => {
    const limiter = new InMemoryRateLimiter({
      maxRequests: 1,
      windowMs: 1_000,
      now: () => 10,
    });

    expect(limiter.allow("ip-1:alice@example.com")).toBe(true);
    expect(limiter.allow("ip-2:alice@example.com")).toBe(true);
    expect(limiter.allow("ip-1:alice@example.com")).toBe(false);
  });
});
