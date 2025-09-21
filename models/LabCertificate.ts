import { v4 as uuidv4 } from 'uuid';
import { sha256Sync } from '@/lib/crypto';
import { QualityMetrics } from '@/services/aiService';
import { MerkleProof } from '@/services/fabricService';

export interface FileData {
  name: string;
  type: string;
  size: number;
  hash?: string;
}

export interface LabCertificateData {
  id?: string;
  eventId: string;
  files: FileData[];
  primaryFileName?: string; // Main file for display purposes
  uploadDate: number;
  uploadedBy: string;
  certificateType: 'dna' | 'pesticide' | 'moisture' | 'other';
  certificateHash?: string;
  blockchainTxId?: string;
  blockchainAnchorDate?: number;
  merkleProof?: MerkleProof;
  zkProof?: string; // Zero-knowledge proof for verification
  verified?: boolean;
  verificationDate?: number;
  notes?: string;
  version: number;
  previousVersionId?: string; // Reference to previous version
  qualityMetrics?: Record<string, number>; // For AI analysis
  anomalyFlags?: string[]; // Flags for detected anomalies
}

export class LabCertificate {
  id: string;
  eventId: string;
  files: FileData[];
  primaryFileName?: string;
  uploadDate: number;
  uploadedBy: string;
  certificateType: 'dna' | 'pesticide' | 'moisture' | 'other';
  certificateHash?: string;
  blockchainTxId?: string;
  blockchainAnchorDate?: number;
  merkleProof?: MerkleProof;
  zkProof?: string;
  verified?: boolean;
  verificationDate?: number;
  notes?: string;
  version: number;
  previousVersionId?: string;
  qualityMetrics?: Record<string, number>;
  anomalyFlags?: string[];

  constructor(data: LabCertificateData) {
    this.id = data.id || uuidv4();
    this.eventId = data.eventId;
    this.files = data.files || [];
    this.primaryFileName = data.primaryFileName || (data.files && data.files.length > 0 ? data.files[0].name : undefined);
    this.uploadDate = data.uploadDate;
    this.uploadedBy = data.uploadedBy;
    this.certificateType = data.certificateType;
    this.certificateHash = data.certificateHash;
    this.blockchainTxId = data.blockchainTxId;
    this.blockchainAnchorDate = data.blockchainAnchorDate;
    this.merkleProof = data.merkleProof;
    this.zkProof = data.zkProof;
    this.verified = data.verified || false;
    this.verificationDate = data.verificationDate;
    this.notes = data.notes;
    this.version = data.version || 1;
    this.previousVersionId = data.previousVersionId;
    this.qualityMetrics = data.qualityMetrics || {};
    this.anomalyFlags = data.anomalyFlags || [];
  }
  
  /**
   * Generate a hash for this certificate
   * @returns SHA-256 hash of the certificate data
   */
  generateHash(): string {
    const dataToHash = {
      id: this.id,
      eventId: this.eventId,
      files: this.files.map(file => ({ name: file.name, type: file.type, size: file.size, hash: file.hash })),
      uploadDate: this.uploadDate,
      uploadedBy: this.uploadedBy,
      certificateType: this.certificateType,
      version: this.version,
      previousVersionId: this.previousVersionId
    };
    
    return sha256Sync(JSON.stringify(dataToHash));
  }
  
  /**
   * Update the certificate hash
   */
  updateHash(): void {
    this.certificateHash = this.generateHash();
  }
  
  /**
   * Verify the certificate hash
   * @returns Whether the stored hash matches the computed hash
   */
  verifyHash(): boolean {
    if (!this.certificateHash) return false;
    return this.certificateHash === this.generateHash();
  }
  
  /**
   * Mark this certificate as verified
   */
  markVerified(): void {
    this.verified = true;
    this.verificationDate = Date.now();
  }
  
  /**
   * Create a new version of this certificate
   * @param updates Partial updates to apply to the new version
   * @returns A new LabCertificate instance with incremented version
   */
  createNewVersion(updates: Partial<LabCertificateData> = {}): LabCertificate {
    const data = this.toJSON();
    return new LabCertificate({
      ...data,
      ...updates,
      id: uuidv4(), // New ID for the new version
      previousVersionId: this.id, // Link to previous version
      version: this.version + 1,
      certificateHash: undefined, // Will be regenerated
      blockchainTxId: undefined, // Will be re-anchored
      blockchainAnchorDate: undefined,
      merkleProof: undefined,
      zkProof: undefined,
      verified: false,
      verificationDate: undefined,
      anomalyFlags: [] // Reset anomaly flags
    });
  }

  toJSON(): LabCertificateData {
    return {
      id: this.id,
      eventId: this.eventId,
      files: this.files,
      primaryFileName: this.primaryFileName,
      uploadDate: this.uploadDate,
      uploadedBy: this.uploadedBy,
      certificateType: this.certificateType,
      certificateHash: this.certificateHash,
      blockchainTxId: this.blockchainTxId,
      blockchainAnchorDate: this.blockchainAnchorDate,
      merkleProof: this.merkleProof,
      zkProof: this.zkProof,
      verified: this.verified,
      verificationDate: this.verificationDate,
      notes: this.notes,
      version: this.version,
      previousVersionId: this.previousVersionId,
      qualityMetrics: this.qualityMetrics,
      anomalyFlags: this.anomalyFlags
    };
  }

  static fromJSON(json: LabCertificateData): LabCertificate {
    return new LabCertificate(json);
  }
  
  /**
   * Add a file to this certificate
   * @param file File data to add
   * @param isPrimary Whether this is the primary file
   */
  addFile(file: FileData, isPrimary: boolean = false): void {
    // Generate hash for the file if not provided
    if (!file.hash) {
      file.hash = sha256Sync(JSON.stringify(file));
    }
    
    this.files.push(file);
    
    // Set as primary file if requested or if this is the first file
    if (isPrimary || !this.primaryFileName) {
      this.primaryFileName = file.name;
    }
    
    // Update certificate hash
    this.updateHash();
  }
  
  /**
   * Get the primary file data
   * @returns The primary file data or undefined if no files
   */
  getPrimaryFile(): FileData | undefined {
    if (!this.primaryFileName || this.files.length === 0) return undefined;
    return this.files.find(file => file.name === this.primaryFileName) || this.files[0];
  }
  
  /**
   * Flag an anomaly in this certificate
   * @param anomalyType Type of anomaly detected
   */
  flagAnomaly(anomalyType: string): void {
    if (!this.anomalyFlags) {
      this.anomalyFlags = [];
    }
    
    if (!this.anomalyFlags.includes(anomalyType)) {
      this.anomalyFlags.push(anomalyType);
    }
  }
  
  /**
   * Set quality metrics for AI analysis
   * @param metrics Quality metrics to set
   */
  setQualityMetrics(metrics: QualityMetrics): void {
    this.qualityMetrics = { ...this.qualityMetrics, ...metrics as unknown as Record<string, number> };
  }
}