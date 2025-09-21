"use strict";
/**
 * Hyperledger Fabric integration service
 * Contains mock implementations that can be replaced with actual Fabric SDK calls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fabricSyncQueue = void 0;
exports.initializeFabric = initializeFabric;
exports.queueFabricSync = queueFabricSync;
exports.processFabricSync = processFabricSync;
exports.retryFailedSyncs = retryFailedSyncs;
exports.getFabricSyncStats = getFabricSyncStats;
exports.queryFabricTransaction = queryFabricTransaction;
exports.shutdownFabricService = shutdownFabricService;
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const index_1 = require("../index");
// Redis connection for BullMQ
const redis = new ioredis_1.Redis(process.env.REDIS_URL || 'redis://localhost:6379');
// Create queue for Fabric sync jobs
exports.fabricSyncQueue = new bullmq_1.Queue('fabric-sync', {
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 second delay
        },
    },
});
// Mock Fabric Network Gateway (replace with actual Fabric SDK)
class MockFabricGateway {
    constructor() {
        this.isConnected = false;
    }
    async connect() {
        console.log('🔗 Connecting to Fabric network...');
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.isConnected = true;
        console.log('✅ Connected to Fabric network');
    }
    async disconnect() {
        console.log('🔌 Disconnecting from Fabric network...');
        this.isConnected = false;
        console.log('✅ Disconnected from Fabric network');
    }
    async submitTransaction(chaincodeName, functionName, args) {
        if (!this.isConnected) {
            throw new Error('Not connected to Fabric network');
        }
        console.log(`📤 Submitting transaction: ${chaincodeName}.${functionName}`, args);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Simulate occasional failures (10% failure rate)
        if (Math.random() < 0.1) {
            throw new Error('Fabric network error: Transaction failed');
        }
        // Generate mock transaction ID and block hash
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const blockHash = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`✅ Transaction submitted successfully: ${txId}`);
        return { txId, blockHash };
    }
    async queryTransaction(txId) {
        if (!this.isConnected) {
            throw new Error('Not connected to Fabric network');
        }
        console.log(`🔍 Querying transaction: ${txId}`);
        // Simulate query delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            txId,
            status: 'VALID',
            timestamp: new Date().toISOString(),
            blockNumber: Math.floor(Math.random() * 10000)
        };
    }
}
// Singleton Fabric gateway instance
const fabricGateway = new MockFabricGateway();
/**
 * Initialize Fabric connection
 */
async function initializeFabric() {
    try {
        await fabricGateway.connect();
    }
    catch (error) {
        console.error('Failed to initialize Fabric connection:', error);
        throw error;
    }
}
/**
 * Queue a collection event for Fabric sync
 * @param eventId - Collection event ID
 * @param priority - Job priority (higher number = higher priority)
 */
async function queueFabricSync(eventId, priority = 0) {
    try {
        await exports.fabricSyncQueue.add('sync-collection-event', { eventId }, {
            priority,
            jobId: `sync-${eventId}`, // Prevent duplicate jobs
        });
        console.log(`📋 Queued Fabric sync for event: ${eventId}`);
    }
    catch (error) {
        console.error('Failed to queue Fabric sync:', error);
        throw error;
    }
}
/**
 * Process Fabric sync job
 * @param eventId - Collection event ID
 */
