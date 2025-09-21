import Dexie, { type Table } from "dexie"
import { QRCodeData } from './types'
import { ProcessingEventData } from '@/models/ProcessingEvent'
import { MFASecret, MFAVerification } from '@/services/mfaservice'
import { UserRole } from '@/services/rbacservice'

export interface CollectionEvent {
  id?: number
  eventId: string
  farmerId: string
  researcherId?: string
  species: string
  location: {
    lat: number
    lon: number
    accuracy: number
  }
  timestamp: string
  quality: {
    moisturePct: number
    notes: string
    score?: number
    metrics?: {
      gpsAccuracy?: number
      photoQuality?: number
      metadataCompleteness?: number
      environmentalData?: number
      plantData?: number
    }
    suggestions?: string[]
  }
  // Enhanced metadata for collection events
  environmentalConditions?: {
    temperature?: number // in Celsius
    humidity?: number // percentage
    soilType?: string
    altitude?: number // in meters
  }
  plantMetadata?: {
    maturityStage?: string // 'seedling', 'vegetative', 'flowering', 'mature'
    leafColor?: string
    floweringState?: string
    height?: number // in cm
  }
  activityLog?: Array<{
    action: string
    timestamp: string
    details?: string
  }>
  photos: Array<{
    blobUrl: string
    hash: string
    location?: {
      lat: number
      lon: number
      accuracy: number
    }
    timestamp?: string
    // Enhanced photo metadata
    lightCondition?: string
    filterApplied?: string
  }>
  videos?: Array<{
    blobUrl: string
    hash: string
    duration: number // in seconds
    location?: {
      lat: number
      lon: number
      accuracy: number
    }
    timestamp?: string
  }>
  status: "pending" | "uploading" | "synced" | "failed"
  onChainTx: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
  // Sync and offline tracking
  syncAttempts?: number
  lastSyncAttempt?: string
  conflictResolution?: {
    hasConflict: boolean
    resolvedBy?: string
    resolvedAt?: string
    resolutionNotes?: string
  }
  // Batch association
  batchId?: string
}

export interface LabEvent {
  id?: number
  eventId: string
  labUserId: string
  batchId: string
  species: string
  timestamp: string
  testResults: {
    moisturePct: number
    pesticideLevels?: number
    dnaBarcoding?: string
    otherTests?: Record<string, any>
  }
  attachments: Array<{
    type: "photo" | "pdf" | "report"
    blobUrl: string
    hash: string
    filename: string
    fileSize: number
    timestamp: string
  }>
  notes: string
  status: "pending" | "uploading" | "synced" | "failed"
  onChainTx: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
  syncAttempts?: number
  lastSyncAttempt?: string
}

export interface ProcessingStep {
  id?: number
  stepId: string
  batchId: string
  processorId: string
  type: "drying" | "grinding" | "storage" | "packaging" | "other"
  timestamp: string
  details: {
    temperature?: number
    humidity?: number
    duration?: number
    method?: string
    equipment?: string
    notes?: string
  }
  photos: Array<{
    blobUrl: string
    hash: string
    timestamp: string
  }>
  status: "pending" | "uploading" | "synced" | "failed"
  onChainTx: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
  syncAttempts?: number
  lastSyncAttempt?: string
}

export interface Batch {
  id?: number
  batchId: string
  name: string
  createdBy: string
  collectionEventIds: string[]
  processingStepIds: string[]
  labEventIds: string[]
  species: string[]
  creationDate: string
  expiryDate?: string
  status: "processing" | "testing" | "completed" | "rejected"
  qrCode?: QRCodeData | string
  onChainTx: string | null
  createdAt: string
  updatedAt: string
}

export interface SyncQueue {
  id?: number
  eventId: string
  action: "create" | "update" | "delete"
  data: any
  retryCount: number
  lastAttempt: string | null
  createdAt: string
}

export interface Notification {
  id?: number
  userId: string
  userType: "farmer" | "lab" | "processor" | "consumer"
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  relatedTo?: {
    type: "collection" | "lab" | "processing" | "batch"
    id: string
  }
  isRead: boolean
  createdAt: string
}

export interface AppSettings {
  id?: number
  syncInterval: number // minutes
  smsGateway: string
  language: "en" | "hi"
  farmerId: string
  labUserId?: string
  processorId?: string
  userRole: "farmer" | "lab" | "processor" | "admin"
  lastSync: string | null
}

export interface LabCertificateStore {
  id: string;
  eventId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: number;
  uploadedBy: string;
  certificateType: 'dna' | 'pesticide' | 'moisture' | 'other';
  certificateHash?: string;
  blockchainTxId?: string;
  blockchainAnchorDate?: number;
  merkleProof?: string;
  verified?: boolean;
  verificationDate?: number;
  notes?: string;
  version: number;
}

export interface AuditLog {
  id?: number;
  userId: string;
  action: string;
  resource: string;
  details?: any;
  timestamp: number;
  ipAddress?: string;
}

export interface IPFSFile {
  id?: number;
  cid: string;
  name: string;
  size: number;
  type: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  timestamp: number;
  metadata?: any;
  status: 'pending' | 'uploaded' | 'failed';
  localPath?: string;
}

