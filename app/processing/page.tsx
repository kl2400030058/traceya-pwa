'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProcessingSteps } from '@/components/processing-steps';
import { NotificationsPanel } from '@/components/notifications-panel';
import { AuthGuard } from '@/components/auth-guard';
import { db } from '@/lib/db';
import { ProcessingDetails, Attachment, Batch, ProcessingStep } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';
import { AlertTriangle, Search, Database } from 'lucide-react';

export default function ProcessingPage() {
  const router = useRouter();
  
  // State for user info
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  
  // State for batch search and selection
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
  // State for existing processing steps
  const [existingSteps, setExistingSteps] = useState<ProcessingDetails | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  
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
          setUserId(settings.processorId || '');
          
          // Redirect if not a processor or admin
          if (settings.userRole !== 'processor' && settings.userRole !== 'admin') {
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
            createdAt: formatTimestamp(new Date()),
            createdBy: 'user1',
            timestamp: Date.now(),
            status: 'completed' as "processing" | "testing" | "completed" | "rejected",
            collectionEventIds: ['event1', 'event2'],
            labEventIds: ['lab1'],
            processingStepIds: [],
            species: ['cannabis'],
            creationDate: formatTimestamp(new Date())
          },
          {
            batchId: 'BATCH-5678',
            name: 'Test Batch 2',
            createdAt: formatTimestamp(new Date(Date.now() - 86400000)),
            createdBy: 'user2',
            timestamp: Date.now() - 86400000,
            status: 'testing' as "processing" | "testing" | "completed" | "rejected",
            collectionEventIds: ['event3', 'event4'],
            labEventIds: ['lab2'],
            processingStepIds: ['proc1'],
            species: ['cannabis'],
            creationDate: formatTimestamp(new Date(Date.now() - 86400000))
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
  const handleSelectBatch = async (batch: Batch) => {
    setSelectedBatch(batch);
    setError('');
    
    // Load existing processing steps if any
    if (batch.processingStepIds && batch.processingStepIds.length > 0) {
      try {
        // In a real implementation, these would be loaded from the database
        // For now, we'll use placeholder data
        const mockProcessingStep = {
          id: 'proc1',
          batchId: batch.batchId,
          steps: [
            {
              type: 'drying',
              timestamp: formatTimestamp(new Date(Date.now() - 86400000)),
              details: 'Initial drying process',
              conditions: {
                temperature: 35,
                humidity: 40,
                duration: 24
              }
            }
          ],
          lastUpdated: formatTimestamp(new Date(Date.now() - 86400000))
        };
        
        const mockAttachments: Attachment[] = [];
        
        setExistingSteps(mockProcessingStep);
        setExistingAttachments(mockAttachments);
      } catch (err) {
        console.error('Error loading existing processing steps:', err);
        setError('Failed to load existing processing steps');
      }
    } else {
      setExistingSteps(null);
      setExistingAttachments([]);
    }
  };
  
  // Handle saving processing steps
  const handleSaveProcessingSteps = async (data: {
    processingDetails: ProcessingDetails;
    attachments: Attachment[];
    notes: string;
  }) => {
    if (!selectedBatch) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create a new processing step
      const processingStep: ProcessingStep = {
        stepId: `proc-${Date.now()}`,
        batchId: selectedBatch.batchId,
        processorId: userId,
        type: "other",
        timestamp: formatTimestamp(new Date()),
        details: {
          notes: data.notes
        },
        photos: data.attachments.map(a => ({
          blobUrl: a.blobUrl,
          hash: a.hash,
          timestamp: formatTimestamp(new Date())
        })),
        status: 'pending' as "pending" | "synced" | "failed" | "uploading",
        onChainTx: null,
        lastError: null,
        createdAt: formatTimestamp(new Date()),
        updatedAt: formatTimestamp(new Date())
      };
      
      // Save to IndexedDB
      await db.processingSteps.add(processingStep);
      
      // Update the batch with the new processing step ID
      const updatedBatch = {
        ...selectedBatch,
        processingStepIds: [...(selectedBatch.processingStepIds || []), processingStep.stepId],
        status: 'processing' as "processing" | "testing" | "completed" | "rejected",
        onChainTx: selectedBatch.onChainTx || null,
        updatedAt: new Date().toISOString()
      };
      
      await db.batches.put(updatedBatch);
      
      // Create notifications for relevant users
      await createNotification({
        type: 'info',
        title: 'Processing Step Completed',
        message: `New processing step added for Batch ${selectedBatch.batchId}`,
        userId: selectedBatch.createdBy,
        userType: 'processor',
        relatedTo: {
          type: 'batch',
          id: selectedBatch.batchId
        }
      });
      
      // Check for threshold alerts
      const steps = data.processingDetails?.steps || [];
      const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
      if (lastStep && lastStep.conditions?.temperature && lastStep.conditions.temperature > 40) {
        await createNotification({
          type: 'warning',
          title: 'Temperature Alert',
          message: `Temperature (${lastStep.conditions.temperature}°C) exceeds threshold for Batch ${selectedBatch.batchId}`,
          userId,
          userType: 'processor',
          relatedTo: {
            type: 'batch',
            id: selectedBatch.batchId
          }
        });
      }
      
      // Add to sync queue if online
      if (isOnline) {
        await db.syncQueue.add({
          action: 'create',
          eventId: processingStep.stepId,
          data: processingStep,
          retryCount: 0,
          lastAttempt: null,
          createdAt: new Date().toISOString()
        });
      }
      
      // Reset selected batch
      setSelectedBatch(null);
      setExistingSteps(null);
      setExistingAttachments([]);
      
      // Show success message
      alert(`Processing steps saved for Batch ${selectedBatch.batchId}`);
    } catch (err) {
      console.error('Error saving processing steps:', err);
      setError('Failed to save processing steps. Please try again.');
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
          <h1 className="text-2xl font-bold">Processing Management</h1>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        <Tabs defaultValue="processing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processing">Processing Steps</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="processing" className="space-y-6">
            {selectedBatch ? (
              <ProcessingSteps
                batchId={selectedBatch.batchId}
                species="Sample Species" // In a real app, get this from collection events
                onSave={handleSaveProcessingSteps}
                isLoading={isLoading}
                existingSteps={existingSteps || undefined}
                existingAttachments={existingAttachments}
                existingNotes=""
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
                                {batch.timestamp ? formatTimestamp(new Date(batch.timestamp)) : 'No timestamp'}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              <p>Collection Events: {batch.collectionEventIds.length}</p>
                              <p>Status: {batch.status}</p>
                              <p>Processing Steps: {batch.processingStepIds?.length || 0}</p>
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
                  onClick={() => {
                    setSelectedBatch(null);
                    setExistingSteps(null);
                    setExistingAttachments([]);
                  }}
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