'use client';

import { useState } from 'react';
import { ProcessingEvent, ProcessingEventType } from '@/models/ProcessingEvent';
import { LabCertificate } from '@/models/LabCertificate';
import { format } from 'date-fns';
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp, Leaf, FlaskConical, Factory, Truck, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface TimelineProps {
  events: ProcessingEvent[];
  certificates: LabCertificate[];
  batchId: string;
  renderBlockchainStatus?: (item: ProcessingEvent | LabCertificate) => React.ReactNode;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  type: 'collection' | 'lab' | 'processing' | 'transport' | 'retail';
  verified: boolean;
  details: ProcessingEvent | LabCertificate;
  blockchainTxId?: string;
}

export function Timeline({ events, certificates, batchId, renderBlockchainStatus }: TimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Combine processing events and lab certificates into a single timeline
  const timelineEvents: TimelineEvent[] = [
    ...events.map(event => ({
      id: event.id,
      title: getEventTitle(event.eventType),
      date: new Date(event.timestamp),
      type: mapEventTypeToTimelineType(event.eventType),
      verified: !!event.blockchainTxId,
      details: event,
      blockchainTxId: event.blockchainTxId
    })),
    ...certificates.map(cert => ({
      id: cert.id,
      title: 'Lab Certificate',
      date: new Date(cert.uploadDate),
      type: 'lab' as const,
      verified: !!cert.blockchainTxId,
      details: cert,
      blockchainTxId: cert.blockchainTxId
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const toggleExpand = (id: string) => {
    if (expandedEvent === id) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(id);
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'collection':
        return <Leaf className="h-6 w-6 text-green-500" />;
      case 'lab':
        return <FlaskConical className="h-6 w-6 text-blue-500" />;
      case 'processing':
        return <Factory className="h-6 w-6 text-amber-500" />;
      case 'transport':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'retail':
        return <ShoppingBag className="h-6 w-6 text-pink-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Batch Journey</h2>
        <Badge variant="outline" className="px-3 py-1">
          Batch ID: {batchId}
        </Badge>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

        {timelineEvents.map((event, index) => (
          <div key={event.id} className="relative mb-8">
            <div className="flex items-start">
              {/* Timeline dot */}
              <div className="absolute left-7 transform -translate-x-1/2 mt-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-5 w-5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-primary">
                        {event.verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {event.verified ? 'Verified on Blockchain' : 'Not Verified'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Event card */}
              <div className="ml-16 w-full">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(event.id)}
                        className="h-8 w-8 p-0"
                      >
                        {expandedEvent === event.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      {format(event.date, 'PPP p')}
                    </CardDescription>
                  </CardHeader>

                  {expandedEvent === event.id && (
                    <>
                      <CardContent>
                        {event.type === 'lab' ? (
                          <LabCertificateDetails certificate={event.details as LabCertificate} />
                        ) : (
                          <ProcessingEventDetails event={event.details} />
                        )}
                      </CardContent>
                      <CardFooter className="pt-0 text-xs text-muted-foreground">
                        {renderBlockchainStatus ? (
                          renderBlockchainStatus(event.details)
                        ) : event.blockchainTxId && (
                          <div>
                            <span className="font-semibold">Blockchain TX: </span>
                            <span className="font-mono">
                              {event.blockchainTxId.substring(0, 10)}...{event.blockchainTxId.substring(event.blockchainTxId.length - 10)}
                            </span>
                          </div>
                        )}
                      </CardFooter>
                    </>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabCertificateDetails({ certificate }: { certificate: LabCertificate }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium">Test Results</h4>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {/* Certificate doesn't have testResults property, using qualityMetrics instead */}
      {certificate.qualityMetrics && Object.entries(certificate.qualityMetrics).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium">{key}: </span>
              <span>{typeof value === 'number' ? value : String(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {certificate.qualityMetrics && (
        <div>
          <h4 className="font-medium">Quality Metrics</h4>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.entries(certificate.qualityMetrics).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="font-medium">{key}: </span>
                <span>{typeof value === 'boolean' ? (value ? 'Pass' : 'Fail') : value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {certificate.files && certificate.files.length > 0 && (
        <div>
          <h4 className="font-medium">Attached Files</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {certificate.files.map((file, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {file.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {certificate.anomalyFlags && certificate.anomalyFlags.length > 0 && (
        <div>
          <h4 className="font-medium text-amber-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> Anomalies Detected
          </h4>
          <ul className="list-disc list-inside text-sm mt-2">
            {certificate.anomalyFlags.map((anomaly, index) => (
              <li key={index} className="text-amber-600 dark:text-amber-400">
                {anomaly}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProcessingEventDetails({ event }: { event: ProcessingEvent | LabCertificate }) {
  // Check if the event is a ProcessingEvent by checking for eventType property
  const isProcessingEvent = 'eventType' in event;
  
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium">Event Details</h4>
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <div>
            <span className="font-medium">Operator: </span>
            <span>{isProcessingEvent ? (event as ProcessingEvent).operatorId : (event as LabCertificate).uploadedBy}</span>
          </div>
          {isProcessingEvent && (event as ProcessingEvent).location && (
            <div>
              <span className="font-medium">Location: </span>
              <span>
                {(event as ProcessingEvent).location?.latitude?.toFixed(6) || 'N/A'}, 
                {(event as ProcessingEvent).location?.longitude?.toFixed(6) || 'N/A'}
              </span>
            </div>
          )}
          {isProcessingEvent && (event as ProcessingEvent).equipmentId && (
            <div>
              <span className="font-medium">Equipment: </span>
              <span>{(event as ProcessingEvent).equipmentId}</span>
            </div>
          )}
          {isProcessingEvent && (event as ProcessingEvent).temperature && (
            <div>
              <span className="font-medium">Temperature: </span>
              <span>{(event as ProcessingEvent).temperature}°C</span>
            </div>
          )}
          {!isProcessingEvent && (event as LabCertificate).certificateType && (
            <div>
              <span className="font-medium">Certificate Type: </span>
              <span>{(event as LabCertificate).certificateType}</span>
            </div>
          )}
        </div>
      </div>

      {event.notes && (
        <div>
          <h4 className="font-medium">Notes</h4>
          <p className="text-sm mt-1">{event.notes}</p>
        </div>
      )}

      {isProcessingEvent && (event as ProcessingEvent).previousEventId && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Previous Event: </span>
          <span className="font-mono">{(event as ProcessingEvent).previousEventId?.substring(0, 8) || ''}...</span>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getEventTitle(eventType: ProcessingEventType): string {
  switch (eventType) {
    case 'collection':
      return 'Herb Collection';
    case 'drying':
      return 'Drying Process';
    case 'grinding':
      return 'Grinding Process';
    case 'extraction':
      return 'Extraction Process';
    case 'filtration':
      return 'Filtration Process';
    case 'concentration':
      return 'Concentration Process';
    case 'storage':
      return 'Storage';
    case 'packaging':
      return 'Packaging';
    case 'transportation':
      return 'Transport';
    case 'quality_check':
      return 'Quality Check';
    default:
      return eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}

function mapEventTypeToTimelineType(eventType: ProcessingEventType): TimelineEvent['type'] {
  if (eventType === 'collection') return 'collection';
  if (eventType === 'transportation') return 'transport';
  if (eventType === 'quality_check') return 'lab';
  if (['drying', 'grinding', 'storage', 'packaging', 'extraction', 'filtration', 'concentration', 'other'].includes(eventType)) return 'processing';
  return 'processing';
}