'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BatchManagement } from '@/components/batch-management';
import { QRCodeScanner } from '@/components/qr-code-scanner';
import { NotificationsPanel } from '@/components/notifications-panel';
import { AuthGuard } from '@/components/auth-guard';
import { db } from '@/lib/db';
import { createBatch } from '@/lib/batch';
import { AlertTriangle } from 'lucide-react';

export default function BatchesPage() {
  const router = useRouter();
  
  // State for user info
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // Load user info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const settings = await db.settings.get('settings');
        if (settings) {
          setUserRole(settings.userRole || '');
          setUserId(settings.farmerId || settings.labUserId || settings.processorId || '');
        }
      } catch (err) {
        console.error('Error loading user info:', err);
        setError('Failed to load user information');
      }
    };
    
    loadUserInfo();
  }, []);
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Handle batch creation
  const handleCreateBatch = async (collectionEventIds: string[]) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Create a new batch
      const batch = await createBatch({
        name: `Batch ${new Date().toLocaleDateString()}`,
        collectionEventIds,
        createdBy: userId
      });
      
      const batchId = batch.batchId;
      
      // Add to sync queue if online
      if (isOnline) {
        await db.syncQueue.add({
          eventId: batchId,
          action: 'create',
          data: { batchId, collectionEventIds },
          retryCount: 0,
          lastAttempt: null,
          createdAt: new Date().toISOString()
        });
      }
      
      return batchId;
    } catch (err) {
      console.error('Error creating batch:', err);
      setError('Failed to create batch. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle batch view
  const handleViewBatch = (batchId: string) => {
    router.push(`/batches/${batchId}`);
  };
  
  // Handle QR code scan
  const handleQRScan = async (batchId: string, isValid: boolean) => {
    if (isValid) {
      router.push(`/batches/${batchId}`);
    } else {
      setError(`Invalid QR code for batch ${batchId}`);
    }
  };
  
  // Handle notification actions
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const notification = await db.notifications.get(notificationId);
      if (notification) {
        await db.notifications.update(notificationId, { isRead: true });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await db.notifications.delete(notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };
  
  const handleRefreshNotifications = async () => {
    // In a real app, this would refresh notifications from the server
    // For now, we'll just log a message
    console.log('Refreshing notifications...');
  };
  
  return (
    <AuthGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Batch Management</h1>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        <Tabs defaultValue="batches" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="batches">
            <BatchManagement
              userRole={userRole}
              onCreateBatch={handleCreateBatch}
              onViewBatch={handleViewBatch}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="scan">
            <Card className="p-6">
              <QRCodeScanner onScanSuccess={handleQRScan} />
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationsPanel
              userRole={userRole}
              userId={userId}
              onMarkAsRead={handleMarkAsRead}
              onDeleteNotification={handleDeleteNotification}
              onRefresh={handleRefreshNotifications}
            />
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </AuthGuard>
  );
}