async function processFabricSync(eventId) {
    console.log(`🔄 Processing Fabric sync for event: ${eventId}`);
    // Get collection event from database
    const event = await index_1.prisma.collectionEvent.findUnique({
        where: { id: eventId },
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
    if (!event) {
        throw new Error(`Collection event not found: ${eventId}`);
    }
    if (event.status === 'SYNCED') {
        console.log(`Event ${eventId} already synced, skipping`);
        return;
    }
    // Update status to UPLOADING
    await index_1.prisma.collectionEvent.update({
        where: { id: eventId },
        data: {
            status: 'UPLOADING',
            updatedAt: new Date()
        }
    });
    try {
        // Prepare chaincode arguments
        const args = [
            event.id,
            event.farmerId,
            event.species,
            event.latitude.toString(),
            event.longitude.toString(),
            event.timestamp.toISOString(),
            event.moisturePct?.toString() || '',
            event.notes || '',
            event.photoHash || '',
            event.isValidLocation.toString(),
            event.isValidSeason.toString(),
            JSON.stringify({
                accuracy: event.accuracy,
                altitude: event.altitude,
                source: event.source,
                deviceInfo: event.deviceInfo,
                appVersion: event.appVersion
            })
        ];
        // Submit transaction to Fabric network
        const result = await fabricGateway.submitTransaction(process.env.FABRIC_CHAINCODE_NAME || 'traceya', 'CreateCollectionEvent', args);
        // Update event with transaction details
        await index_1.prisma.collectionEvent.update({
            where: { id: eventId },
            data: {
                status: 'SYNCED',
                txId: result.txId,
                blockHash: result.blockHash,
                syncedAt: new Date(),
                lastError: null,
                updatedAt: new Date()
            }
        });
        // Create audit log
        await index_1.prisma.auditLog.create({
            data: {
                action: 'SYNC',
                entityType: 'EVENT',
                entityId: eventId,
                farmerId: event.farmerId,
                metadata: {
                    txId: result.txId,
                    blockHash: result.blockHash,
                    chaincode: process.env.FABRIC_CHAINCODE_NAME || 'traceya',
                    function: 'CreateCollectionEvent'
                }
            }
        });
        console.log(`✅ Successfully synced event ${eventId} to Fabric: ${result.txId}`);
    }
    catch (error) {
        console.error(`❌ Failed to sync event ${eventId} to Fabric:`, error);
        // Update event with error details
        await index_1.prisma.collectionEvent.update({
            where: { id: eventId },
            data: {
                status: 'FAILED',
                lastError: error instanceof Error ? error.message : 'Unknown error',
                retryCount: {
                    increment: 1
                },
                updatedAt: new Date()
            }
        });
        throw error;
    }
}
/**
 * Retry failed Fabric sync jobs
 * @param maxRetries - Maximum number of retries per event
 */
async function retryFailedSyncs(maxRetries = 3) {
    console.log('🔄 Retrying failed Fabric syncs...');
    const failedEvents = await index_1.prisma.collectionEvent.findMany({
        where: {
            status: 'FAILED',
            retryCount: {
                lt: maxRetries
            }
        },
        select: {
            id: true,
            retryCount: true
        }
    });
    console.log(`Found ${failedEvents.length} failed events to retry`);
    for (const event of failedEvents) {
        try {
            // Calculate delay based on retry count (exponential backoff)
            const delay = Math.pow(2, event.retryCount) * 5000; // 5s, 10s, 20s, etc.
            await queueFabricSync(event.id, -event.retryCount); // Lower priority for retries
            console.log(`Queued retry for event ${event.id} (attempt ${event.retryCount + 1})`);
        }
        catch (error) {
            console.error(`Failed to queue retry for event ${event.id}:`, error);
        }
    }
}
/**
 * Get Fabric sync statistics
 */
async function getFabricSyncStats() {
    const [pending, uploading, synced, failed] = await Promise.all([
        index_1.prisma.collectionEvent.count({ where: { status: 'PENDING' } }),
        index_1.prisma.collectionEvent.count({ where: { status: 'UPLOADING' } }),
        index_1.prisma.collectionEvent.count({ where: { status: 'SYNCED' } }),
        index_1.prisma.collectionEvent.count({ where: { status: 'FAILED' } })
    ]);
    const queueStats = await exports.fabricSyncQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    return {
        events: {
            pending,
            uploading,
            synced,
            failed,
            total: pending + uploading + synced + failed
        },
        queue: queueStats
    };
}
/**
 * Query transaction from Fabric network
 * @param txId - Transaction ID
 */
async function queryFabricTransaction(txId) {
    try {
        return await fabricGateway.queryTransaction(txId);
    }
    catch (error) {
        console.error(`Failed to query transaction ${txId}:`, error);
        throw error;
    }
}
/**
 * Gracefully shutdown Fabric service
 */
async function shutdownFabricService() {
    console.log('🛑 Shutting down Fabric service...');
    try {
        await exports.fabricSyncQueue.close();
        await fabricGateway.disconnect();
        await redis.quit();
        console.log('✅ Fabric service shutdown complete');
    }
    catch (error) {
        console.error('Error during Fabric service shutdown:', error);
    }
}
//# sourceMappingURL=fabricService.js.map