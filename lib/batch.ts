import { db, Batch, CollectionEvent, ProcessingStep, LabEvent } from './db';
import { generateQRCodeData } from './qrcode';
import { formatTimestamp } from './utils';

/**
 * Generates a unique batch ID
 */
export const generateBatchId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `B-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * Creates a new batch from collection events
 */
export const createBatch = async ({
  name,
  collectionEventIds,
  createdBy,
  expiryDate
}: {
  name: string;
  collectionEventIds: string[];
  createdBy: string;
  expiryDate?: string;
}): Promise<Batch> => {
  // Validate that all collection events exist
  const events = await Promise.all(
    collectionEventIds.map(async (eventId) => {
      const events = await db.collectionEvents.where('eventId').equals(eventId).toArray();
      if (events.length === 0) {
        throw new Error(`Collection event with ID ${eventId} not found`);
      }
      return events[0];
    })
  );
  
  // Extract species from collection events
  const species = [...new Set(events.map(event => event.species))];
  
  // Create the batch
  const batchId = generateBatchId();
  const now = new Date();
  
  const batch: Batch = {
    batchId,
    name,
    createdBy,
    collectionEventIds,
    processingStepIds: [],
    labEventIds: [],
    species,
    creationDate: formatTimestamp(now),
    expiryDate,
    status: 'processing',
    onChainTx: null,
    createdAt: formatTimestamp(now),
    updatedAt: formatTimestamp(now)
  };
  
  // Save the batch
  const id = await db.batches.add(batch);
  batch.id = id;
  
  // Update collection events with batch ID
  await Promise.all(
    events.map(async (event) => {
      await db.collectionEvents.update(event.id!, { batchId });
    })
  );
  
  // Generate QR code for the batch
  await generateQRCodeData(batchId);
  
  return batch;
};

/**
 * Adds a processing step to a batch
 */
export const addProcessingStep = async ({
  batchId,
  processorId,
  type,
  details,
  photos
}: {
  batchId: string;
  processorId: string;
  type: "drying" | "grinding" | "storage" | "packaging" | "other";
  details: {
    temperature?: number;
    humidity?: number;
    duration?: number;
    method?: string;
    equipment?: string;
    notes?: string;
  };
  photos: Array<{
    blobUrl: string;
    hash: string;
    timestamp: string;
  }>;
}): Promise<ProcessingStep> => {
  // Validate that the batch exists
  const batches = await db.batches.where('batchId').equals(batchId).toArray();
  if (batches.length === 0) {
    throw new Error(`Batch with ID ${batchId} not found`);
  }
  
  const batch = batches[0];
  
  // Create the processing step
  const stepId = `PS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
  const now = new Date();
  
  const step: ProcessingStep = {
    stepId,
    batchId,
    processorId,
    type,
    timestamp: formatTimestamp(now),
    details,
    photos,
    status: 'pending',
    onChainTx: null,
    lastError: null,
    createdAt: formatTimestamp(now),
    updatedAt: formatTimestamp(now)
  };
  
  // Save the processing step
  const id = await db.processingSteps.add(step);
  step.id = id;
  
  // Update the batch with the processing step ID
  await db.batches.update(batch.id!, {
    processingStepIds: [...batch.processingStepIds, stepId],
    updatedAt: formatTimestamp(now)
  });
  
  return step;
};

/**
 * Adds a lab event to a batch
 */
export const addLabEvent = async ({
  batchId,
  labUserId,
  species,
  testResults,
  attachments,
  notes
}: {
  batchId: string;
  labUserId: string;
  species: string;
  testResults: {
    moisturePct: number;
    pesticideLevels?: number;
    dnaBarcoding?: string;
    otherTests?: Record<string, any>;
  };
  attachments: Array<{
    type: "photo" | "pdf" | "report";
    blobUrl: string;
    hash: string;
    filename: string;
    fileSize: number;
    timestamp: string;
  }>;
  notes: string;
}): Promise<LabEvent> => {
  // Validate that the batch exists
  const batches = await db.batches.where('batchId').equals(batchId).toArray();
  if (batches.length === 0) {
    throw new Error(`Batch with ID ${batchId} not found`);
  }
  
  const batch = batches[0];
  
  // Create the lab event
  const eventId = `LE-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
  const now = new Date();
  
  const labEvent: LabEvent = {
    eventId,
    labUserId,
    batchId,
    species,
    timestamp: formatTimestamp(now),
    testResults,
    attachments,
    notes,
    status: 'pending',
    onChainTx: null,
    lastError: null,
    createdAt: formatTimestamp(now),
    updatedAt: formatTimestamp(now)
  };
  
  // Save the lab event
  const id = await db.labEvents.add(labEvent);
  labEvent.id = id;
  
  // Update the batch with the lab event ID
  await db.batches.update(batch.id!, {
    labEventIds: [...batch.labEventIds, eventId],
    status: 'testing',
    updatedAt: formatTimestamp(now)
  });
  
  return labEvent;
};

/**
 * Gets a batch with all related data
 */
export const getBatchWithDetails = async (batchId: string): Promise<{
  batch: Batch;
  collectionEvents: CollectionEvent[];
  processingSteps: ProcessingStep[];
  labEvents: LabEvent[];
} | null> => {
  // Get the batch
  const batches = await db.batches.where('batchId').equals(batchId).toArray();
  if (batches.length === 0) {
    return null;
  }
  
  const batch = batches[0];
  
  // Get related data
  const collectionEvents = await Promise.all(
    batch.collectionEventIds.map(async (eventId) => {
      const events = await db.collectionEvents.where('eventId').equals(eventId).toArray();
      return events[0];
    })
  );
  
  const processingSteps = await Promise.all(
    batch.processingStepIds.map(async (stepId) => {
      const steps = await db.processingSteps.where('stepId').equals(stepId).toArray();
      return steps[0];
    })
  );
  
  const labEvents = await Promise.all(
    batch.labEventIds.map(async (eventId) => {
      const events = await db.labEvents.where('eventId').equals(eventId).toArray();
      return events[0];
    })
  );
  
  return {
    batch,
    collectionEvents: collectionEvents.filter(Boolean) as CollectionEvent[],
    processingSteps: processingSteps.filter(Boolean) as ProcessingStep[],
    labEvents: labEvents.filter(Boolean) as LabEvent[]
  };
};

/**
 * Updates a batch status
 */
export const updateBatchStatus = async (batchId: string, status: "processing" | "testing" | "completed" | "rejected"): Promise<Batch | null> => {
  // Get the batch
  const batches = await db.batches.where('batchId').equals(batchId).toArray();
  if (batches.length === 0) {
    return null;
  }
  
  const batch = batches[0];
  
  // Update the batch status
  await db.batches.update(batch.id!, {
    status,
    updatedAt: formatTimestamp(new Date())
  });
  
  // Get the updated batch
  const updatedBatches = await db.batches.where('batchId').equals(batchId).toArray();
  return updatedBatches[0];
};