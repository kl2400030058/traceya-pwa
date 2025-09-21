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
const express_1 = require("express");
const Joi = __importStar(require("joi"));
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const fabricService_1 = require("../services/fabricService");
const validationService_1 = require("../services/validationService");
const router = (0, express_1.Router)();
// SMS message format validation schema
const smsWebhookSchema = Joi.object({
    from: Joi.string().required(), // Phone number
    message: Joi.string().required(), // SMS content
    timestamp: Joi.date().iso().optional(),
    gateway_id: Joi.string().optional(),
    message_id: Joi.string().optional()
});
// SMS collection message format:
// COLLECT|farmerId|species|lat,long|timestamp|moisture|photoHash
const SMS_COMMAND_REGEX = /^COLLECT\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|([^|]*)$/i;
/**
 * Parse SMS collection message
 * Expected format: COLLECT|farmerId|species|lat,long|timestamp|moisture|photoHash
 */
function parseSmsCollectionMessage(message) {
    const match = message.trim().match(SMS_COMMAND_REGEX);
    if (!match) {
        throw new errorHandler_1.CustomError('Invalid SMS format. Expected: COLLECT|farmerId|species|lat,long|timestamp|moisture|photoHash', 400);
    }
    const [, farmerId, species, coordinates, timestamp, moisture, photoHash] = match;
    // Parse coordinates
    const coordMatch = coordinates?.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/);
    if (!coordMatch) {
        throw new errorHandler_1.CustomError('Invalid coordinates format. Expected: lat,long', 400);
    }
    const latitude = parseFloat(coordMatch?.[1] || '0');
    const longitude = parseFloat(coordMatch?.[2] || '0');
    // Validate coordinates range
    if (latitude < -90 || latitude > 90) {
        throw new errorHandler_1.CustomError('Invalid latitude. Must be between -90 and 90', 400);
    }
    if (longitude < -180 || longitude > 180) {
        throw new errorHandler_1.CustomError('Invalid longitude. Must be between -180 and 180', 400);
    }
    // Parse timestamp
    let parsedTimestamp;
    try {
        // Try ISO format first
        parsedTimestamp = new Date(timestamp || '');
        if (isNaN(parsedTimestamp.getTime())) {
            // Try Unix timestamp
            const unixTimestamp = parseInt(timestamp || '0');
            if (!isNaN(unixTimestamp)) {
                parsedTimestamp = new Date(unixTimestamp * 1000);
            }
            else {
                throw new Error('Invalid timestamp');
            }
        }
    }
    catch (error) {
        throw new errorHandler_1.CustomError('Invalid timestamp format. Use ISO string or Unix timestamp', 400);
    }
    // Parse moisture (optional)
    let moisturePct;
    if (moisture && moisture.trim()) {
        moisturePct = parseFloat(moisture);
        if (isNaN(moisturePct) || moisturePct < 0 || moisturePct > 100) {
            throw new errorHandler_1.CustomError('Invalid moisture percentage. Must be between 0 and 100', 400);
        }
    }
    return {
        farmerId: farmerId ? farmerId.trim() : '',
        species: species ? species.trim() : '',
        latitude,
        longitude,
        timestamp: parsedTimestamp,
        moisturePct,
        photoHash: photoHash?.trim() || undefined
    };
}
/**
 * Normalize phone number for farmer lookup
 */
function normalizePhoneNumber(phone) {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');
    // Add country code if missing (assuming India +91)
    if (normalized.length === 10) {
        normalized = '91' + normalized;
    }
    return '+' + normalized;
}
/**
 * POST /api/sms/webhook
 * Handle incoming SMS from gateway
 */
