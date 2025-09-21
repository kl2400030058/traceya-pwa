// Simple rate limiting implementation
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: RateLimitOptions = { limit: 10, windowMs: 60000 }) {
  return async function rateLimitMiddleware(req: NextRequest) {
    // Use headers to get IP or fallback to a default value
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const now = Date.now();
    
    const record = ipRequestMap.get(ip) || { count: 0, resetTime: now + options.windowMs };
    
    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + options.windowMs;
    } else {
      record.count += 1;
    }
    
    ipRequestMap.set(ip, record);
    
    const remaining = Math.max(0, options.limit - record.count);
    const reset = Math.ceil((record.resetTime - now) / 1000);
    
    // Set rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', options.limit.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', reset.toString());
    
    // If rate limit exceeded
    if (record.count > options.limit) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { status: 429, headers }
      );
    }
    
    return null;
  };
}