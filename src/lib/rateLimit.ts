/**
 * In-memory token bucket rate limiter.
 * Tracks per-IP request counts.
 *
 * Note: This resets per instance/redeploy. For multi-instance deployments,
 * use @upstash/ratelimit with Upstash Redis as a future enhancement.
 */

interface TokenBucket {
  tokens: number;
  lastRefilled: number;
}

const buckets = new Map<string, TokenBucket>();

export interface RateLimitConfig {
  maxRequests: number; // tokens per window
  windowMs: number; // refill window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60 * 1000, // 1 minute
};

const STRICT_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Check if an IP has available tokens.
 * Returns { allowed: boolean, remaining: number }
 */
export function checkRateLimit(ip: string, config: RateLimitConfig = DEFAULT_CONFIG) {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    // New bucket
    bucket = { tokens: config.maxRequests - 1, lastRefilled: now };
    buckets.set(ip, bucket);
    return { allowed: true, remaining: bucket.tokens };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefilled;
  const refillRate = config.maxRequests / config.windowMs;
  const tokensToAdd = elapsed * refillRate;

  bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd);
  bucket.lastRefilled = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, remaining: Math.floor(bucket.tokens) };
  }

  return { allowed: false, remaining: 0 };
}

/**
 * Get strict rate limit config (for auth endpoints).
 */
export function getStrictRateLimitConfig() {
  return STRICT_CONFIG;
}

/**
 * Clear old buckets to prevent unbounded memory growth (called periodically).
 */
export function clearOldBuckets(maxAgeSec: number = 3600) {
  const now = Date.now();
  const maxAge = maxAgeSec * 1000;

  for (const [ip, bucket] of buckets.entries()) {
    if (now - bucket.lastRefilled > maxAge) {
      buckets.delete(ip);
    }
  }
}

// Clear old buckets every 5 minutes
setInterval(() => clearOldBuckets(), 5 * 60 * 1000);