router.post('/webhook', rateLimiter_1.smsRateLimiter.middleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate webhook payload
    const validationResult = smsWebhookSchema.validate(req.body);
    if (validationResult.error) {
        throw new errorHandler_1.CustomError(validationResult.error?.details?.[0]?.message || 'Invalid request', 400);
    }
    const value = validationResult.value;
    const { from, message, timestamp, gateway_id, message_id } = value;
    const normalizedPhone = normalizePhoneNumber(from);
    console.log(`📱 Received SMS from ${normalizedPhone}: ${message}`);
    // Check if message is a collection command
    if (!message.toUpperCase().startsWith('COLLECT|')) {
        // Not a collection command, ignore
        res.json({
            success: true,
            message: 'SMS received but not a collection command',
            action: 'ignored'
        });
        return;
    }
    try {
        // Parse the SMS collection message
        const collectionData = parseSmsCollectionMessage(message);
        // Find or create farmer by phone number
        let farmer = await index_1.prisma.farmer.findUnique({
            where: { phone: normalizedPhone }
        });
        if (!farmer) {
            // Create new farmer if not exists
            farmer = await index_1.prisma.farmer.create({
                data: {
                    phone: normalizedPhone
                }
            });
            console.log(`👤 Created new farmer: ${farmer.id} (${normalizedPhone})`);
        }
        // Validate the collection event
        const validation = await (0, validationService_1.validateCollectionEvent)({
            species: collectionData.species,
            latitude: collectionData.latitude,
            longitude: collectionData.longitude,
            timestamp: collectionData.timestamp,
            moisturePct: collectionData.moisturePct,
            accuracy: undefined
        });
        // Create collection event
        const collectionEvent = await index_1.prisma.collectionEvent.create({
            data: {
                farmerId: farmer.id,
                species: collectionData.species,
                latitude: collectionData.latitude,
                longitude: collectionData.longitude,
                timestamp: collectionData.timestamp,
                moisturePct: collectionData.moisturePct || null,
                photoHash: collectionData.photoHash || null,
                isValidLocation: validation.isValidLocation,
                isValidSeason: validation.isValidSeason,
                qualityScore: validation.qualityScore,
                source: 'SMS',
                deviceInfo: `SMS Gateway: ${gateway_id || 'unknown'}`,
                // Store SMS metadata
                notes: `SMS ID: ${message_id || 'unknown'}, Original: ${message}`
            }
        });
        // Queue for Fabric anchoring
        try {
            await (0, fabricService_1.queueFabricSync)(collectionEvent.id);
        }
        catch (error) {
            console.error('Failed to queue Fabric sync for SMS event:', error);
            // Don't fail the request if queueing fails
        }
        // Log the SMS collection event
        await index_1.prisma.auditLog.create({
            data: {
                action: 'SMS_COLLECT',
                entityType: 'EVENT',
                entityId: collectionEvent.id,
                farmerId: farmer.id,
                metadata: {
                    smsFrom: normalizedPhone,
                    smsMessage: message,
                    gatewayId: gateway_id,
                    messageId: message_id,
                    validation: {
                        isValidLocation: validation.isValidLocation,
                        isValidSeason: validation.isValidSeason,
                        qualityScore: validation.qualityScore,
                        warnings: validation.warnings
                    }
                },
                ipAddress: req.ip || null,
                userAgent: req.get('User-Agent') || null
            }
        });
        console.log(`✅ Created collection event ${collectionEvent.id} from SMS`);
        // Prepare response
        const response = {
            success: true,
            message: 'Collection event created successfully',
            data: {
                eventId: collectionEvent.id,
                farmerId: farmer.id,
                status: collectionEvent.status,
                validation: {
                    isValidLocation: validation.isValidLocation,
                    isValidSeason: validation.isValidSeason,
                    qualityScore: validation.qualityScore,
                    warnings: validation.warnings
                }
            }
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error processing SMS collection:', error);
        // Log the failed SMS attempt
        await index_1.prisma.auditLog.create({
            data: {
                action: 'SMS_COLLECT_FAILED',
                entityType: 'SMS',
                entityId: message_id || 'unknown',
                metadata: {
                    smsFrom: normalizedPhone,
                    smsMessage: message,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    gatewayId: gateway_id,
                    messageId: message_id
                },
                ipAddress: req.ip || null,
                userAgent: req.get('User-Agent') || null
            }
        }).catch(console.error);
        throw error;
    }
}));
/**
 * GET /api/sms/format
 * Get SMS format documentation
 */
router.get('/format', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        format: {
            command: 'COLLECT',
            structure: 'COLLECT|farmerId|species|lat,long|timestamp|moisture|photoHash',
            description: 'Send collection data via SMS',
            parameters: {
                farmerId: 'Farmer identifier (optional, will use phone number if not provided)',
                species: 'Name of the herb/plant species',
                coordinates: 'GPS coordinates in format: latitude,longitude',
                timestamp: 'Collection time (ISO string or Unix timestamp)',
                moisture: 'Moisture percentage (0-100, optional)',
                photoHash: 'Hash of uploaded photo (optional)'
            },
            examples: [
                'COLLECT|farmer123|Ashwagandha|26.9124,75.7873|2024-01-15T10:30:00Z|12.5|abc123hash',
                'COLLECT||Turmeric|11.0168,76.9558|1705312200|15.2|',
                'COLLECT|farmer456|Brahmi|19.0760,72.8777|2024-01-15T14:45:00Z||def456hash'
            ]
        }
    });
}));
/**
 * POST /api/sms/test
 * Test SMS parsing (development only)
 */
if (process.env.NODE_ENV === 'development') {
    router.post('/test', (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { message } = req.body;
        if (!message) {
            throw new errorHandler_1.CustomError('Message is required', 400);
        }
        try {
            const parsed = parseSmsCollectionMessage(message);
            const validation = await (0, validationService_1.validateCollectionEvent)({
                species: parsed.species,
                latitude: parsed.latitude,
                longitude: parsed.longitude,
                timestamp: parsed.timestamp,
                moisturePct: parsed.moisturePct
            });
            res.json({
                success: true,
                parsed,
                validation
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }));
}
exports.default = router;
//# sourceMappingURL=sms.js.map