export interface ZKProof {
  id?: number;
  userId: string;
  resourceType: string;
  resourceId: string;
  proofType: 'identity' | 'ownership' | 'location' | 'attribute' | 'custom';
  proofData: string;
  publicInputs: any;
  timestamp: number;
  verified: boolean;
  verificationData?: any;
}

export interface Property {
  id?: number;
  propertyId: string;
  name: string;
  description?: string;
  type: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'mixed' | 'other';
  status: 'active' | 'inactive' | 'pending' | 'disputed';
  location: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  area?: {
    value: number;
    unit: 'sqft' | 'sqm' | 'acre' | 'hectare';
  };
  owner: {
    id: string;
    name: string;
    contactInfo?: string;
  };
  documents?: Array<{
    id: string;
    type: 'deed' | 'title' | 'survey' | 'tax' | 'permit' | 'other';
    fileUrl?: string;
    fileHash?: string;
    issueDate: number;
    expiryDate?: number;
    verificationStatus: 'verified' | 'pending' | 'rejected';
  }>;
  history?: Array<{
    action: string;
    timestamp: number;
    userId: string;
    details?: any;
  }>;
  metadata?: any;
  createdAt: number;
  updatedAt: number;
}

export interface EvidencePropertyRelation {
  id: string;
  evidenceId: string;
  propertyId: string;
  relationshipType: 'collected-at' | 'stored-at' | 'related-to';
  notes?: string;
  timestamp: Date;
  createdAt: Date;
}

export class TraceyaDB extends Dexie {
  collectionEvents!: Table<CollectionEvent>
  labEvents!: Table<LabEvent>
  processingSteps!: Table<ProcessingStep>
  processingEvents!: Table<ProcessingEventData>
  batches!: Table<Batch>
  syncQueue!: Table<SyncQueue>
  notifications!: Table<Notification>
  settings!: Table<AppSettings>
  lab_certificates!: Table<LabCertificateStore>
  mfa_secrets!: Table<MFASecret>
  mfa_verifications!: Table<MFAVerification>
  mfa_backup_codes!: Table<any>
  user_roles!: Table<UserRole>
  audit_logs!: Table<AuditLog>
  auditLogs!: Table<AuditLog>
  ipfs_files!: Table<IPFSFile>
  zkp_proofs!: Table<ZKProof>
  evidenceUploads!: Table<any>
  firs!: Table<any>
  properties!: Table<Property>
  evidencePropertyRelations!: Table<EvidencePropertyRelation>

  constructor() {
    super("TraceyaDB")

    this.version(1).stores({
      collectionEvents: "++id, eventId, farmerId, species, status, timestamp, batchId",
      syncQueue: "++id, eventId, action, createdAt",
      settings: "++id",
    })

    this.version(2).stores({
      labEvents: "++id, eventId, labUserId, batchId, species, status, timestamp",
      processingSteps: "++id, stepId, batchId, processorId, type, status, timestamp",
      processingEvents: "++id, eventId, batchId, processorId, type, status, timestamp",
      batches: "++id, batchId, createdBy, status, creationDate",
      notifications: "++id, userId, userType, isRead, createdAt"
    })
    
    this.version(3).stores({
    lab_certificates: "id, eventId, certificateType, uploadDate, uploadedBy, blockchainTxId, verified"
  })
  
  this.version(4).stores({
    mfa_secrets: "userId, secret, verified, createdAt",
    mfa_verifications: "++id, userId, token, verified, timestamp",
    mfa_backup_codes: "++id, userId, code, used, createdAt"
  })
  
  this.version(5).stores({
    user_roles: "++id, userId, roles, createdAt, updatedAt",
    audit_logs: "++id, userId, action, resource, details, timestamp, ipAddress"
  })
  
  // Map auditLogs to audit_logs table for easier access
  this.auditLogs = this.table('audit_logs')
  
  this.version(6).stores({
    ipfs_files: "++id, cid, name, userId, resourceType, resourceId, timestamp, status"
  })
  
  this.version(7).stores({
    zkp_proofs: "++id, userId, resourceType, resourceId, proofType, timestamp, verified"
  })
  
  this.version(8).stores({
    evidenceUploads: "id, uploaderId, firId, caseId, evidenceType, processingStatus, verificationStatus, createdAt",
    firs: "id, reportedBy, status, category, priorityScore, timestamp"
  })
  
  this.version(9).stores({
    properties: "++id, propertyId, name, type, status, owner.id, createdAt, updatedAt"
  })
  
  this.version(10).stores({
    evidencePropertyRelations: "id, evidenceId, propertyId, relationshipType, timestamp"
  })
  }
}

export const db = new TraceyaDB()

// Initialize default settings
export const initializeSettings = async () => {
  const existingSettings = await db.settings.toArray()
  if (existingSettings.length === 0) {
    await db.settings.add({
      syncInterval: 15,
      smsGateway: "+1234567890",
      language: "en",
      farmerId: "",
      labUserId: "",
      processorId: "",
      userRole: "farmer", // Default role
      lastSync: null,
    })
  } else {
    // Update existing settings for v2 if needed
    const settings = existingSettings[0]
    if (settings.userRole === undefined) {
      await db.settings.update(settings.id!, {
        labUserId: "",
        processorId: "",
        userRole: "farmer", // Default to farmer for existing users
      })
    }
  }
}
