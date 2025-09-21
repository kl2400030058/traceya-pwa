"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsRateLimiter = exports.authRateLimiter = exports.rateLimiter = void 0;
const ioredis_1 = require("ioredis");
const redis = new ioredis_1.Redis(process.env.REDIS_URL || 'redis://localhost:6379');
class RateLimiter {
    constructor(options) {
        this.middleware = async (req, res, next) => {
            try {
                const key = this.keyGenerator(req);
                const current = await redis.incr(key);
                if (current === 1) {
                    await redis.expire(key, Math.ceil(this.windowMs / 1000));
                }
                const ttl = await redis.ttl(key);
                const resetTime = new Date(Date.now() + ttl * 1000);
                // Set rate limit headers
                res.set({
                    'X-RateLimit-Limit': this.maxRequests.toString(),
                    'X-RateLimit-Remaining': Math.max(0, this.maxRequests - current).toString(),
                    'X-RateLimit-Reset': resetTime.toISOString(),
                    'X-RateLimit-Window': this.windowMs.toString()
                });
                if (current > this.maxRequests) {
                    res.status(429).json({
                        error: {
                            message: 'Too many requests',
                            statusCode: 429,
                            retryAfter: ttl
                        },
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
                // Store original end function to track response status
                const originalEnd = res.end;
                const self = this;
                // Use a response listener instead of overriding res.end
                res.on('finish', function () {
                    const statusCode = res.statusCode;
                    // Decrement counter for successful requests if configured
                    if (self.skipSuccessfulRequests && statusCode < 400) {
                        redis.decr(key).catch(console.error);
                    }
                    // Decrement counter for failed requests if configured
                    if (self.skipFailedRequests && statusCode >= 400) {
                        redis.decr(key).catch(console.error);
                    }
                });
                next();
            }
            catch (error) {
                console.error('Rate limiter error:', error);
                // If Redis is down, allow the request to proceed
                next();
            }
        };
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
        this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
        this.skipFailedRequests = options.skipFailedRequests || false;
    }
    defaultKeyGenerator(req) {
        return `rate_limit:${req.ip}:${req.path}`;
    }
}
// Create default rate limiter instance
exports.rateLimiter = new RateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    keyGenerator: (req) => `rate_limit:${req.ip}`,
});
// Create stricter rate limiter for auth endpoints
exports.authRateLimiter = new RateLimiter({
    windowMs: 300000, // 5 minutes
    maxRequests: 10, // 10 attempts per 5 minutes
    keyGenerator: (req) => `auth_rate_limit:${req.ip}`,
});
// Create rate limiter for SMS endpoints
exports.smsRateLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 50, // 50 SMS per minute
    keyGenerator: (req) => `sms_rate_limit:${req.ip}`,
});
exports.default = exports.rateLimiter.middleware;
//# sourceMappingURL=rateLimiter.js.map