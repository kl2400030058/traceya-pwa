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
const auth_1 = require("../middleware/auth");
const fabricService_1 = require("../services/fabricService");
const validationService_1 = require("../services/validationService");
const router = (0, express_1.Router)();
// Validation schemas
const createCollectionSchema = Joi.object({
    species: Joi.string().min(2).max(100).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    accuracy: Joi.number().min(0).optional(),
    altitude: Joi.number().optional(),
    timestamp: Joi.date().iso().required(),
    moisturePct: Joi.number().min(0).max(100).optional(),
    notes: Joi.string().max(1000).optional(),
    photoHash: Joi.string().optional(),
    photoUrl: Joi.string().uri().optional(),
    deviceInfo: Joi.string().max(500).optional(),
    appVersion: Joi.string().max(50).optional()
});
const queryCollectionSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('PENDING', 'UPLOADING', 'SYNCED', 'FAILED', 'CANCELLED').optional(),
    species: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    sortBy: Joi.string().valid('timestamp', 'createdAt', 'species', 'status').default('timestamp'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});
/**
 * POST /api/collection
 * Create a new collection event
 */
router.post('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate request body
    const { error, value } = createCollectionSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.CustomError(error?.details?.[0]?.message || 'Invalid request', 400);
    }
    const { species, latitude, longitude, accuracy, altitude, timestamp, moisturePct, notes, photoHash, photoUrl, deviceInfo, appVersion } = value;
    const farmerId = req.farmer.id;
    // Validate geofence (stub implementation)
    const isValidLocation = await (0, validationService_1.validateGeofence)(latitude, longitude, species);
    // Validate seasonal rules (stub implementation)
    const isValidSeason = await (0, validationService_1.validateSeason)(species, new Date(timestamp));
    // Create collection event
    const collectionEvent = await index_1.prisma.collectionEvent.create({
        data: {
            farmerId,
            species,
            latitude,
            longitude,
            accuracy: accuracy || null,
            altitude: altitude || null,
            timestamp: new Date(timestamp),
            moisturePct: moisturePct || null,
            notes: notes || null,
            photoHash: photoHash || null,
            photoUrl: photoUrl || null,
            isValidLocation,
            isValidSeason,
            deviceInfo: deviceInfo || null,
            appVersion: appVersion || null,
            source: 'PWA'
        },
        include: {
            farmer: {
                select: {
                    id: true,
                    phone: true,
                    name: true
                }
            }
        }
    });
    // Queue for Fabric anchoring
    try {
        await (0, fabricService_1.queueFabricSync)(collectionEvent.id);
    }
    catch (error) {
        console.error('Failed to queue Fabric sync:', error);
        // Don't fail the request if queueing fails
    }
    // Log the creation
    await index_1.prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entityType: 'EVENT',
            entityId: collectionEvent.id,
            farmerId,
            metadata: {
                species,
                location: { latitude, longitude },
                isValidLocation,
                isValidSeason
            },
            ipAddress: req.ip || null,
            userAgent: req.get('User-Agent') || null
        }
    });
    res.status(201).json({
        success: true,
        message: 'Collection event created successfully',
        data: {
            eventId: collectionEvent.id,
            status: collectionEvent.status,
            txId: collectionEvent.txId,
            isValidLocation,
            isValidSeason,
            createdAt: collectionEvent.createdAt
        }
    });
}));
/**
 * GET /api/collection/:id
 * Get collection event by ID
 */
router.get('/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const farmerId = req.farmer.id;
    const collectionEvent = await index_1.prisma.collectionEvent.findFirst({
        where: {
            id: id || '',
            farmerId // Ensure farmer can only access their own events
        },
        include: {
            farmer: {
                select: {
                    id: true,
                    phone: true,
                    name: true
                }
            }
        }
    });
    if (!collectionEvent) {
        throw new errorHandler_1.CustomError('Collection event not found', 404);
    }
    res.json({
        success: true,
        data: collectionEvent
    });
}));
/**
 * GET /api/collection
 * List collection events for authenticated farmer
 */
router.get('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate query parameters
    const { error, value } = queryCollectionSchema.validate(req.query);
    if (error) {
        throw new errorHandler_1.CustomError(error?.details?.[0]?.message || 'Invalid request', 400);
    }
    const { page, limit, status, species, startDate, endDate, sortBy, sortOrder } = value;
    const farmerId = req.farmer.id;
    const skip = (page - 1) * limit;
    // Build where clause
    const where = { farmerId };
    if (status) {
        where.status = status;
    }
    if (species) {
        where.species = {
            contains: species,
            mode: 'insensitive'
        };
    }
    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
            where.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
            where.timestamp.lte = new Date(endDate);
        }
    }
    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    // Get total count
    const totalCount = await index_1.prisma.collectionEvent.count({ where });
    // Get events
    const events = await index_1.prisma.collectionEvent.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
            id: true,
            species: true,
            latitude: true,
            longitude: true,
            accuracy: true,
            timestamp: true,
            moisturePct: true,
            notes: true,
            photoHash: true,
            photoUrl: true,
            status: true,
            txId: true,
            blockHash: true,
            isValidLocation: true,
            isValidSeason: true,
            qualityScore: true,
            source: true,
            createdAt: true,
            updatedAt: true,
            syncedAt: true,
            retryCount: true,
            lastError: true
        }
    });
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    res.json({
        success: true,
        data: events,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage,
            hasPrevPage
        },
        filters: {
            status,
            species,
            startDate,
            endDate,
            sortBy,
            sortOrder
        }
    });
}));
/**
 * GET /api/collection/stats
 * Get collection statistics for authenticated farmer
 */
router.get('/stats/summary', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const farmerId = req.farmer.id;
    // Get status counts
    const statusCounts = await index_1.prisma.collectionEvent.groupBy({
        by: ['status'],
        where: { farmerId },
        _count: {
            id: true
        }
    });
    // Get species counts
    const speciesCounts = await index_1.prisma.collectionEvent.groupBy({
        by: ['species'],
        where: { farmerId },
        _count: {
            id: true
        },
        orderBy: {
            _count: {
                id: 'desc'
            }
        },
        take: 10 // Top 10 species
    });
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = await index_1.prisma.collectionEvent.count({
        where: {
            farmerId,
            createdAt: {
                gte: thirtyDaysAgo
            }
        }
    });
    // Get total synced events
    const syncedCount = await index_1.prisma.collectionEvent.count({
        where: {
            farmerId,
            status: 'SYNCED'
        }
    });
    res.json({
        success: true,
        data: {
            statusCounts: statusCounts.reduce((acc, item) => {
                acc[item.status] = item._count.id;
                return acc;
            }, {}),
            speciesCounts: speciesCounts.map(item => ({
                species: item.species,
                count: item._count.id
            })),
            recentActivity,
            syncedCount,
            totalEvents: statusCounts.reduce((sum, item) => sum + item._count.id, 0)
        }
    });
}));
exports.default = router;
//# sourceMappingURL=collection.js.map