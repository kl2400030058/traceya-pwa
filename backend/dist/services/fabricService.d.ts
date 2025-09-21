/**
 * Hyperledger Fabric integration service
 * Contains mock implementations that can be replaced with actual Fabric SDK calls
 */
import { Queue } from 'bullmq';
export declare const fabricSyncQueue: Queue<any, any, string>;
/**
 * Initialize Fabric connection
 */
export declare function initializeFabric(): Promise<void>;
/**
 * Queue a collection event for Fabric sync
 * @param eventId - Collection event ID
 * @param priority - Job priority (higher number = higher priority)
 */
export declare function queueFabricSync(eventId: string, priority?: number): Promise<void>;
/**
 * Process Fabric sync job
 * @param eventId - Collection event ID
 */
export declare function processFabricSync(eventId: string): Promise<void>;
/**
 * Retry failed Fabric sync jobs
 * @param maxRetries - Maximum number of retries per event
 */
export declare function retryFailedSyncs(maxRetries?: number): Promise<void>;
/**
 * Get Fabric sync statistics
 */
export declare function getFabricSyncStats(): Promise<{
    events: {
        pending: number;
        uploading: number;
        synced: number;
        failed: number;
        total: number;
    };
    queue: {
        [index: string]: number;
    };
}>;
/**
 * Query transaction from Fabric network
 * @param txId - Transaction ID
 */
export declare function queryFabricTransaction(txId: string): Promise<any>;
/**
 * Gracefully shutdown Fabric service
 */
export declare function shutdownFabricService(): Promise<void>;
//# sourceMappingURL=fabricService.d.ts.map