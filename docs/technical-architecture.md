# Traceya App - Technical Architecture

## System Overview

Traceya is built as a Progressive Web Application (PWA) with an offline-first approach, designed to function in areas with limited connectivity while maintaining data integrity and traceability.

## Architecture Layers

### Frontend Layer

- **Framework**: Next.js with App Router for server-side rendering and routing
- **UI Components**: React functional components with TypeScript
- **State Management**: React Context API and local component state
- **Styling**: Tailwind CSS with custom theme configuration
- **Component Library**: ShadcnUI for consistent design patterns

### Data Layer

- **Offline Storage**: IndexedDB via Dexie.js
- **Data Models**:
  - `CollectionEvent`: Stores herb collection data including location, photos, and metadata
  - `SyncQueue`: Manages pending sync operations
  - `AppSettings`: User preferences and application configuration
- **Sync Mechanisms**:
  - REST API for online synchronization
  - SMS fallback for critical data in low-connectivity areas

### Authentication Layer

- **Authentication Methods**:
  - Farmer ID + OTP
  - Phone number verification
  - Google OAuth integration
- **Session Management**: JWT tokens with secure storage
- **Offline Authentication**: Local verification with pending server validation

## Key Components

### Location Capture (`components/location-capture.tsx`)

- Interfaces with device Geolocation API
- Provides accuracy metrics and visual indicators
- Handles permission requests and error states
- Supports manual and automatic capture modes

### Photo Capture (`components/photo-capture.tsx`)

- Camera integration for live photo capture
- Multiple photo support with preview and management
- Automatic GPS tagging of photos
- Hash generation for verification

### Offline Database (`lib/db.ts`)

- Dexie.js implementation of IndexedDB
- Schema definitions for all data models
- CRUD operations for collection events
- Queue management for pending sync operations

### SMS Manager (`lib/sms.ts`)

- Formats collection event data for SMS transmission
- Handles SMS gateway integration
- Parses incoming SMS data
- Provides fallback for areas without internet connectivity

## Data Flow

1. **Collection Event Creation**:
   - User captures location and photos
   - Metadata is added (species, moisture, notes)
   - Data is validated client-side
   - Event is stored in local IndexedDB

2. **Synchronization**:
   - When online, pending events are synced to server
   - Sync status is tracked and displayed to user
   - Failed syncs are queued for retry

3. **SMS Fallback**:
   - If sync fails repeatedly, SMS option is presented
   - Critical data is formatted for SMS transmission
   - Confirmation is received via SMS

## Security Considerations

- **Data Integrity**: Hash verification for photos and collection events
- **Authentication**: Secure token storage and validation
- **Offline Security**: Local encryption of sensitive data
- **Future Blockchain**: Immutable verification via distributed ledger

## Performance Optimizations

- **Lazy Loading**: Components and images loaded on demand
- **Service Worker**: Caching strategies for offline functionality
- **Image Compression**: Automatic resizing before storage
- **Selective Sync**: Prioritization of critical data during limited connectivity

## Future Architecture Extensions

### Blockchain Integration

- **Smart Contracts**: For verification of collection events
- **Merkle Trees**: Efficient batch verification of multiple events
- **Explorer Interface**: For traceability and verification

### QR Code System

- **Generation Service**: Creates unique QR codes for batches
- **Verification API**: Validates authenticity of products
- **Consumer Interface**: Mobile-friendly verification page

## Development Environment

- **Local Development**: Next.js development server
- **Testing**: Jest for unit tests, Cypress for E2E testing
- **CI/CD**: Automated testing and deployment pipeline
- **Containerization**: Docker for consistent environments

## Deployment Architecture

- **Hosting**: Vercel or similar JAMstack platform
- **API Backend**: Serverless functions or dedicated API server
- **Database**: Cloud-hosted database with regional replication
- **CDN**: Content delivery network for static assets

## Monitoring and Analytics

- **Error Tracking**: Client-side error reporting
- **Usage Analytics**: Anonymous usage patterns and feature adoption
- **Performance Metrics**: Core Web Vitals monitoring
- **Sync Success Rate**: Tracking of successful vs. failed synchronizations