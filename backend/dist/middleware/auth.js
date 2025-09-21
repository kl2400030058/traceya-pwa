"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.optionalAuth = exports.authenticateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const index_1 = require("../index");
const errorHandler_1 = require("./errorHandler");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            throw new errorHandler_1.CustomError('Access token required', 401);
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new errorHandler_1.CustomError('JWT secret not configured', 500);
        }
        // Verify JWT token
        const decoded = jwt.verify(token, String(jwtSecret));
        // Fetch farmer details from database
        const farmer = await index_1.prisma.farmer.findUnique({
            where: { id: decoded.farmerId },
            select: {
                id: true,
                phone: true,
                name: true,
                isActive: true
            }
        });
        if (!farmer) {
            throw new errorHandler_1.CustomError('Farmer not found', 404);
        }
        if (!farmer.isActive) {
            throw new errorHandler_1.CustomError('Account is deactivated', 403);
        }
        // Attach farmer info to request
        req.farmer = {
            id: farmer.id,
            phone: farmer.phone,
            name: farmer.name || ''
        };
        next();
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new errorHandler_1.CustomError('Invalid token', 401));
        }
        if (error instanceof jwt.TokenExpiredError) {
            return next(new errorHandler_1.CustomError('Token expired', 401));
        }
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
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
        const decoded = jwt.verify(token, String(jwtSecret));
        const farmer = await index_1.prisma.farmer.findUnique({
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
    }
    catch (error) {
        // Ignore auth errors in optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
const generateToken = (farmerId, phone) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new errorHandler_1.CustomError('JWT secret not configured', 500);
    }
    // Use a specific string literal that matches the expected type
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    // Use a simpler approach without options to avoid type issues
    return jwt.sign({ farmerId, phone }, String(jwtSecret));
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new errorHandler_1.CustomError('JWT secret not configured', 500);
    }
    return jwt.verify(token, String(jwtSecret));
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.js.map