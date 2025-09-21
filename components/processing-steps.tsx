'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProcessingDetails, Attachment } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { Camera, Clock, Upload, X, AlertTriangle, Plus, Trash2 } from 'lucide-react';

interface ProcessingStepsProps {
  batchId: string;
  species: string;
  onSave: (data: {
    processingDetails: ProcessingDetails;
    attachments: Attachment[];
    notes: string;
  }) => void;
  isLoading?: boolean;
  existingSteps?: ProcessingDetails;
  existingAttachments?: Attachment[];
  existingNotes?: string;
}

type ProcessingStepType = 'drying' | 'grinding' | 'storage' | 'packaging' | 'quality_check' | 'other';

interface StepDetails {
  type: ProcessingStepType;
  timestamp: string;
  details: string;
  conditions?: {
    temperature?: number;
    humidity?: number;
    duration?: number;
    [key: string]: any;
  };
}

export function ProcessingSteps({
  batchId,
  species,
  onSave,
  isLoading = false,
  existingSteps,
  existingAttachments = [],
  existingNotes = ''
}: ProcessingStepsProps) {
  // Processing steps state
  const [steps, setSteps] = useState<StepDetails[]>(
    existingSteps?.steps as StepDetails[] || []
  );
  
  // Current step being edited
  const [currentStep, setCurrentStep] = useState<StepDetails>({
    type: 'drying',
    timestamp: formatTimestamp(new Date()),
    details: '',
    conditions: {
      temperature: undefined,
      humidity: undefined,
      duration: undefined
    }
  });
  
  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>(existingAttachments);
  
  // Notes state
  const [notes, setNotes] = useState<string>(existingNotes);
  
  // Error state
  const [error, setError] = useState<string>('');
  
  // Handle file upload for photo capture
  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const file = files[0];
      const blobUrl = URL.createObjectURL(file);
      
      // Generate a simple hash based on file name and size
      const hash = `${file.name}-${file.size}-${Date.now()}`;
      
      const newAttachment: Attachment = {
        type: "photo",
        blobUrl,
        hash,
        filename: file.name,
        fileSize: file.size,
        timestamp: formatTimestamp(new Date())
      };
      
      setAttachments([...attachments, newAttachment]);
    } catch (error) {
      console.error("Error capturing photo:", error);
      setError("Failed to capture photo. Please try again.");
    } finally {
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };
  
  // Remove an attachment
  const removeAttachment = (hash: string) => {
    setAttachments(attachments.filter(attachment => attachment.hash !== hash));
  };
  
  // Add a new processing step
  const addStep = () => {
    if (!currentStep.details) {
      setError("Please enter details for the processing step");
      return;
    }
    
    setSteps([...steps, { ...currentStep }]);
    
    // Reset current step
    setCurrentStep({
      type: 'drying',
      timestamp: formatTimestamp(new Date()),
      details: '',
      conditions: {
        temperature: undefined,
        humidity: undefined,
        duration: undefined
      }
    });
    
    setError('');
  };
  
  // Remove a processing step
  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (steps.length === 0) {
      setError("At least one processing step is required");
      return;
    }
    
    // Create processing details object
    const processingDetails: ProcessingDetails = {
      batchId,
      steps,
      lastUpdated: formatTimestamp(new Date())
    };
    
    // Call the onSave callback
    onSave({
      processingDetails,
      attachments,
      notes
    });
  };
  
  // Update current step field
  const updateCurrentStep = (field: string, value: any) => {
    if (field.startsWith('conditions.')) {
      const conditionField = field.split('.')[1];
      setCurrentStep({
        ...currentStep,
        conditions: {
          ...currentStep.conditions,
          [conditionField]: value
        }
      });
    } else {
      setCurrentStep({
        ...currentStep,
        [field]: value
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Processing Steps</CardTitle>
          <Badge variant="outline">{batchId}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Add new step form */}
          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="text-lg font-medium">Add Processing Step</h3>
            
            <div className="space-y-2">
              <Label htmlFor="step-type">Step Type</Label>
              <Select
                value={currentStep.type}
                onValueChange={(value) => updateCurrentStep('type', value)}
              >
                <SelectTrigger id="step-type">
                  <SelectValue placeholder="Select step type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drying">Drying</SelectItem>
                  <SelectItem value="grinding">Grinding</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                  <SelectItem value="quality_check">Quality Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="step-details">Details</Label>
              <Textarea
                id="step-details"
                value={currentStep.details}
                onChange={(e) => updateCurrentStep('details', e.target.value)}
                placeholder="Enter details about this processing step"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={currentStep.conditions?.temperature || ''}
                  onChange={(e) => updateCurrentStep('conditions.temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Temperature"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  min="0"
                  max="100"
                  value={currentStep.conditions?.humidity || ''}
                  onChange={(e) => updateCurrentStep('conditions.humidity', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Humidity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  step="0.1"
                  value={currentStep.conditions?.duration || ''}
                  onChange={(e) => updateCurrentStep('conditions.duration', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Duration"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={addStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
          </div>
          
          {/* Existing steps */}
          {steps.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Processing Steps ({steps.length})</h3>
              
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="border p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge>
                            {step.type.charAt(0).toUpperCase() + step.type.slice(1).replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {step.timestamp}
                          </span>
                        </div>
                        <p className="mt-2">{step.details}</p>
                        
                        {step.conditions && Object.keys(step.conditions).some(key => step.conditions?.[key] !== undefined) && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-medium">Conditions:</p>
                            <ul className="list-disc list-inside pl-2">
                              {step.conditions.temperature !== undefined && (
                                <li>Temperature: {step.conditions.temperature}°C</li>
                              )}
                              {step.conditions.humidity !== undefined && (
                                <li>Humidity: {step.conditions.humidity}%</li>
                              )}
                              {step.conditions.duration !== undefined && (
                                <li>Duration: {step.conditions.duration} hours</li>
                              )}
                              {Object.entries(step.conditions)
                                .filter(([key]) => !['temperature', 'humidity', 'duration'].includes(key))
                                .map(([key, value]) => (
                                  <li key={key}>{key}: {value}</li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Photo capture */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Photo Documentation</h3>
            
            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="photo-capture"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoCapture}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('photo-capture')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Import camera manager dynamically to avoid issues
                    const { cameraManager } = await import('@/lib/camera');
                    
                    const photo = await cameraManager.captureFromCamera({
                      type: "normal",
                      intensity: 50
                    });
                    
                    if (photo) {
                      const newAttachment: Attachment = {
                        type: "photo",
                        blobUrl: photo.blobUrl,
                        hash: photo.hash,
                        filename: `camera-${Date.now()}.jpg`,
                        fileSize: photo.file.size,
                        timestamp: formatTimestamp(new Date())
                      };
                      
                      setAttachments([...attachments, newAttachment]);
                    }
                  } catch (error) {
                    console.error("Error capturing photo from camera:", error);
                    setError("Failed to capture photo from camera. Please try again.");
                  }
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture with Camera
              </Button>
            </div>
            
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {attachments.map((attachment) => (
                  <div key={attachment.hash} className="relative">
                    <img
                      src={attachment.blobUrl}
                      alt="Processing step"
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeAttachment(attachment.hash)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {attachment.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="processing-notes">Notes</Label>
            <Textarea
              id="processing-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes about the processing steps"
              className="min-h-[100px]"
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mt-6">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Save Processing Steps"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}