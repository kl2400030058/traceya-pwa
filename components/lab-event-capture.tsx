'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Attachment, LabTestResult } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { File, Upload, X, Camera, FileText, AlertTriangle } from 'lucide-react';

interface LabEventCaptureProps {
  batchId: string;
  species: string;
  onSave: (data: {
    testResults: LabTestResult;
    attachments: Attachment[];
    notes: string;
  }) => void;
  isLoading?: boolean;
}

export function LabEventCapture({ batchId, species, onSave, isLoading = false }: LabEventCaptureProps) {
  // Test results state
  const [moisturePct, setMoisturePct] = useState<string>('');
  const [pesticideLevels, setPesticideLevels] = useState<string>('');
  const [dnaBarcoding, setDnaBarcoding] = useState<string>('');
  const [otherTests, setOtherTests] = useState<Record<string, any>>({});
  
  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Notes state
  const [notes, setNotes] = useState<string>('');
  
  // Error state
  const [error, setError] = useState<string>('');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const newAttachments: Attachment[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const blobUrl = URL.createObjectURL(file);
        
        // Determine file type
        let type: "photo" | "pdf" | "report" = "photo";
        if (file.type === "application/pdf") {
          type = "pdf";
        } else if (file.name.endsWith(".doc") || file.name.endsWith(".docx") || file.name.endsWith(".txt")) {
          type = "report";
        }
        
        // Generate a simple hash based on file name and size
        const hash = await generateSimpleHash(file);
        
        newAttachments.push({
          type,
          blobUrl,
          hash,
          filename: file.name,
          fileSize: file.size,
          timestamp: formatTimestamp(new Date())
        });
      }
      
      setAttachments([...attachments, ...newAttachments]);
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Failed to upload files. Please try again.");
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Generate a simple hash for a file
  const generateSimpleHash = async (file: File): Promise<string> => {
    // In a real app, we would use a proper hashing algorithm
    // This is a simple placeholder
    return `${file.name}-${file.size}-${Date.now()}`;
  };
  
  // Remove an attachment
  const removeAttachment = (hash: string) => {
    setAttachments(attachments.filter(attachment => attachment.hash !== hash));
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!moisturePct) {
      setError("Moisture percentage is required");
      return;
    }
    
    const moistureValue = parseFloat(moisturePct);
    if (isNaN(moistureValue) || moistureValue < 0 || moistureValue > 100) {
      setError("Moisture percentage must be a number between 0 and 100");
      return;
    }
    
    // Create test results object
    const testResults: LabTestResult = {
      moisturePct: moistureValue
    };
    
    // Add optional fields if they exist
    if (pesticideLevels) {
      const pesticidesValue = parseFloat(pesticideLevels);
      if (!isNaN(pesticidesValue)) {
        testResults.pesticideLevels = pesticidesValue;
      }
    }
    
    if (dnaBarcoding) {
      testResults.dnaBarcoding = dnaBarcoding;
    }
    
    if (Object.keys(otherTests).length > 0) {
      testResults.otherTests = otherTests;
    }
    
    // Call the onSave callback
    onSave({
      testResults,
      attachments,
      notes
    });
  };
  
  // Add a new custom test field
  const addCustomTest = () => {
    const testName = prompt("Enter test name:");
    if (!testName) return;
    
    const testValue = prompt(`Enter value for ${testName}:`);
    if (!testValue) return;
    
    setOtherTests({
      ...otherTests,
      [testName]: testValue
    });
  };
  
  // Remove a custom test field
  const removeCustomTest = (testName: string) => {
    const newOtherTests = { ...otherTests };
    delete newOtherTests[testName];
    setOtherTests(newOtherTests);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lab Test Results</CardTitle>
          <Badge variant="outline">{batchId}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test-results" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test-results">Test Results</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="test-results" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Input id="species" value={species} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="moisture" className="flex justify-between">
                  Moisture Percentage <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="moisture"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={moisturePct}
                  onChange={(e) => setMoisturePct(e.target.value)}
                  placeholder="Enter moisture %"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pesticides">Pesticide Levels (ppm)</Label>
                <Input
                  id="pesticides"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pesticideLevels}
                  onChange={(e) => setPesticideLevels(e.target.value)}
                  placeholder="Enter pesticide levels"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dna">DNA Barcoding Results</Label>
                <Input
                  id="dna"
                  value={dnaBarcoding}
                  onChange={(e) => setDnaBarcoding(e.target.value)}
                  placeholder="Enter DNA barcoding results"
                />
              </div>
              
              {/* Custom test fields */}
              {Object.entries(otherTests).map(([testName, testValue]) => (
                <div key={testName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`test-${testName}`}>{testName}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomTest(testName)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    id={`test-${testName}`}
                    value={testValue as string}
                    onChange={(e) => setOtherTests({
                      ...otherTests,
                      [testName]: e.target.value
                    })}
                  />
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addCustomTest}
                className="w-full"
              >
                Add Custom Test
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="attachments" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">Upload photos, PDFs, or lab reports</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Files
                </Button>
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Uploaded Files ({attachments.length})</h3>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.hash}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          {attachment.type === "photo" ? (
                            <Camera className="h-4 w-4 text-blue-500" />
                          ) : attachment.type === "pdf" ? (
                            <File className="h-4 w-4 text-red-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm truncate max-w-[200px]">{attachment.filename}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(attachment.hash)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Lab Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes about the lab tests"
                className="min-h-[200px]"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
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
            {isLoading ? "Saving..." : "Save Lab Results"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}