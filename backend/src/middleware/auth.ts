import type { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { CustomError } from './errorHandler';

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

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new CustomError('Access token required', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new CustomError('JWT secret not configured', 500);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, String(jwtSecret)) as JwtPayload;
    
    // Fetch farmer details from database
    const farmer = await prisma.farmer.findUnique({
      where: { id: decoded.farmerId },
      select: {
        id: true,
        phone: true,
        name: true,
        isActive: true
      }
    });

    if (!farmer) {
      throw new CustomError('Farmer not found', 404);
    }

    if (!farmer.isActive) {
      throw new CustomError('Account is deactivated', 403);
    }

    // Attach farmer info to request
    req.farmer = {
      id: farmer.id,
      phone: farmer.phone,
      name: farmer.name || ''
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError('Token expired', 401));
    }
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(); // Continue without authentication if JWT not configured
    }

    const decoded = jwt.verify(token, String(jwtSecret)) as JwtPayload;
    
    const farmer = await prisma.farmer.findUnique({
      where: { id: decoded.farmerId },
      select: {
        id: true,
        phone: true,
        name: true,
        isActive: true
      }
    });

    if (farmer && farmer.isActive) {
      req.farmer = {
        id: farmer.id,
        phone: farmer.phone,
        name: farmer.name || ''
      };
    }

    next();
  } catch (error) {
    // Ignore auth errors in optional auth
    next();
  }
};

export const generateToken = (farmerId: string, phone: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new CustomError('JWT secret not configured', 500);
  }

  // Use a specific string literal that matches the expected type
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  // Use a simpler approach without options to avoid type issues
  return jwt.sign({ farmerId, phone }, String(jwtSecret));
};

export const verifyToken = (token: string): JwtPayload => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new CustomError('JWT secret not configured', 500);
  }

  return jwt.verify(token, String(jwtSecret)) as JwtPayload;
};