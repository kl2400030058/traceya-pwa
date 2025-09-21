# Offline-First Approach in Traceya App

## Overview

Traceya App is designed with an offline-first architecture to ensure functionality in rural areas with limited or intermittent internet connectivity. This document outlines the implementation details of this approach.

## Core Principles

1. **Local-First Data Storage**: All data is stored locally before any sync attempt
2. **Graceful Degradation**: Features work with reduced functionality when offline
3. **Background Synchronization**: Data syncs automatically when connectivity returns
4. **Multiple Sync Options**: Web API, SMS fallback, and manual export
5. **Conflict Resolution**: Clear strategies for handling data conflicts

## Implementation Details

### Local Storage with IndexedDB

The app uses Dexie.js, a wrapper for IndexedDB, to provide a robust local database:

```typescript
// lib/db.ts (simplified)
import Dexie from 'dexie';

export interface CollectionEvent {
  id?: number;
  farmerId: string;
  species: string;
  location: { latitude: number; longitude: number; accuracy: number };
  timestamp: string;
  photos: string[];
  photoHashes: string[];
  moisturePercentage?: number;
  notes?: string;
  synced: boolean;
  syncTimestamp?: string;
}

export class TraceyaDB extends Dexie {
  collectionEvents: Dexie.Table<CollectionEvent, number>;
  syncQueue: Dexie.Table<SyncQueue, number>;
  appSettings: Dexie.Table<AppSettings, number>;

  constructor() {
    super('TraceyaDB');
    this.version(1).stores({
      collectionEvents: '++id, farmerId, species, timestamp, synced',
      syncQueue: '++id, type, timestamp',
      appSettings: '++id, key, value'
    });
  }
}

export const db = new TraceyaDB();
```

### Sync Queue Management

A dedicated sync queue tracks pending operations:

```typescript
export interface SyncQueue {
  id?: number;
  type: 'collection_event' | 'registration';
  dataId: number;
  timestamp: string;
  attempts: number;
  lastAttempt?: string;
  error?: string;
}
```

### Sync Strategies

#### 1. Online API Sync

When connectivity is available, data is synced to the backend:

```typescript
async function syncCollectionEvents() {
  const unsynced = await db.collectionEvents
    .where('synced')
    .equals(false)
    .toArray();

  for (const event of unsynced) {
    try {
      const response = await fetch('/api/collection-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        await db.collectionEvents.update(event.id!, {
          synced: true,
          syncTimestamp: new Date().toISOString()
        });
      } else {
        // Add to sync queue for retry
        await addToSyncQueue('collection_event', event.id!);
      }
    } catch (error) {
      // Handle network errors
      await addToSyncQueue('collection_event', event.id!);
    }
  }
}
```

#### 2. SMS Fallback

For critical data in low-connectivity areas:

```typescript
// lib/sms.ts (simplified)
export class SMSManager {
  static instance = new SMSManager();
  private gatewayNumber = process.env.SMS_GATEWAY_NUMBER || '+1234567890';

  formatCollectionEventForSMS(event: CollectionEvent): string {
    // Format: FARMID|SPECIES|LAT,LON,ACC|TIMESTAMP|MOISTURE|PHOTOHASH
    return [
      event.farmerId,
      event.species,
      `${event.location.latitude},${event.location.longitude},${event.location.accuracy}`,
      event.timestamp,
      event.moisturePercentage || '',
      event.photoHashes.join(',')
    ].join('|');
  }

  async sendCollectionEventSMS(event: CollectionEvent): Promise<boolean> {
    const smsText = this.formatCollectionEventForSMS(event);
    // Open SMS app with pre-filled message
    window.open(`sms:${this.gatewayNumber}?body=${encodeURIComponent(smsText)}`);
    return true; // Assume success as we can't track if user actually sent the SMS
  }
}
```

### Service Worker Integration

A service worker enables offline functionality and background sync:

```typescript
// public/service-worker.js (simplified)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-collection-events') {
    event.waitUntil(syncCollectionEvents());
  }
});

self.addEventListener('fetch', (event) => {
  // Cache-first strategy for app resources
  // Network-first strategy for API calls
});
```

### User Interface Considerations

1. **Sync Status Indicators**: Clear visual feedback on sync status
2. **Offline Mode Banner**: Notification when working offline
3. **Manual Sync Controls**: Allow user to trigger sync manually
4. **Conflict Resolution UI**: Interface for resolving data conflicts

## Conflict Resolution Strategy

### Last-Write-Wins

For simple conflicts, the most recent edit takes precedence:

```typescript
async function resolveConflict(localEvent, serverEvent) {
  if (new Date(localEvent.updatedAt) > new Date(serverEvent.updatedAt)) {
    return localEvent; // Local changes win
  }
  return serverEvent; // Server changes win
}
```

### Manual Resolution

For complex conflicts, user intervention may be required:

```typescript
async function promptUserForResolution(localEvent, serverEvent) {
  // Display differences and let user choose
  // or merge specific fields
}
```

## Testing Offline Functionality

1. **Airplane Mode Testing**: Test with device connectivity disabled
2. **Throttled Network**: Test with simulated poor connectivity
3. **Service Worker Tests**: Verify caching and background sync
4. **Database Persistence**: Verify data survives app restarts

## Future Enhancements

1. **Selective Sync**: Allow users to prioritize which data syncs first
2. **Compression**: Reduce data size for low-bandwidth scenarios
3. **Peer-to-Peer Sync**: Direct device-to-device sync in the field
4. **Blockchain Anchoring**: Immutable verification of offline-collected data

## Best Practices for Developers

1. Always store data locally first before any sync attempt
2. Implement proper error handling for all network operations
3. Provide clear feedback to users about sync status
4. Test thoroughly in offline and poor connectivity scenarios
5. Consider data size limitations for SMS fallback