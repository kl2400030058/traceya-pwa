/**
 * ProcessingEvent Model
 * Represents a processing or manufacturing step in the supply chain
 */

import { v4 as uuidv4 } from 'uuid';
import { sha256 } from '@/lib/crypto';

export interface ProcessingEventData {
  id: string;
  batchId: string;
  eventType: ProcessingEventType;
  operatorId: string;
  equipmentId?: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  parameters: Record<string, any>;
  notes?: string;
  previousEventId?: string;
  nextEventId?: string;
  qualityScore?: number;
  blockchainTxId?: string;
  blockchainAnchorDate?: number;
  merkleProof?: any;
  qrCode?: string;
  temperature?: number;
}

export type ProcessingEventType = 
  | 'collection'
  | 'drying'
  | 'grinding'
  | 'extraction'
  | 'filtration'
  | 'concentration'
  | 'packaging'
  | 'storage'
  | 'transportation'
  | 'quality_check'
  | 'other';

export class ProcessingEvent {
  id: string;
  batchId: string;
  eventType: ProcessingEventType;
  operatorId: string;
  equipmentId?: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  parameters: Record<string, any>;
  notes?: string;
  previousEventId?: string;
  nextEventId?: string;
  qualityScore?: number;
  blockchainTxId?: string;
  blockchainAnchorDate?: number;
  merkleProof?: any;
  qrCode?: string;
  temperature?: number;

  constructor(data: Partial<ProcessingEventData> = {}) {
    this.id = data.id || uuidv4();
    this.batchId = data.batchId || '';
    this.eventType = data.eventType || 'other';
    this.operatorId = data.operatorId || '';
    this.equipmentId = data.equipmentId;
    this.timestamp = data.timestamp || Date.now();
    this.location = data.location;
    this.parameters = data.parameters || {};
    this.notes = data.notes;
    this.previousEventId = data.previousEventId;
    this.nextEventId = data.nextEventId;
    this.qualityScore = data.qualityScore;
    this.blockchainTxId = data.blockchainTxId;
    this.blockchainAnchorDate = data.blockchainAnchorDate;
    this.merkleProof = data.merkleProof;
    this.qrCode = data.qrCode;
    this.temperature = data.temperature;
  }

  /**
   * Generate a hash of the processing event for blockchain anchoring
   */
  async generateHash(): Promise<string> {
    const dataToHash = {
      id: this.id,
      batchId: this.batchId,
      eventType: this.eventType,
      operatorId: this.operatorId,
      equipmentId: this.equipmentId,
      timestamp: this.timestamp,
      parameters: this.parameters,
      previousEventId: this.previousEventId,
      nextEventId: this.nextEventId,
      temperature: this.temperature
    };

    return await sha256(JSON.stringify(dataToHash));
  }

  /**
   * Generate a QR code for this processing event
   * Returns a string that can be used to generate a QR code
   */
  generateQRCode(): string {
    // Create a data string that includes essential information
    const qrData = JSON.stringify({
      id: this.id,
      batchId: this.batchId,
      eventType: this.eventType,
      timestamp: this.timestamp,
      blockchainTxId: this.blockchainTxId
    });

    // In a real implementation, this would be encoded as a QR code
    // For now, we'll just store the data string
    this.qrCode = `qr:${Buffer.from(qrData).toString('base64')}`;
    return this.qrCode;
  }

  /**
   * Link this event to a previous event in the processing chain
   */
  linkToPreviousEvent(previousEventId: string): void {
    this.previousEventId = previousEventId;
  }

  /**
   * Link this event to a next event in the processing chain
   */
  linkToNextEvent(nextEventId: string): void {
    this.nextEventId = nextEventId;
  }

  /**
   * Set the quality score for this processing event
   */
  setQualityScore(score: number): void {
    this.qualityScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Convert the processing event to a plain object
   */
  toJSON(): ProcessingEventData {
    return {
      id: this.id,
      batchId: this.batchId,
      eventType: this.eventType,
      operatorId: this.operatorId,
      equipmentId: this.equipmentId,
      timestamp: this.timestamp,
      location: this.location,
      parameters: this.parameters,
      notes: this.notes,
      previousEventId: this.previousEventId,
      nextEventId: this.nextEventId,
      qualityScore: this.qualityScore,
      blockchainTxId: this.blockchainTxId,
      blockchainAnchorDate: this.blockchainAnchorDate,
      merkleProof: this.merkleProof,
      qrCode: this.qrCode,
      temperature: this.temperature
    };
  }

  /**
   * Create a ProcessingEvent instance from JSON data
   */
  static fromJSON(data: ProcessingEventData): ProcessingEvent {
    return new ProcessingEvent(data);
  }
}