"use strict";
/**
 * BullMQ Worker for processing Fabric blockchain sync jobs
 * This worker runs in the background to sync collection events to Hyperledger Fabric
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fabricSyncWorker = void 0;
exports.startWorker = startWorker;
exports.gracefulShutdown = gracefulShutdown;
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
const fabricService_1 = require("@/services/fabricService");
const client_1 = require("@prisma/client");
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Redis connection for BullMQ
const redis = new ioredis_1.Redis(process.env.REDIS_URL || 'redis://localhost:6379');
// Worker configuration
const WORKER_CONFIG = {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
    maxStalledCount: 3,
    stalledInterval: 30000, // 30 seconds
    maxMemoryUsage: 150 * 1024 * 1024, // 150MB
};
// Job processing function
async function processSyncJob(job) {
    const { eventId } = job.data;
    console.log(`🔄 Processing sync job ${job.id} for event ${eventId}`);
    try {
        // Update job progress
        await job.updateProgress(10);
        // Process the Fabric sync
        await (0, fabricService_1.processFabricSync)(eventId);
        // Update job progress to complete
        await job.updateProgress(100);
        console.log(`✅ Completed sync job ${job.id} for event ${eventId}`);
    }
    catch (error) {
        console.error(`❌ Failed sync job ${job.id} for event ${eventId}:`, error);
        // Log the error to database
        await prisma.auditLog.create({
            data: {
                action: 'SYNC_FAILED',
                entityType: 'EVENT',
                entityId: eventId,
                metadata: {
                    jobId: job.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    attempt: job.attemptsMade,
                    maxAttempts: job.opts.attempts || 3
                }
            }
        }).catch(console.error);
        throw error;
    }
}
// Create and configure the worker
const fabricSyncWorker = new bullmq_1.Worker('fabric-sync', processSyncJob, {
    connection: redis,
    concurrency: WORKER_CONFIG.concurrency,
    stalledInterval: WORKER_CONFIG.stalledInterval,
    maxStalledCount: WORKER_CONFIG.maxStalledCount,
    // Memory management
    ...(WORKER_CONFIG.maxMemoryUsage && {
        maxMemoryUsage: WORKER_CONFIG.maxMemoryUsage
    })
});
exports.fabricSyncWorker = fabricSyncWorker;
// Worker event handlers
fabricSyncWorker.on('ready', () => {
    console.log('🚀 Fabric sync worker is ready and waiting for jobs');
});
fabricSyncWorker.on('active', (job) => {
    console.log(`🔄 Started processing job ${job.id} (${job.name})`);
});
fabricSyncWorker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully`);
});
fabricSyncWorker.on('failed', (job, error) => {
    if (job) {
        console.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);
        // If this was the final attempt, log it
        if (job.attemptsMade >= (job.opts.attempts || 3)) {
            console.error(`💀 Job ${job.id} exhausted all retry attempts and will not be retried`);
        }
    }
    else {
        console.error('❌ Unknown job failed:', error.message);
    }
});
fabricSyncWorker.on('stalled', (jobId) => {
    console.warn(`⚠️ Job ${jobId} stalled and will be retried`);
});
fabricSyncWorker.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
});
fabricSyncWorker.on('error', (error) => {
    console.error('💥 Worker error:', error);
});
// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down worker gracefully...');
    await gracefulShutdown();
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down worker gracefully...');
    await gracefulShutdown();
});
async function gracefulShutdown() {
    try {
        console.log('⏳ Waiting for active jobs to complete...');
        // Close the worker (waits for active jobs to complete)
        await fabricSyncWorker.close();
        // Shutdown Fabric service
        await (0, fabricService_1.shutdownFabricService)();
        // Disconnect Prisma
        await prisma.$disconnect();
        console.log('✅ Worker shutdown complete');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}
// Initialize and start the worker
async function startWorker() {
    try {
        console.log('🚀 Starting Fabric sync worker...');
        console.log(`📊 Worker configuration:`, WORKER_CONFIG);
        // Initialize Fabric connection
        await (0, fabricService_1.initializeFabric)();
        console.log('✅ Fabric sync worker started successfully');
        console.log('👀 Monitoring for sync jobs...');
    }
    catch (error) {
        console.error('💥 Failed to start worker:', error);
        process.exit(1);
    }
}
// Health check endpoint for worker monitoring
setInterval(() => {
    try {
        // Log that the worker is running
        console.log(`📊 Fabric sync worker is running - ${new Date().toISOString()}`);
    }
    catch (error) {
        console.error('❌ Error in worker health check:', error);
    }
}, 60000); // Every minute
// Start the worker
if (require.main === module) {
    startWorker();
}
//# sourceMappingURL=fabricSync.js.map