'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import IPFSFileUploader from '@/components/ipfs-file-uploader';
import { IPFSFile } from '@/services/ipfsservice';
import { MFAGuard } from '@/components/mfa-guard';

const IPFSUploadDemo: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<IPFSFile[]>([]);
  
  const handleUploadComplete = (files: IPFSFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    console.log('Upload complete:', files);
  };

  return (
    <MFAGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">IPFS Integration Demo</h1>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            This page demonstrates the integration with IPFS (InterPlanetary File System) for decentralized storage.
            Files uploaded here are stored on the IPFS network and can be accessed from anywhere using their Content Identifier (CID).
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Tabs defaultValue="documents">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="any">Any Files</TabsTrigger>
              </TabsList>
              
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Upload</CardTitle>
                    <CardDescription>
                      Upload PDF, Word, Excel, or text documents to IPFS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IPFSFileUploader
                      resourceType="documents"
                      resourceId="demo-documents"
                      maxFiles={3}
                      acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onUploadComplete={handleUploadComplete}
                      metadata={{ category: 'documents', demo: true }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle>Image Upload</CardTitle>
                    <CardDescription>
                      Upload images to IPFS with preview support.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IPFSFileUploader
                      resourceType="images"
                      resourceId="demo-images"
                      maxFiles={5}
                      acceptedFileTypes="image/*"
                      onUploadComplete={handleUploadComplete}
                      metadata={{ category: 'images', demo: true }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="any">
                <Card>
                  <CardHeader>
                    <CardTitle>Any File Upload</CardTitle>
                    <CardDescription>
                      Upload any type of file to IPFS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IPFSFileUploader
                      resourceType="misc"
                      resourceId="demo-misc"
                      maxFiles={10}
                      acceptedFileTypes="*"
                      onUploadComplete={handleUploadComplete}
                      metadata={{ category: 'misc', demo: true }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>About IPFS Integration</CardTitle>
                <CardDescription>
                  How decentralized storage works in our application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">What is IPFS?</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      IPFS (InterPlanetary File System) is a protocol and peer-to-peer network for storing and sharing data in a distributed file system. Files on IPFS are identified by their content, not their location, making them resistant to censorship and central points of failure.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Benefits</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                      <li>Decentralized storage - no single point of failure</li>
                      <li>Content-addressed - files cannot be tampered with</li>
                      <li>Efficient distribution - reduces bandwidth costs</li>
                      <li>Permanent storage - files remain accessible</li>
                      <li>Verifiable integrity - cryptographic guarantees</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">How We Use IPFS</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      In our application, IPFS is used to store important documents, evidence, certificates, and other files that need to be immutable and permanently accessible. This ensures that critical data cannot be altered or deleted, providing a transparent and auditable record.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Technical Implementation</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      We use the IPFS HTTP client to interact with an IPFS node. Files are uploaded to IPFS, and their Content Identifiers (CIDs) are stored in our database along with metadata. The files can then be accessed using any IPFS gateway.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MFAGuard>
  );
};

export default IPFSUploadDemo;