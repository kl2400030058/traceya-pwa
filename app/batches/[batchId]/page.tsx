'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuthGuard } from '@/components/auth-guard';
import { db } from '@/lib/db';
import { getBatchWithDetails } from '@/lib/batch';
import { generateQRCodeSVG, getBatchSummary, generateVerificationToken } from '@/lib/qrcode';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Download, ArrowLeft, Leaf, Beaker, Cog } from 'lucide-react';
import { BatchSummary, QRCodeData } from '@/lib/types';

export default function BatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params?.batchId as string;
  
  // State for batch data
  const [batch, setBatch] = useState<any>(null);
  const [collectionEvents, setCollectionEvents] = useState<any[]>([]);
  const [labEvents, setLabEvents] = useState<any[]>([]);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null);
  
  // State for QR code
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  
  // State for user info
  const [userRole, setUserRole] = useState<string>('');
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // Load batch data
  useEffect(() => {
    const loadBatchData = async () => {
      if (!batchId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        // Load user role
        const settings = await db.settings.get('settings');
        if (settings) {
          setUserRole(settings.userRole || '');
        }
        
        // Load batch with related data
        const batchData = await getBatchWithDetails(batchId);
        if (!batchData) {
          setError('Batch not found');
          setIsLoading(false);
          return;
        }
        
        setBatch(batchData.batch);
        setCollectionEvents(batchData.collectionEvents || []);
        setLabEvents(batchData.labEvents || []);
        setProcessingSteps(batchData.processingSteps || []);
        
        // Generate batch summary
        const summary = await getBatchSummary(batchId);
        setBatchSummary(summary);
        
        // Generate QR code data and SVG
        const qrData: QRCodeData = {
          batchId,
          verificationUrl: '', // Using empty string as placeholder
          verificationToken: generateVerificationToken(), // Generate a new token
          createdAt: batchData.batch.createdAt,
          expiresAt: batchData.batch.expiryDate
        };
        
        setQrCodeData(qrData);
        const svg = await generateQRCodeSVG(qrData);
        setQrCodeSvg(svg);
        
      } catch (err) {
        console.error('Error loading batch data:', err);
        setError('Failed to load batch data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBatchData();
  }, [batchId]);
  
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
  
  // Handle download QR code
  const handleDownloadQR = () => {
    if (!qrCodeSvg) return;
    
    const blob = new Blob([qrCodeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batchId}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle status update
  const handleUpdateStatus = async (status: 'processing' | 'testing' | 'completed' | 'rejected') => {
    if (!batch) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Update batch status in the database
      await db.batches.where('batchId').equals(batchId).modify({
        status,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setBatch({ ...batch, status });
      
      // Add to sync queue if online
      if (isOnline) {
        await db.syncQueue.add({
          eventId: batchId,
          action: 'update',
          data: { batchId, status },
          retryCount: 0,
          lastAttempt: null,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error updating batch status:', err);
      setError('Failed to update batch status');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle back button
  const handleBack = () => {
    router.push('/batches');
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading batch data...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </AuthGuard>
    );
  }
  
  // Render batch not found
  if (!batch) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Alert>
            <AlertDescription>Batch not found</AlertDescription>
          </Alert>
        </div>
      </AuthGuard>
    );
  }
  
  return (
    <AuthGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Batch {batchId}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Batch Summary Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Batch Summary</CardTitle>
              <CardDescription>
                Created on {formatDate(batch.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge variant={batch.status === 'completed' ? 'default' : 
                    batch.status === 'processing' ? 'secondary' : 'outline'}>
                    {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Collection Events:</span>
                  <span>{collectionEvents.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Species:</span>
                  <span>{batchSummary?.species.join(', ') || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Lab Tests:</span>
                  <span>{labEvents.length > 0 ? 'Completed' : 'Pending'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Processing Steps:</span>
                  <span>{processingSteps.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Created By:</span>
                  <span>{batch.createdBy || 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              {userRole === 'admin' && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateStatus('processing')}
                    disabled={batch.status === 'processing'}
                  >
                    Mark as Processing
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={batch.status === 'completed'}
                  >
                    Mark as Completed
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
          
          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>
                Scan to verify batch authenticity
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {qrCodeSvg ? (
                <div 
                  className="w-full max-w-[200px] h-auto" 
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }} 
                />
              ) : (
                <div className="w-full max-w-[200px] h-[200px] bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">QR Code not available</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={handleDownloadQR}
                disabled={!qrCodeSvg}
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collection">
              <Leaf className="h-4 w-4 mr-2" />
              Collection Events
            </TabsTrigger>
            <TabsTrigger value="lab">
              <Beaker className="h-4 w-4 mr-2" />
              Lab Results
            </TabsTrigger>
            <TabsTrigger value="processing">
              <Cog className="h-4 w-4 mr-2" />
              Processing Steps
            </TabsTrigger>
          </TabsList>
          
          {/* Collection Events Tab */}
          <TabsContent value="collection">
            <Card>
              <CardHeader>
                <CardTitle>Collection Events</CardTitle>
                <CardDescription>
                  {collectionEvents.length} events in this batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {collectionEvents.length > 0 ? (
                      collectionEvents.map((event, index) => (
                        <div key={event.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">Event {index + 1}</h3>
                            <Badge variant="outline">{event.id.substring(0, 8)}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Date: </span>
                              {formatDate(event.timestamp)}
                            </div>
                            <div>
                              <span className="font-medium">Species: </span>
                              {event.species || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Location: </span>
                              {event.location?.latitude && event.location?.longitude ? 
                                `${event.location.latitude.toFixed(4)}, ${event.location.longitude.toFixed(4)}` : 
                                'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Collector: </span>
                              {event.farmerId || 'Unknown'}
                            </div>
                          </div>
                          {index < collectionEvents.length - 1 && <Separator />}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No collection events found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Lab Results Tab */}
          <TabsContent value="lab">
            <Card>
              <CardHeader>
                <CardTitle>Lab Results</CardTitle>
                <CardDescription>
                  {labEvents.length} lab tests performed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {labEvents.length > 0 ? (
                      labEvents.map((event, index) => (
                        <div key={event.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">Test {index + 1}</h3>
                            <Badge variant="outline">{formatDate(event.timestamp)}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {event.testResults?.moisturePercentage !== undefined && (
                              <div>
                                <span className="font-medium">Moisture: </span>
                                {event.testResults.moisturePercentage}%
                              </div>
                            )}
                            {event.testResults?.pesticideLevels !== undefined && (
                              <div>
                                <span className="font-medium">Pesticide: </span>
                                {event.testResults.pesticideLevels} ppm
                              </div>
                            )}
                            {event.testResults?.dnaBarcodingResults && (
                              <div className="col-span-2">
                                <span className="font-medium">DNA Barcoding: </span>
                                {event.testResults.dnaBarcodingResults}
                              </div>
                            )}
                            {event.testResults?.otherTests && Object.entries(event.testResults.otherTests).map(([key, value]) => (
                              <div key={key} className="col-span-2">
                                <span className="font-medium">{key}: </span>
                                {String(value)}
                              </div>
                            ))}
                            <div className="col-span-2">
                              <span className="font-medium">Lab User: </span>
                              {event.labUserId || 'Unknown'}
                            </div>
                          </div>
                          {event.attachments && event.attachments.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-sm font-medium mb-1">Attachments:</h4>
                              <div className="flex flex-wrap gap-2">
                                {event.attachments.map((attachment: any, i: number) => (
                                  <Badge key={i} variant="secondary">
                                    {attachment.name || `Attachment ${i + 1}`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {index < labEvents.length - 1 && <Separator />}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No lab results available
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Processing Steps Tab */}
          <TabsContent value="processing">
            <Card>
              <CardHeader>
                <CardTitle>Processing Steps</CardTitle>
                <CardDescription>
                  {processingSteps.length} processing steps recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {processingSteps.length > 0 ? (
                      processingSteps.map((step, index) => (
                        <div key={step.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium capitalize">{step.type} Step</h3>
                            <Badge variant="outline">{formatDate(step.timestamp)}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {step.details?.temperature !== undefined && (
                              <div>
                                <span className="font-medium">Temperature: </span>
                                {step.details.temperature}°C
                              </div>
                            )}
                            {step.details?.humidity !== undefined && (
                              <div>
                                <span className="font-medium">Humidity: </span>
                                {step.details.humidity}%
                              </div>
                            )}
                            {step.details?.duration !== undefined && (
                              <div>
                                <span className="font-medium">Duration: </span>
                                {step.details.duration} hours
                              </div>
                            )}
                            {step.details?.method && (
                              <div className="col-span-2">
                                <span className="font-medium">Method: </span>
                                {step.details.method}
                              </div>
                            )}
                            <div className="col-span-2">
                              <span className="font-medium">Processor: </span>
                              {step.processorId || 'Unknown'}
                            </div>
                          </div>
                          {step.notes && (
                            <div className="col-span-2 text-sm">
                              <span className="font-medium">Notes: </span>
                              {step.notes}
                            </div>
                          )}
                          {step.attachments && step.attachments.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-sm font-medium mb-1">Attachments:</h4>
                              <div className="flex flex-wrap gap-2">
                                {step.attachments.map((attachment: any, i: number) => (
                                  <Badge key={i} variant="secondary">
                                    {attachment.name || `Attachment ${i + 1}`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {index < processingSteps.length - 1 && <Separator />}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No processing steps recorded
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}