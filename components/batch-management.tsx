'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Batch, BatchSummary, CollectionEvent } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { generateQRCodeSVG } from '@/lib/qrcode';
import { AlertTriangle, Check, Leaf, Calendar, Package, QrCode, ChevronRight, Search } from 'lucide-react';

interface BatchManagementProps {
  userRole: string;
  onCreateBatch: (collectionEventIds: string[]) => Promise<string>;
  onViewBatch: (batchId: string) => void;
  isLoading?: boolean;
}

export function BatchManagement({ userRole, onCreateBatch, onViewBatch, isLoading = false }: BatchManagementProps) {
  // State for collection events and batches
  const [collectionEvents, setCollectionEvents] = useState<CollectionEvent[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchSummaries, setBatchSummaries] = useState<Record<string, BatchSummary>>({});
  
  // State for batch creation
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // State for QR code display
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  
  // Error state
  const [error, setError] = useState<string>('');
  
  // Load collection events and batches
  useEffect(() => {
    const loadData = async () => {
      try {
        // In a real implementation, these would be loaded from the database
        // For now, we'll use placeholder data
        const mockCollectionEvents: CollectionEvent[] = [];
        const mockBatches: Batch[] = [];
        const mockBatchSummaries: Record<string, BatchSummary> = {};
        
        setCollectionEvents(mockCollectionEvents);
        setBatches(mockBatches);
        setBatchSummaries(mockBatchSummaries);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      }
    };
    
    loadData();
  }, []);
  
  // Filter collection events based on search term
  const filteredEvents = collectionEvents.filter(event => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.eventId.toLowerCase().includes(searchLower) ||
      event.farmerId.toLowerCase().includes(searchLower) ||
      (event.plantMetadata?.species || '').toLowerCase().includes(searchLower)
    );
  });
  
  // Toggle event selection
  const toggleEventSelection = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter(id => id !== eventId));
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };
  
  // Create a new batch
  const handleCreateBatch = async () => {
    if (selectedEvents.length === 0) {
      setError('Please select at least one collection event');
      return;
    }
    
    try {
      const batchId = await onCreateBatch(selectedEvents);
      setSelectedEvents([]);
      setError('');
      
      // Show success message or navigate to the new batch
      alert(`Batch ${batchId} created successfully`);
    } catch (err) {
      console.error('Error creating batch:', err);
      setError('Failed to create batch. Please try again.');
    }
  };
  
  // Generate QR code for a batch
  const handleGenerateQRCode = async (batchId: string) => {
    try {
      const svg = await generateQRCodeSVG(batchId);
      setSelectedBatchId(batchId);
      setQrCodeSvg(svg);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code. Please try again.');
    }
  };
  
  // Download QR code as SVG
  const handleDownloadQRCode = () => {
    if (!qrCodeSvg) return;
    
    const blob = new Blob([qrCodeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${selectedBatchId}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Batch Management</CardTitle>
        <CardDescription>
          Create and manage batches of collection events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="view-batches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view-batches">View Batches</TabsTrigger>
            <TabsTrigger value="create-batch" disabled={userRole !== 'collector' && userRole !== 'admin'}>Create Batch</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view-batches" className="space-y-4">
            {batches.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">No batches found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => {
                  const summary = batchSummaries[batch.batchId] || {
                    eventCount: 0,
                    species: [],
                    collectionDates: { start: '', end: '' },
                    hasLabResults: false
                  };
                  
                  return (
                    <Card key={batch.batchId} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-grow p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">{batch.batchId}</h3>
                            <Badge variant={batch.status === 'completed' ? 'default' : 'outline'}>
                              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="mt-2 space-y-1 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Leaf className="h-4 w-4 mr-2" />
                              <span>
                                {summary.species.length > 0
                                  ? summary.species.join(', ')
                                  : 'No species data'}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>
                                {summary.collectionDates?.start
                                  ? `${summary.collectionDates?.start} to ${summary.collectionDates?.end}`
                                  : 'No date range'}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2" />
                              <span>{summary.eventCount} collection events</span>
                            </div>
                            
                            {summary.hasLabResults && (
                              <div className="flex items-center">
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                <span className="text-green-500">Lab results available</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateQRCode(batch.batchId)}
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              QR Code
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => onViewBatch(batch.batchId)}
                            >
                              View Details
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                        
                        {selectedBatchId === batch.batchId && qrCodeSvg && (
                          <div className="p-4 bg-gray-50 flex flex-col items-center justify-center min-w-[200px]">
                            <div
                              className="w-32 h-32"
                              dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={handleDownloadQRCode}
                            >
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create-batch" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, farmer, or species"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow"
                />
              </div>
              
              <div className="border rounded-md">
                <div className="p-2 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-medium">Collection Events</h3>
                  <span className="text-sm text-gray-500">
                    {selectedEvents.length} selected
                  </span>
                </div>
                
                <ScrollArea className="h-[300px]">
                  {filteredEvents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No collection events found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredEvents.map((event) => (
                        <div
                          key={event.eventId}
                          className={`p-3 flex items-start space-x-3 hover:bg-gray-50 cursor-pointer ${selectedEvents.includes(event.eventId) ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleEventSelection(event.eventId)}
                        >
                          <Checkbox
                            checked={selectedEvents.includes(event.eventId)}
                            onCheckedChange={() => toggleEventSelection(event.eventId)}
                            className="mt-1"
                          />
                          
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{event.eventId}</span>
                              <Badge variant="outline">
                                {event.batchId ? 'In Batch' : 'Unbatched'}
                              </Badge>
                            </div>
                            
                            <div className="mt-1 space-y-1 text-sm text-gray-500">
                              <div>Farmer: {event.farmerId}</div>
                              <div>Species: {event.plantMetadata?.species || 'Unknown'}</div>
                              <div>Date: {formatTimestamp(new Date(event.timestamp || Date.now()))}</div>
                              <div>Photos: {event.photos?.length || 0}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateBatch}
                  disabled={isLoading || selectedEvents.length === 0}
                >
                  {isLoading ? 'Creating...' : 'Create Batch'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}