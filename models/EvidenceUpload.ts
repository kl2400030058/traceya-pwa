/**
 * Interface for evidence upload metadata
 */
export interface EvidenceUploadMetadata {
  id: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: 'officer' | 'investigator' | 'lab' | 'citizen' | 'other';
  deviceType: 'bodycam' | 'drone' | 'mobile' | 'cctv' | 'other';
  deviceId?: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
    altitude?: number;
    accuracy?: number;
    address?: string;
  };
  evidenceType: 'video' | 'image' | 'audio' | 'document' | 'other';
  fileSize: number;
  duration?: number;
  resolution?: string;
  mimeType: string;
  originalFilename: string;
  storagePath: string;
  thumbnailPath?: string;
  firId?: string;
  caseId?: string;
  tags: string[];
  description?: string;
  blockchainHash?: string;
  blockchainTimestamp?: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDetails?: {
    verifiedBy?: string;
    verifiedAt?: Date;
    verificationMethod?: string;
    confidenceScore?: number;
    rejectionReason?: string;
  };
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingDetails?: {
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    aiAnalysisResults?: Record<string, any>;
  };
  accessControl: {
    isPublic: boolean;
    accessList?: string[];
    expiresAt?: Date;
  };
  relatedProperties?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceVerificationResult {
  verified: boolean;
  confidence: number;
  reason?: string;
}

export interface EvidenceFilter {
  firId?: string;
  caseId?: string;
  uploaderId?: string;
  uploaderRole?: EvidenceUploadMetadata['uploaderRole'];
  evidenceType?: EvidenceUploadMetadata['evidenceType'];
  verificationStatus?: EvidenceUploadMetadata['verificationStatus'];
  processingStatus?: EvidenceUploadMetadata['processingStatus'];
  startDate?: Date;
  endDate?: Date;
}