/**
 * BullMQ Worker for processing Fabric blockchain sync jobs
 * This worker runs in the background to sync collection events to Hyperledger Fabric
 */
import { Worker } from 'bullmq';
declare const fabricSyncWorker: Worker<any, void, string>;
declare function gracefulShutdown(): Promise<void>;
declare function startWorker(): Promise<void>;
export { fabricSyncWorker, startWorker, gracefulShutdown };
//# sourceMappingURL=fabricSync.d.ts.map