import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import axios from 'axios';
import FormData from 'form-data';

export class EvidenceUploadService {
  /**
   * Validates an evidence upload request
   */
  static async validateUpload(formData: FormData, userId: string) {
    // Basic validation
    const file = formData.get('file') as unknown as Blob;
    const metadata = formData.get('metadata') as string;
    
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    if (!metadata) {
      return { valid: false, error: 'No metadata provided' };
    }
    
    try {
      const metadataObj = JSON.parse(metadata);
      // Additional validation logic can be added here
      
      return { valid: true, file, metadata: metadataObj };
    } catch (error) {
      return { valid: false, error: 'Invalid metadata format' };
    }
  }
  
  /**
   * Processes and stores evidence upload
   */
  static async processUpload(file: Blob, metadata: any, userId: string) {
    try {
      // Store file data
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Create database record
      // Using prisma-style query with proper error handling
      const fileName = (file as any).name || 'unknown';
      const fileSize = (file as any).size || 0;
      const fileType = (file as any).type || 'application/octet-stream';
      
      const upload = await db.evidenceUploads.create?.({
        data: {
          userId,
          fileName,
          fileSize,
          fileType,
          metadata: metadata,
          status: 'PENDING',
        }
      }) || { id: '' };
      
      return { success: !!upload.id, uploadId: upload.id };
    } catch (error) {
      console.error('Error processing upload:', error);
      return { success: false, error: 'Failed to process upload' };
    }
  }

  /**
   * Creates a new evidence upload record
   */
  static async createEvidenceUpload(data: any) {
    try {
      const upload = await db.evidenceUploads.create?.({
        data
      }) || { id: '' };
      return { success: !!upload.id, evidenceUploadId: upload.id };
    } catch (error) {
      console.error('Error creating evidence upload:', error);
      return { success: false, error: 'Failed to create evidence upload' };
    }
  }

  /**
   * Gets an evidence upload by ID
   */
  static async getEvidenceUploadById(id: string) {
    try {
      const upload = await db.evidenceUploads.findUnique({
        where: { id }
      });
      return upload;
    } catch (error) {
      console.error('Error getting evidence upload:', error);
      return null;
    }
  }

  /**
   * Checks if a user has access to an evidence upload
   */
  static async hasAccess(uploadId: string, userId: string) {
    try {
      const upload = await db.evidenceUploads.findFirst({
        where: {
          id: uploadId,
          OR: [
            { userId },
            { accessControl: { path: ['accessList'], array_contains: userId } },
            { accessControl: { path: ['isPublic'], equals: true } }
          ]
        }
      });
      return !!upload;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  /**
   * Gets evidence uploads by FIR ID
   */
  static async getEvidenceUploadsByFIR(firId: string) {
    try {
      const uploads = await db.evidenceUploads.findMany({
        where: { firId }
      });
      return uploads;
    } catch (error) {
      console.error('Error getting evidence uploads by FIR:', error);
      return [];
    }
  }

  /**
   * Gets recent evidence uploads for a user
   */
  static async getRecentEvidenceUploads(userId: string, limit = 10, uploaderRole?: string) {
    try {
      const uploads = await db.evidenceUploads.findMany?.({ 
        where: {
          userId,
          ...(uploaderRole && { uploaderRole })
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      }) || [];
      
      return { success: true, uploads };
    } catch (error) {
      console.error('Error fetching recent uploads:', error);
      return { success: false, error: 'Failed to fetch recent uploads', uploads: [] };
    }
  }
}