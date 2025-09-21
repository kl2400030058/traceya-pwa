import express, { Router, Request, Response } from 'express';
import * as Joi from 'joi';
import { prisma } from '../index';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { queueFabricSync } from '../services/fabricService';
import { validateGeofence, validateSeason } from '../services/validationService';

const router = Router();

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
router.post('/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate request body
    const { error, value } = createCollectionSchema.validate(req.body);
    if (error) {
      throw new CustomError(error?.details?.[0]?.message || 'Invalid request', 400);
    }

    const {
      species,
      latitude,
      longitude,
      accuracy,
      altitude,
      timestamp,
      moisturePct,
      notes,
      photoHash,
      photoUrl,
      deviceInfo,
      appVersion
    } = value;

    const farmerId = req.farmer!.id;

    // Validate geofence (stub implementation)
    const isValidLocation = await validateGeofence(latitude, longitude, species);
    
    // Validate seasonal rules (stub implementation)
    const isValidSeason = await validateSeason(species, new Date(timestamp));

    // Create collection event
    const collectionEvent = await prisma.collectionEvent.create({
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
      await queueFabricSync(collectionEvent.id);
    } catch (error) {
      console.error('Failed to queue Fabric sync:', error);
      // Don't fail the request if queueing fails
    }

    // Log the creation
    await prisma.auditLog.create({
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
  })
);

/**
 * GET /api/collection/:id
 * Get collection event by ID
 */
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const farmerId = req.farmer!.id;

    const collectionEvent = await prisma.collectionEvent.findFirst({
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
      throw new CustomError('Collection event not found', 404);
    }

    res.json({
      success: true,
      data: collectionEvent
    });
  })
);

/**
 * GET /api/collection
 * List collection events for authenticated farmer
 */
router.get('/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate query parameters
    const { error, value } = queryCollectionSchema.validate(req.query);
    if (error) {
      throw new CustomError(error?.details?.[0]?.message || 'Invalid request', 400);
    }

    const {
      page,
      limit,
      status,
      species,
      startDate,
      endDate,
      sortBy,
      sortOrder
    } = value;

    const farmerId = req.farmer!.id;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { farmerId };
    
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
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count
    const totalCount = await prisma.collectionEvent.count({ where });

    // Get events
    const events = await prisma.collectionEvent.findMany({
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
  })
);

/**
 * GET /api/collection/stats
 * Get collection statistics for authenticated farmer
 */
router.get('/stats/summary',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const farmerId = req.farmer!.id;

    // Get status counts
    const statusCounts = await prisma.collectionEvent.groupBy({
      by: ['status'],
      where: { farmerId },
      _count: {
        id: true
      }
    });

    // Get species counts
    const speciesCounts = await prisma.collectionEvent.groupBy({
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
    const recentActivity = await prisma.collectionEvent.count({
      where: {
        farmerId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get total synced events
    const syncedCount = await prisma.collectionEvent.count({
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
        }, {} as Record<string, number>),
        speciesCounts: speciesCounts.map(item => ({
          species: item.species,
          count: item._count.id
        })),
        recentActivity,
        syncedCount,
        totalEvents: statusCounts.reduce((sum, item) => sum + item._count.id, 0)
      }
    });
  })
);

export default router;