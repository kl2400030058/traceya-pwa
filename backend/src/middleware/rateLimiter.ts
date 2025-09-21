import type { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: Request) => string;
  private skipSuccessfulRequests: boolean;
  private skipFailedRequests: boolean;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
  }

  private defaultKeyGenerator(req: Request): string {
    return `rate_limit:${req.ip}:${req.path}`;
  }

  middleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      res.on('finish', function() {
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
    } catch (error) {
      console.error('Rate limiter error:', error);
      // If Redis is down, allow the request to proceed
      next();
    }
  }
}

// Create default rate limiter instance
export const rateLimiter = new RateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  keyGenerator: (req: Request) => `rate_limit:${req.ip}`,
});

// Create stricter rate limiter for auth endpoints
export const authRateLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 10, // 10 attempts per 5 minutes
  keyGenerator: (req: Request) => `auth_rate_limit:${req.ip}`,
});

// Create rate limiter for SMS endpoints
export const smsRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 50, // 50 SMS per minute
  keyGenerator: (req: Request) => `sms_rate_limit:${req.ip}`,
});

export default rateLimiter.middleware;