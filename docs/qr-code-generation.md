# QR Code Generation in Traceya App

## Overview

QR code generation is a planned feature for the Traceya App that will enable product batch traceability and consumer verification. This document outlines the implementation approach and use cases.

## Purpose

- **Product Traceability**: Link physical products to digital records
- **Consumer Verification**: Allow end-users to verify product authenticity
- **Supply Chain Visibility**: Track product journey from farm to consumer
- **Marketing Integration**: Provide additional product information and stories

## Implementation Approach

### 1. QR Code Data Structure

Each QR code will encode a URL with batch identifier and verification parameters:

```
https://traceya.app/verify/{batchId}/{verificationToken}
```

The data structure behind each QR code:

```typescript
interface BatchQRData {
  batchId: string;          // Unique identifier for the batch
  verificationToken: string; // Security token to prevent forgery
  timestamp: string;        // When the QR code was generated
  expiryDate?: string;      // Optional expiration date
  productType: string;      // Type of Ayurvedic product
  collectionEventIds: number[]; // References to source collection events
}
```

### 2. QR Code Generation

```typescript
import QRCode from 'qrcode';

async function generateBatchQR(batch: BatchQRData): Promise<string> {
  // Create verification URL
  const verificationUrl = `https://traceya.app/verify/${batch.batchId}/${batch.verificationToken}`;
  
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#006400',  // Dark green for farm theme
      light: '#FFFFFF'  // White background
    }
  });
  
  return qrDataUrl;
}
```

### 3. Batch Management System

```typescript
class BatchManager {
  async createBatch(params: {
    productType: string;
    collectionEventIds: number[];
    processingData?: any;
    expiryDate?: string;
  }): Promise<BatchQRData> {
    // Generate unique batch ID
    const batchId = generateUniqueId();
    
    // Create verification token
    const verificationToken = crypto.randomBytes(16).toString('hex');
    
    // Create batch record
    const batch: BatchQRData = {
      batchId,
      verificationToken,
      timestamp: new Date().toISOString(),
      expiryDate: params.expiryDate,
      productType: params.productType,
      collectionEventIds: params.collectionEventIds
    };
    
    // Store batch data
    await db.batches.add(batch);
    
    // Generate and store QR code
    const qrCode = await generateBatchQR(batch);
    await db.qrCodes.add({
      batchId,
      qrCode,
      generatedAt: new Date().toISOString()
    });
    
    return batch;
  }
}
```

### 4. Verification System

```typescript
async function verifyBatch(batchId: string, verificationToken: string): Promise<VerificationResult> {
  // Retrieve batch data
  const batch = await db.batches.get({ batchId });
  
  // Verify token
  if (!batch || batch.verificationToken !== verificationToken) {
    return {
      valid: false,
      message: 'Invalid verification code'
    };
  }
  
  // Check expiry if applicable
  if (batch.expiryDate && new Date(batch.expiryDate) < new Date()) {
    return {
      valid: true,
      expired: true,
      batch,
      message: 'Product has expired'
    };
  }
  
  // Retrieve collection events
  const collectionEvents = await db.collectionEvents
    .where('id')
    .anyOf(batch.collectionEventIds)
    .toArray();
  
  // Verify blockchain anchoring if implemented
  const blockchainVerified = await verifyBatchOnBlockchain(batch);
  
  return {
    valid: true,
    batch,
    collectionEvents,
    blockchainVerified,
    message: 'Product verified successfully'
  };
}
```

## User Interface Components

### QR Code Generation Screen

- Batch creation form with product details
- Collection event selection interface
- QR code preview with download/print options
- Batch management dashboard

### Consumer Verification Page

- Mobile-optimized verification results
- Product journey visualization
- Herb information and usage guidelines
- Authenticity certificate with blockchain verification

## Integration Points

### 1. Processing Event Integration

QR codes will be generated after processing events that transform raw herbs into finished products:

```typescript
async function completeProcessingEvent(processingEvent) {
  // Save processing event
  const savedEvent = await db.processingEvents.add(processingEvent);
  
  // Generate batch and QR code
  const batchManager = new BatchManager();
  const batch = await batchManager.createBatch({
    productType: processingEvent.productType,
    collectionEventIds: processingEvent.sourceCollectionEventIds,
    processingData: {
      processingEventId: savedEvent.id,
      processingMethod: processingEvent.method,
      processingDate: processingEvent.date
    },
    expiryDate: processingEvent.expiryDate
  });
  
  return batch;
}
```

### 2. Blockchain Anchoring Integration

QR verification will include blockchain verification status:

```typescript
async function verifyBatchOnBlockchain(batch: BatchQRData): Promise<BlockchainVerification> {
  // Get collection events
  const events = await db.collectionEvents
    .where('id')
    .anyOf(batch.collectionEventIds)
    .toArray();
  
  // Check if all events are anchored
  const verificationResults = await Promise.all(
    events.map(event => verifyCollectionEventOnBlockchain(event))
  );
  
  return {
    allEventsVerified: verificationResults.every(result => result.verified),
    eventVerifications: verificationResults,
    batchAnchored: await isBatchAnchoredDirectly(batch.batchId)
  };
}
```

### 3. Label Printing System

Integration with label printing for product packaging:

```typescript
async function generateProductLabel(batch: BatchQRData): Promise<LabelTemplate> {
  const qrCode = await db.qrCodes.get({ batchId: batch.batchId });
  
  return {
    productName: batch.productType,
    batchId: batch.batchId,
    qrCodeImage: qrCode.qrCode,
    expiryDate: batch.expiryDate,
    verificationUrl: `https://traceya.app/verify/${batch.batchId}`,
    // Additional label elements
  };
}
```

## Technical Considerations

### QR Code Durability

- High error correction level for damaged code readability
- Sufficient size for printing on small product packages
- Testing with various scanning applications and lighting conditions

### Security Measures

- Verification tokens to prevent QR code forgery
- Rate limiting on verification API to prevent scraping
- Expiration dates for time-sensitive products
- Blockchain verification for highest security level

### Offline Verification

- Progressive Web App for verification in areas with limited connectivity
- Basic verification possible without internet connection
- Full verification with blockchain when online

## Implementation Phases

### Phase 1: Basic QR Generation

- Implement QR code generation library
- Create batch management system
- Develop basic verification page

### Phase 2: Enhanced Verification

- Add product journey visualization
- Implement expiration checking
- Create printable verification certificates

### Phase 3: Advanced Features

- Blockchain verification integration
- Analytics on QR code scans
- Multi-language verification page

## Benefits for Stakeholders

### Producers

- Anti-counterfeiting protection
- Brand value enhancement
- Consumer engagement opportunities

### Retailers

- Product authenticity verification
- Enhanced product information for customers
- Reduced risk of counterfeit products

### Consumers

- Product authenticity verification
- Access to sourcing and processing information
- Connection to the farmers who grew the herbs

## Conclusion

QR code generation will provide a critical link between physical Ayurvedic products and their digital traceability records. This feature will enhance consumer trust, provide anti-counterfeiting protection, and create new opportunities for storytelling and brand engagement.