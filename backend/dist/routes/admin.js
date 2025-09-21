"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const fabricService_1 = require("../services/fabricService");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/stats
 * Get system statistics (counts of events by status)
 */
router.get('/stats', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Get counts of collection events by status
    const statusCounts = await index_1.prisma.collectionEvent.groupBy({
        by: ['status'],
        _count: {
            status: true
        }
    });
    // Format the results
    const stats = {
        total: 0,
        pending: 0,
        uploading: 0,
        synced: 0,
        failed: 0
    };
    // Map the results to the stats object
    statusCounts.forEach(count => {
        const statusKey = count.status.toLowerCase();
        if (statusKey === 'pending' || statusKey === 'uploading' || statusKey === 'synced' || statusKey === 'failed') {
            stats[statusKey] = count._count.status;
        }
        stats.total += count._count.status;
    });
    // Get counts of farmers
    const farmerCount = await index_1.prisma.farmer.count();
    // Get counts of sync jobs by status
    const syncJobCounts = await index_1.prisma.syncJob.groupBy({
        by: ['status'],
        _count: {
            status: true
        }
    });
    // Format the sync job results
    const syncStats = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
    };
    // Map the results to the syncStats object
    syncJobCounts.forEach(count => {
        const statusKey = count.status.toLowerCase();
        if (statusKey === 'pending' || statusKey === 'processing' || statusKey === 'completed' || statusKey === 'failed') {
            syncStats[statusKey] = count._count.status;
        }
        syncStats.total += count._count.status;
    });
    // Return the stats
    res.json({
        success: true,
        stats: {
            events: stats,
            farmers: {
                total: farmerCount
            },
            syncJobs: syncStats
        }
    });
}));
/**
 * POST /api/admin/retry-failed
 * Retry failed collection events
 */
router.post('/retry-failed', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Find all failed collection events
    const failedEvents = await index_1.prisma.collectionEvent.findMany({
        where: {
            status: 'FAILED'
        },
        select: {
            id: true
        }
    });
    if (failedEvents.length === 0) {
        res.json({
            success: true,
            message: 'No failed events to retry',
            count: 0
        });
    }
    // Update status to pending
    await index_1.prisma.collectionEvent.updateMany({
        where: {
            status: 'FAILED'
        },
        data: {
            status: 'PENDING',
            lastError: null
        }
    });
    // Queue each event for retry
    const queuePromises = failedEvents.map(event => (0, fabricService_1.queueFabricSync)(event.id)
        .catch(error => {
        console.error(`Failed to queue event ${event.id} for retry:`, error);
        return null;
    }));
    // Wait for all queue operations to complete
    const queueResults = await Promise.allSettled(queuePromises);
    const successCount = queueResults.filter(result => result.status === 'fulfilled' && result.value).length;
    // Log the retry attempt
    await index_1.prisma.auditLog.create({
        data: {
            action: 'RETRY_FAILED_EVENTS',
            entityType: 'ADMIN',
            entityId: req.farmer?.id || 'system',
            metadata: {
                totalEvents: failedEvents.length,
                successfullyQueued: successCount,
                initiatedBy: req.farmer?.id || 'system'
            },
            ipAddress: req.ip || null,
            userAgent: req.get('User-Agent') || null
        }
    });
    res.json({
        success: true,
        message: `Queued ${successCount} of ${failedEvents.length} failed events for retry`,
        count: successCount
    });
}));
/**
 * GET /api/admin/farmers
 * List all farmers
 */
router.get('/farmers', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    // Get search parameter
    const search = req.query.search;
    // Build the where clause
    const where = search ? {
        OR: [
            { id: { contains: search } },
            { phone: { contains: search } }
        ]
    } : {};
    // Get farmers with counts of their events
    const farmers = await index_1.prisma.farmer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            _count: {
                select: {
                    events: true
                }
            }
        }
    });
    // Get total count for pagination
    const total = await index_1.prisma.farmer.count({ where });
    res.json({
        success: true,
        data: farmers.map(farmer => ({
            id: farmer.id,
            phone: farmer.phone,
            createdAt: farmer.createdAt,
            eventCount: farmer._count.events
        })),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}));
/**
 * GET /api/admin/farmers/:id
 * Get farmer details with their events
 */
router.get('/farmers/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id || '';
    // Get farmer with their events
    const farmer = await index_1.prisma.farmer.findUnique({
        where: { id },
        include: {
            events: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 50 // Limit to most recent 50 events
            }
        }
    });
    if (!farmer) {
        throw new errorHandler_1.CustomError('Farmer not found', 404);
    }
    // Get event counts by status
    const statusCounts = await index_1.prisma.collectionEvent.groupBy({
        by: ['status'],
        where: {
            farmerId: id || ''
        },
        _count: {
            status: true
        }
    });
    // Format the status counts
    const eventStats = {
        total: 0,
        pending: 0,
        uploading: 0,
        synced: 0,
        failed: 0
    };
    statusCounts.forEach(count => {
        if (count.status && count._count) {
            const status = count.status.toLowerCase();
            // Check if status is one of our known keys
            if (status === 'pending' || status === 'uploading' || status === 'synced' || status === 'failed') {
                // Use type assertion to safely access the property
                eventStats[status] = count._count && typeof count._count === 'object' ? (count._count.status || 0) : 0;
            }
            // Add to total regardless of status
            eventStats.total += count._count && typeof count._count === 'object' ? (count._count.status || 0) : 0;
        }
    });
    res.json({
        success: true,
        data: {
            id: farmer.id,
            phone: farmer.phone,
            createdAt: farmer.createdAt,
            stats: eventStats,
            events: [] // Farmer events will be fetched separately if needed
        }
    });
}));
exports.default = router;
//# sourceMappingURL=admin.js.map