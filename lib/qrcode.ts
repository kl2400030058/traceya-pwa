import { QRCodeData, BatchSummary } from './types';
import { db, Batch } from './db';

/**
 * Generates a unique verification token for QR codes
 */
export const generateVerificationToken = (): string => {
  // Generate a random string of 16 characters
  return Math.random().toString(36).substring(2, 10) + 
         Math.random().toString(36).substring(2, 10);
};

/**
 * Generates a QR code data object for a batch
 */
export const generateQRCodeData = async (batchId: string): Promise<QRCodeData> => {
  // Get the batch from the database
  const batches = await db.batches.where('batchId').equals(batchId).toArray();
  
  if (batches.length === 0) {
    throw new Error(`Batch with ID ${batchId} not found`);
  }
  
  const batch = batches[0];
  
  // Create a verification token
  const verificationToken = generateVerificationToken();
  
  // Create the QR code data
  const qrCodeData: QRCodeData = {
    batchId: batch.batchId,
    verificationUrl: `https://traceya.app/verify/${batch.batchId}?token=${verificationToken}`,
    createdAt: new Date().toISOString(),
    expiresAt: batch.expiryDate,
    verificationToken
  };
  
  // Update the batch with the QR code data
  await db.batches.update(batch.id!, {
    qrCode: qrCodeData.verificationUrl
  });
  
  return qrCodeData;
};

/**
 * Generates a QR code SVG string from QR code data or batch ID
 */
export const generateQRCodeSVG = async (qrCodeDataOrBatchId: QRCodeData | string): Promise<string> => {
  // This is a placeholder - in a real implementation, we would use a library like qrcode
  // to generate an actual QR code SVG
  const batchId = typeof qrCodeDataOrBatchId === 'string' 
    ? qrCodeDataOrBatchId 
    : qrCodeDataOrBatchId.batchId;
    
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="white" />
    <text x="10" y="50" font-family="sans-serif" font-size="10">${batchId}</text>
  </svg>`;
};

/**
 * Verifies a QR code token
 */
export const verifyQRCode = async (batchId: string, token: string): Promise<boolean> => {
  // Get the batch from the database
  const batches = await db.batches.where('batchId').equals(batchId).toArray();
  
  if (batches.length === 0) {
    return false;
  }
  
  const batch = batches[0];
  
  // Check if the QR code URL contains the token
  if (typeof batch.qrCode === 'string') {
    return batch.qrCode.includes(token) || false;
  } else if (batch.qrCode) {
    return batch.qrCode.verificationToken === token;
  }
  return false;
};

/**
 * Gets a summary of a batch for display
 */
export const getBatchSummary = async (batchId: string): Promise<BatchSummary | null> => {
  // Get the batch from the database
  const batches = await db.batches.where('batchId').equals(batchId).toArray();
  
  if (batches.length === 0) {
    return null;
  }
  
  const batch = batches[0];
  
  // Create a summary
  const summary: BatchSummary = {
    batchId: batch.batchId,
    name: batch.name,
    species: batch.species,
    collectionCount: batch.collectionEventIds.length,
    creationDate: batch.creationDate,
    status: batch.status,
    qrCodeUrl: typeof batch.qrCode === 'string' ? batch.qrCode : batch.qrCode?.verificationUrl
  };
  
  return summary;
};

/**
 * Gets all batches for a user
 */
export const getUserBatches = async (userId: string): Promise<BatchSummary[]> => {
  // Get all batches created by the user
  const batches = await db.batches.where('createdBy').equals(userId).toArray();
  
  // Convert to summaries
  return batches.map(batch => ({
    batchId: batch.batchId,
    name: batch.name,
    species: batch.species,
    collectionCount: batch.collectionEventIds.length,
    creationDate: batch.creationDate,
    status: batch.status,
    qrCodeUrl: typeof batch.qrCode === 'string' ? batch.qrCode : batch.qrCode?.verificationUrl
  }));
};