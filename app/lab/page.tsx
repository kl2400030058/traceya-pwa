'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LabEventCapture } from '@/components/lab-event-capture';
import { NotificationsPanel } from '@/components/notifications-panel';
import { AuthGuard } from '@/components/auth-guard';
import { db } from '@/lib/db';
import { LabTestResult, Attachment, Batch } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';
import { AlertTriangle, Search, Database } from 'lucide-react';

export default function LabPage() {
  const router = useRouter();
  
  // State for user info
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  
  // State for batch search and selection
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // Load user info and check authorization
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const settings = await db.settings.get('settings');
        if (settings) {
          setUserRole(settings.userRole || '');
          setUserId(settings.labUserId || '');
          
          // Redirect if not a lab user or admin
          if (settings.userRole !== 'lab' && settings.userRole !== 'admin') {
            router.push('/dashboard');
          }
        }
      } catch (err) {
        console.error('Error loading user info:', err);
        setError('Failed to load user information');
      }
    };
    
    loadUserInfo();
  }, [router]);
  
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
  
  // Load batches
  useEffect(() => {
    const loadBatches = async () => {
      try {
        // In a real implementation, these would be loaded from the database
        // For now, we'll use placeholder data
        const mockBatches: Batch[] = [
          {
            batchId: 'BATCH-1234',
            name: 'Test Batch 1',
            createdAt: new Date().toISOString(),
            createdBy: 'user1',
            status: 'processing' as 'processing' | 'testing' | 'completed' | 'rejected',
            collectionEventIds: ['event1', 'event2'],
            labEventIds: [],
            processingStepIds: [],
            species: ['Cannabis'],
            creationDate: new Date().toISOString(),
            onChainTx: undefined
          },
          {
            batchId: 'BATCH-5678',
            name: 'Test Batch 2',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            createdBy: 'user2',
            status: 'processing' as 'processing' | 'testing' | 'completed' | 'rejected',
            collectionEventIds: ['event3', 'event4'],
            labEventIds: ['lab1'],
            processingStepIds: [],
            species: ['Hemp'],
            creationDate: new Date(Date.now() - 86400000).toISOString(),
            onChainTx: undefined
          }
        ];
        
        setBatches(mockBatches);
      } catch (err) {
        console.error('Error loading batches:', err);
        setError('Failed to load batches');
      }
    };
    
    loadBatches();
  }, []);
  
  // Filter batches based on search term
  const filteredBatches = batches.filter(batch => {
    const searchLower = searchTerm.toLowerCase();
    return batch.batchId.toLowerCase().includes(searchLower);
  });
  
  // Handle batch selection
  const handleSelectBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setError('');
  };
  
  // Handle saving lab results
  const handleSaveLabResults = async (data: {
    testResults: LabTestResult;
    attachments: Attachment[];
    notes: string;
  }) => {
    if (!selectedBatch) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create a new lab event
      const eventId = `LE-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
      const currentTime = new Date();
      const labEvent = {
        eventId,
        labUserId: userId,
        batchId: selectedBatch.batchId,
        species: selectedBatch.species?.[0] || 'Unknown',
        timestamp: formatTimestamp(currentTime),
        testResults: data.testResults,
        attachments: data.attachments,
        notes: data.notes,
        status: 'pending' as const,
        onChainTx: null,
        lastError: null,
        createdAt: formatTimestamp(currentTime),
        updatedAt: formatTimestamp(currentTime)
      };
      
      // Save to IndexedDB
      await db.labEvents.add(labEvent);
      
      // Update the batch with the new lab event ID
      const updateTime = new Date();
      const updatedBatch = {
        ...selectedBatch,
        labEventIds: [...(selectedBatch.labEventIds || []), labEvent.eventId],
        status: 'testing' as 'processing' | 'testing' | 'completed' | 'rejected',
        onChainTx: selectedBatch.onChainTx || null,
        updatedAt: formatTimestamp(updateTime)
      };
      
      await db.batches.put(updatedBatch);
      
      // Create notifications for relevant users
      await createNotification({
        type: 'info',
        title: 'Lab Results Available',
        message: `New lab results are available for Batch ${selectedBatch.batchId}`,
        relatedTo: {
          type: 'batch',
          id: selectedBatch.batchId
        },
        userType: 'farmer',
        userId: selectedBatch.createdBy // Notify the batch creator
      });
      
      // Check for threshold alerts
      if (data.testResults.moisturePct > 15) {
        await createNotification({
          type: 'warning',
          title: 'Moisture Level Alert',
          message: `Moisture levels (${data.testResults.moisturePct}%) exceed threshold for Batch ${selectedBatch.batchId}`,
          relatedTo: {
            type: 'batch',
            id: selectedBatch.batchId
          },
          userType: 'lab',
          userId // Notify the lab user
        });
      }
      
      if (data.testResults.pesticideLevels && data.testResults.pesticideLevels > 0.5) {
        await createNotification({
          type: 'warning',
          title: 'Pesticide Level Alert',
          message: `Pesticide levels (${data.testResults.pesticideLevels} ppm) exceed threshold for Batch ${selectedBatch.batchId}`,
          relatedTo: {
            type: 'batch',
            id: selectedBatch.batchId
          },
          userType: 'lab',
          userId // Notify the lab user
        });
      }
      
      // Add to sync queue if online
      if (isOnline) {
        await db.syncQueue.add({
          eventId: labEvent.eventId,
          action: 'create',
          data: labEvent,
          retryCount: 0,
          lastAttempt: null,
          createdAt: new Date().toISOString()
        });
      }
      
      // Reset selected batch
      setSelectedBatch(null);
      
      // Show success message
      alert(`Lab results saved for Batch ${selectedBatch.batchId}`);
    } catch (err) {
      console.error('Error saving lab results:', err);
      setError('Failed to save lab results. Please try again.');
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-bold">Lab Testing</h1>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        <Tabs defaultValue="lab-testing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lab-testing">Lab Testing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lab-testing" className="space-y-6">
            {selectedBatch ? (
              <LabEventCapture
                batchId={selectedBatch.batchId}
                species="Sample Species" // In a real app, get this from collection events
                onSave={handleSaveLabResults}
                isLoading={isLoading}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select a Batch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search batches by ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow"
                      />
                    </div>
                    
                    {filteredBatches.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-500">No batches found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredBatches.map((batch) => (
                          <div
                            key={batch.batchId}
                            className="border p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleSelectBatch(batch)}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{batch.batchId}</h3>
                              <span className="text-sm text-gray-500">
                                {batch.timestamp ? formatTimestamp(new Date(batch.timestamp)) : formatTimestamp(new Date())}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              <p>Collection Events: {batch.collectionEventIds.length}</p>
                              <p>Status: {batch.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {selectedBatch && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBatch(null)}
                >
                  Cancel
                </Button>
              </div>
            )}
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
      </div>
    </AuthGuard>
  );
}