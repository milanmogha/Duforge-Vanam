// utils/rateLimit.js
// Lightweight in-memory rate limiter (no external dependency). Suitable for a
// single-instance deployment / localhost. For multi-instance production, back
// this with Redis. Keyed by IP + route bucket.

const buckets = new Map();

// Periodically evict stale entries to bound memory.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}, SWEEP_INTERVAL_MS).unref?.();

/**
 * @param {object} opts
 * @param {number} opts.windowMs  Sliding window length in ms.
 * @param {number} opts.max       Max requests per window per key.
 * @param {string} [opts.bucket]  Namespace so different routes don't share counters.
 * @param {(req)=>string} [opts.keyGenerator]
 */
export function rateLimit({ windowMs, max, bucket = "default", keyGenerator } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    const id = keyGenerator ? keyGenerator(req) : (req.ip || req.connection?.remoteAddress || "unknown");
    const key = `${bucket}:${id}`;
    const now = Date.now();

    let entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
        retryAfter,
      });
    }
    next();
  };
}

export default rateLimit;
