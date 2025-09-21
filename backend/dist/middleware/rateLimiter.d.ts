import type { Request, Response, NextFunction } from 'express';
interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
declare class RateLimiter {
    private windowMs;
    private maxRequests;
    private keyGenerator;
    private skipSuccessfulRequests;
    private skipFailedRequests;
    constructor(options: RateLimitOptions);
    private defaultKeyGenerator;
    middleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const rateLimiter: RateLimiter;
export declare const authRateLimiter: RateLimiter;
export declare const smsRateLimiter: RateLimiter;
declare const _default: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default _default;
//# sourceMappingURL=rateLimiter.d.ts.map