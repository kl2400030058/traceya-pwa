"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Validation schemas
const requestOtpSchema = joi_1.default.object({
    phone: joi_1.default.string()
        .pattern(/^[+]?[1-9]\d{1,14}$/)
        .required()
        .messages({
        'string.pattern.base': 'Invalid phone number format',
        'any.required': 'Phone number is required'
    })
});
const verifyOtpSchema = joi_1.default.object({
    phone: joi_1.default.string()
        .pattern(/^[+]?[1-9]\d{1,14}$/)
        .required(),
    otp: joi_1.default.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .required()
        .messages({
        'string.length': 'OTP must be 6 digits',
        'string.pattern.base': 'OTP must contain only numbers'
    })
});
// Helper function to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
// Helper function to normalize phone number
const normalizePhone = (phone) => {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');
    // Add country code if missing (assuming India +91)
    if (normalized.length === 10) {
        normalized = '91' + normalized;
    }
    return '+' + normalized;
};
// Mock SMS service (replace with actual SMS gateway integration)
const sendSMS = async (phone, message) => {
    console.log(`📱 SMS to ${phone}: ${message}`);
    // In development, always return success
    if (process.env.NODE_ENV === 'development') {
        return true;
    }
    // TODO: Integrate with actual SMS gateway
    // Example: Twilio, AWS SNS, or local SMS provider
    try {
        // const response = await smsGateway.send(phone, message);
        // return response.success;
        return true;
    }
    catch (error) {
        console.error('SMS sending failed:', error);
        return false;
    }
};
/**
 * POST /api/auth/request-otp
 * Request OTP for phone number
 */
router.post('/request-otp', rateLimiter_1.authRateLimiter.middleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate request body
    const { error, value } = requestOtpSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.CustomError(error?.details?.[0]?.message || 'Invalid request', 400);
    }
    const { phone } = value;
    const normalizedPhone = normalizePhone(phone);
    // Check for recent OTP requests (prevent spam)
    const recentOtp = await index_1.prisma.otpRequest.findFirst({
        where: {
            phone: normalizedPhone,
            createdAt: {
                gte: new Date(Date.now() - 60000) // Last 1 minute
            }
        }
    });
    if (recentOtp) {
        throw new errorHandler_1.CustomError('Please wait before requesting another OTP', 429);
    }
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    // Store OTP request
    await index_1.prisma.otpRequest.create({
        data: {
            phone: normalizedPhone,
            otp,
            expiresAt,
            ipAddress: req.ip || null,
            userAgent: req.get('User-Agent') || null
        }
    });
    // Send SMS
    const message = `Your Traceya verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    const smsSent = await sendSMS(normalizedPhone, message);
    if (!smsSent) {
        throw new errorHandler_1.CustomError('Failed to send OTP. Please try again.', 500);
    }
    res.json({
        success: true,
        message: 'OTP sent successfully',
        phone: normalizedPhone,
        expiresIn: 600 // 10 minutes in seconds
    });
}));
/**
 * POST /api/auth/verify-otp
 * Verify OTP and issue JWT token
 */
router.post('/verify-otp', rateLimiter_1.authRateLimiter.middleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate request body
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.CustomError(error?.details?.[0]?.message || 'Invalid request', 400);
    }
    const { phone, otp } = value;
    const normalizedPhone = normalizePhone(phone);
    // Find valid OTP request
    const otpRequest = await index_1.prisma.otpRequest.findFirst({
        where: {
            phone: normalizedPhone,
            otp,
            isUsed: false,
            expiresAt: {
                gt: new Date()
            }
        }
    });
    if (!otpRequest) {
        throw new errorHandler_1.CustomError('Invalid or expired OTP', 400);
    }
    // Mark OTP as used
    await index_1.prisma.otpRequest.update({
        where: { id: otpRequest.id },
        data: {
            isUsed: true,
            usedAt: new Date()
        }
    });
    // Find or create farmer
    let farmer = await index_1.prisma.farmer.findUnique({
        where: { phone: normalizedPhone }
    });
    if (!farmer) {
        farmer = await index_1.prisma.farmer.create({
            data: {
                phone: normalizedPhone
            }
        });
    }
    // Generate JWT token
    const token = (0, auth_1.generateToken)(farmer.id, farmer.phone);
    // Log successful authentication
    await index_1.prisma.auditLog.create({
        data: {
            action: 'LOGIN',
            entityType: 'FARMER',
            entityId: farmer.id,
            farmerId: farmer.id,
            metadata: {
                phone: normalizedPhone,
                loginMethod: 'OTP'
            },
            ipAddress: req.ip || null,
            userAgent: req.get('User-Agent') || null
        }
    });
    res.json({
        success: true,
        message: 'Authentication successful',
        token,
        farmer: {
            id: farmer.id,
            phone: farmer.phone,
            name: farmer.name,
            isActive: farmer.isActive,
            createdAt: farmer.createdAt
        }
    });
}));
/**
 * POST /api/auth/refresh
 * Refresh JWT token (optional endpoint)
 */
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        throw new errorHandler_1.CustomError('Refresh token required', 400);
    }
    // For now, we'll just validate the existing token and issue a new one
    // In production, you might want to implement proper refresh token logic
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new errorHandler_1.CustomError('JWT secret not configured', 500);
        }
        const decoded = require('jsonwebtoken').verify(token, jwtSecret);
        const farmer = await index_1.prisma.farmer.findUnique({
            where: { id: decoded.farmerId }
        });
        if (!farmer || !farmer.isActive) {
            throw new errorHandler_1.CustomError('Invalid farmer or account deactivated', 401);
        }
        const newToken = (0, auth_1.generateToken)(farmer.id, farmer.phone);
        res.json({
            success: true,
            token: newToken,
            farmer: {
                id: farmer.id,
                phone: farmer.phone,
                name: farmer.name,
                isActive: farmer.isActive
            }
        });
    }
    catch (error) {
        throw new errorHandler_1.CustomError('Invalid or expired token', 401);
    }
}));
exports.default = router;
//# sourceMappingURL=auth.js.map