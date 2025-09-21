import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BiasDetectionService } from '@/services/biasdetectionservice';

// Initialize services
const biasDetectionService = new BiasDetectionService();

/**
 * API endpoint to verify FIR/certificate authenticity
 * 
 * @param request NextRequest object containing the FIR or certificate ID
 * @returns NextResponse with verification data and trust score
 */
export async function GET(request: NextRequest) {
  try {
    // Get the FIR or certificate ID from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Determine if this is an FIR or a certificate based on ID format
    // This is a simplified example - in a real system, you might have a more robust way to distinguish
    const isFIR = id.startsWith('FIR');
    const isLabCert = id.startsWith('LAB');
    
    if (!isFIR && !isLabCert) {
      return NextResponse.json(
        { error: 'Invalid ID format. Must start with FIR or LAB' },
        { status: 400 }
      );
    }
    
    // Fetch the record from the database
    let record;
    if (isFIR) {
      record = await db.table('firs').where('id').equals(id).first();
    } else {
      record = await db.table('labCertificates').where('id').equals(id).first();
    }
    
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    // Calculate trust score
    let trustScore = 0;
    let biasAuditResults = null;
    
    if (isFIR) {
      // For FIRs, calculate trust score based on blockchain verification, AI confidence, etc.
      const blockchainVerified = record.blockchainHash && record.blockchainTimestamp;
      const hasAIAnalysis = record.aiAnalysis && record.aiConfidence;
      
      // Simple scoring algorithm - in a real system this would be more sophisticated
      trustScore = 50; // Base score
      if (blockchainVerified) trustScore += 25;
      if (hasAIAnalysis) trustScore += record.aiConfidence * 0.25;
      
      // Get bias audit results if available
      biasAuditResults = await biasDetectionService.getBiasAuditForFIR(id);
    } else {
      // For lab certificates, calculate trust score based on different factors
      const blockchainVerified = record.blockchainHash && record.blockchainTimestamp;
      const hasDigitalSignature = record.digitalSignature;
      const hasZKP = record.zkpProof;
      
      // Simple scoring algorithm
      trustScore = 50; // Base score
      if (blockchainVerified) trustScore += 20;
      if (hasDigitalSignature) trustScore += 15;
      if (hasZKP) trustScore += 15;
    }
    
    // Prepare the response
    const response = {
      verified: true,
      id: record.id,
      type: isFIR ? 'FIR' : 'Lab Certificate',
      createdAt: record.createdAt,
      lastUpdatedAt: record.updatedAt,
      trustScore,
      blockchainVerified: !!record.blockchainHash,
      blockchainTimestamp: record.blockchainTimestamp,
      // Include a sanitized version of the record with sensitive information removed
      record: sanitizeRecord(record, isFIR),
      biasAudit: biasAuditResults
    };
    
    // Log this verification request for transparency
    await logVerificationRequest(id, trustScore);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error verifying record:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying the record' },
      { status: 500 }
    );
  }
}

/**
 * Sanitize the record to remove sensitive information before sending to client
 * 
 * @param record The database record to sanitize
 * @param isFIR Whether this is an FIR record
 * @returns Sanitized record
 */
function sanitizeRecord(record: any, isFIR: boolean) {
  const sanitized = { ...record };
  
  // Remove sensitive fields based on record type
  if (isFIR) {
    // For FIRs, remove personal identifiers, contact info, etc.
    delete sanitized.complainantPhone;
    delete sanitized.complainantAddress;
    delete sanitized.witnessDetails;
    delete sanitized.suspectDetails;
    // Anonymize names
    if (sanitized.complainantName) {
      sanitized.complainantName = anonymizeName(sanitized.complainantName);
    }
  } else {
    // For lab certificates, remove sensitive lab data, etc.
    delete sanitized.labTechnicianId;
    delete sanitized.internalNotes;
    delete sanitized.rawTestData;
  }
  
  // Remove common sensitive fields
  delete sanitized.internalId;
  delete sanitized.privateKey;
  delete sanitized.zkpPrivateInputs;
  
  return sanitized;
}

/**
 * Anonymize a name to protect privacy
 * 
 * @param name The full name to anonymize
 * @returns Anonymized name
 */
function anonymizeName(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    // Single name
    return `${parts[0].charAt(0)}${'*'.repeat(parts[0].length - 1)}`;
  } else {
    // First name + last name
    const firstName = `${parts[0].charAt(0)}${'*'.repeat(parts[0].length - 1)}`;
    const lastName = parts[parts.length - 1];
    const lastNameAnon = `${lastName.charAt(0)}${'*'.repeat(lastName.length - 1)}`;
    return `${firstName} ${lastNameAnon}`;
  }
}

/**
 * Log verification requests for transparency
 * 
 * @param id The ID of the verified record
 * @param trustScore The calculated trust score
 */
async function logVerificationRequest(id: string, trustScore: number) {
  try {
    await db.table('verificationLogs').add({
      recordId: id,
      timestamp: new Date(),
      trustScore,
      ipAddress: 'anonymized', // In a real system, you might store a hashed version
      userAgent: 'anonymized' // Similarly anonymized
    });
  } catch (error) {
    console.error('Error logging verification request:', error);
    // Non-critical error, so we don't throw it
  }
}