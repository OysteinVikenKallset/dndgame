type InMemoryRateLimiterInput = {
  maxRequests: number;
  windowMs: number;
  now?: () => number;
};

export class InMemoryRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  private readonly attempts = new Map<string, number[]>();

  public constructor(input: InMemoryRateLimiterInput) {
    this.maxRequests = input.maxRequests;
    this.windowMs = input.windowMs;
    this.now = input.now ?? (() => Date.now());
  }

  public allow(key: string): boolean {
    const now = this.now();
    const windowStart = now - this.windowMs;
    const existingAttempts = this.attempts.get(key) ?? [];
    const recentAttempts = existingAttempts.filter(
      (attemptTimestamp) => attemptTimestamp > windowStart,
    );

    if (recentAttempts.length >= this.maxRequests) {
      this.attempts.set(key, recentAttempts);
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }
}
