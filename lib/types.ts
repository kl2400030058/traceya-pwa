// Types for enhanced collector flow

export interface ActivityLogEntry {
  action: string;
  timestamp: string;
  details?: string;
}

export interface EnvironmentalConditionsData {
  temperature?: number;
  humidity?: number;
  soilType?: string;
  altitude?: number;
  lightConditions?: string;
  weatherConditions?: string;
}

export interface PlantMetadataData {
  maturityStage?: string;
  leafColor?: string;
  floweringState?: string;
  height?: number;
  healthStatus?: string;
  estimatedAge?: string;
  species?: string;
}

export interface PhotoData {
  blobUrl: string;
  hash: string;
  file: File;
  timestamp: string;
  location?: LocationData;
  filterApplied?: string;
  collectorId?: string;
  plantId?: string;
  lightCondition?: string;
}

export interface VideoData {
  blobUrl: string;
  hash: string;
  file: File;
  timestamp: string;
  duration: number;
  location?: LocationData;
  filterApplied?: string;
  collectorId?: string;
  plantId?: string;
}

export interface FilterSettings {
  type: string;
  intensity: number;
}

export interface QualityMetrics {
  gpsAccuracy: number;
  photoQuality: number;
  metadataCompleteness: number;
  overallScore: number;
}

// Types for lab events and processing

export interface LocationData {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp?: string;
}

export interface LabTestResult {
  moisturePct: number;
  pesticideLevels?: number;
  dnaBarcoding?: string;
  otherTests?: Record<string, any>;
}

export interface Attachment {
  type: "photo" | "pdf" | "report";
  blobUrl: string;
  url?: string;
  hash: string;
  filename: string;
  fileSize: number;
  timestamp: string;
}

export interface ProcessingDetails {
  temperature?: number;
  humidity?: number;
  duration?: number;
  method?: string;
  equipment?: string;
  notes?: string;
  steps?: StepDetails[];
  batchId?: string;
  lastUpdated?: string;
}

export interface StepDetails {
  type: string;
  timestamp: string;
  details: string;
  conditions?: {
    temperature?: number;
    humidity?: number;
    duration?: number;
    [key: string]: any;
  };
}

export interface ProcessingStep {
  id?: number;
  stepId: string;
  batchId: string;
  processorId: string;
  type: "drying" | "grinding" | "storage" | "packaging" | "other";
  timestamp: string;
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
  status: "pending" | "synced" | "failed" | "uploading";
  onChainTx: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'lab_result' | 'processing_complete' | 'threshold_alert';
  title: string;
  message: string;
  relatedId: string;
  status: 'read' | 'unread';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface BatchSummary {
  batchId: string;
  name: string;
  species: string[];
  collectionCount: number;
  creationDate: string;
  status: "processing" | "testing" | "completed" | "rejected";
  qrCodeUrl?: string;
  hasLabResults?: boolean;
  eventCount?: number;
  collectionDates?: {
    start: string;
    end: string;
  };
}

export interface QRCodeData {
  batchId: string;
  verificationUrl: string;
  createdAt: string;
  expiresAt?: string;
  verificationToken: string;
}

export interface CollectionEvent {
  eventId: string;
  farmerId: string;
  timestamp: string;
  location?: LocationData;
  photos?: { blobUrl: string; hash: string; timestamp: string; location?: LocationData }[];
  videos?: VideoData[];
  plantMetadata?: PlantMetadataData;
  batchId?: string;
  environmentalConditions?: EnvironmentalConditionsData;
  activityLog?: ActivityLogEntry[];
  quality?: {
    moisturePct?: number;
    notes?: string;
    score?: number;
    metrics?: QualityMetrics;
    suggestions?: string[];
  };
  syncStatus?: 'pending' | 'synced' | 'failed';
  syncAttempts?: number;
  errors?: string[];
}

export interface Batch {
  batchId: string;
  name: string;
  createdAt: string;
  createdBy: string;
  status: "processing" | "testing" | "completed" | "rejected";
  processingDetails?: ProcessingDetails;
  processingStepIds: string[];
  collectionEventIds: string[];
  labEventIds: string[];
  species: string[];
  creationDate: string;
  timestamp?: string | number;
  onChainTx?: string;
  updatedAt?: string;
  qrCode?: QRCodeData;
  labResults?: LabTestResult;
  attachments?: Attachment[];
  expiryDate?: string;
}