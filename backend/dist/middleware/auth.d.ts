import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    farmer?: {
        id: string;
        phone: string;
        name?: string;
    };
}
export interface JwtPayload {
    farmerId: string;
    phone: string;
    iat?: number;
    exp?: number;
}
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const generateToken: (farmerId: string, phone: string) => string;
export declare const verifyToken: (token: string) => JwtPayload;
//# sourceMappingURL=auth.d.ts.map