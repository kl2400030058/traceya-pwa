'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AuthGuard } from '@/components/auth-guard';
import { db } from '@/lib/db';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Shield, FileCheck, Upload, Eye } from 'lucide-react';

export default function AdminVerificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationRequests, setVerificationRequests] = useState<Array<{
    id: string;
    batchId: string;
    certificateId: string;
    requestedBy: string;
    requestedAt: string;
    status: 'pending' | 'verified' | 'rejected';
    proofHash: string;
  }>>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<{
    proofData: string;
    publicInputs: string;
    verifierKey: string;
  }>({ proofData: '', publicInputs: '', verifierKey: '' });
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    loadVerificationRequests();
  }, []);

  const loadVerificationRequests = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, this would be an API call to the backend
      // For demo purposes, we'll simulate the data
      setVerificationRequests(generateMockVerificationRequests());
    } catch (err) {
      console.error('Error loading verification requests:', err);
      setError('Failed to load verification requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadVerificationRequests();
  };

  const handleViewRequest = (requestId: string) => {
    setSelectedRequest(requestId);
    // In a real implementation, this would fetch the verification details from the backend
    // For demo purposes, we'll simulate the data
    setVerificationDetails({
      proofData: 'eyJwcm9vZiI6IlpLUCBwcm9vZiBkYXRhIGluIGJhc2U2NCBmb3JtYXQiLCJwdWJsaWNJbnB1dHMiOlsiMHgxMjM0NTY3ODkwIiwiMHhhYmNkZWYxMjM0Il19',
      publicInputs: JSON.stringify(["0x1234567890", "0xabcdef1234", "0x9876543210"]),
      verifierKey: 'vk_1a2b3c4d5e6f7g8h9i0j'
    });
    setVerificationResult(null);
  };

  const handleVerifyProof = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the ZKP verification service
      // For demo purposes, we'll simulate the verification process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a successful verification 80% of the time
      const isValid = Math.random() > 0.2;
      
      setVerificationResult({
        isValid,
        message: isValid 
          ? 'ZKP verification successful. Certificate data integrity confirmed.' 
          : 'ZKP verification failed. Certificate data may have been tampered with.',
        timestamp: new Date().toISOString()
      });
      
      // Update the request status in the list
      if (selectedRequest) {
        setVerificationRequests(prev => prev.map(req => {
          if (req.id === selectedRequest) {
            return {
              ...req,
              status: isValid ? 'verified' : 'rejected'
            };
          }
          return req;
        }));
      }
    } catch (err) {
      console.error('Error verifying proof:', err);
      setError('Failed to verify proof. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerificationRequests = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>ZKP Verification Requests</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>Zero-Knowledge Proof verification requests for certificates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Certificate ID</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verificationRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-xs">{request.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-mono text-xs">{request.batchId.substring(0, 8)}...</TableCell>
                  <TableCell className="font-mono text-xs">{request.certificateId.substring(0, 8)}...</TableCell>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell>{new Date(request.requestedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        request.status === 'verified' 
                          ? 'default' 
                          : request.status === 'rejected' 
                            ? 'destructive' 
                            : 'secondary'
                      }
                    >
                      {request.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewRequest(request.id)}
                      disabled={request.status !== 'pending'}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderVerificationDetails = () => {
    const request = verificationRequests.find(r => r.id === selectedRequest);
    
    if (!request) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Verification Details</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
              Back to List
            </Button>
          </div>
          <CardDescription>ZKP verification for request {request.id.substring(0, 8)}...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Batch ID</h3>
              <p className="font-mono text-xs bg-muted p-2 rounded">{request.batchId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Certificate ID</h3>
              <p className="font-mono text-xs bg-muted p-2 rounded">{request.certificateId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Proof Hash</h3>
              <p className="font-mono text-xs bg-muted p-2 rounded">{request.proofHash}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Requested By</h3>
              <p className="font-mono text-xs bg-muted p-2 rounded">{request.requestedBy}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">ZKP Proof Data</h3>
            <Textarea 
              value={verificationDetails.proofData} 
              readOnly 
              className="font-mono text-xs h-20"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Public Inputs</h3>
            <Textarea 
              value={verificationDetails.publicInputs} 
              readOnly 
              className="font-mono text-xs h-20"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Verifier Key</h3>
            <Input 
              value={verificationDetails.verifierKey} 
              readOnly 
              className="font-mono text-xs"
            />
          </div>

          {verificationResult && (
            <Alert variant={verificationResult.isValid ? 'default' : 'destructive'} className="mt-4">
              {verificationResult.isValid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-medium">{verificationResult.message}</div>
                <div className="text-xs mt-1">Verified at: {new Date(verificationResult.timestamp).toLocaleString()}</div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleVerifyProof} 
            disabled={isLoading || request.status !== 'pending'}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Verify ZKP Proof'}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">ZKP Verification</h1>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6">
          {selectedRequest ? renderVerificationDetails() : renderVerificationRequests()}
        </div>
      </div>
    </AuthGuard>
  );
}

// Helper function to generate mock data for the demo
function generateMockVerificationRequests() {
  const requests = [
    {
      id: 'req_7d9e2f1a3b5c8d6e',
      batchId: 'batch_3f5e8d9a7b2c1d4e',
      certificateId: 'cert_7d9e2f1a3b5c8d6e',
      requestedBy: 'Dr. Sarah Smith',
      requestedAt: new Date(Date.now() - 30 * 60000).toISOString(),
      status: 'pending',
      proofHash: '0x7d9e2f1a3b5c8d6e3f5e8d9a7b2c1d4e7d9e2f1a3b5c8d6e3f5e8d9a7b2c1d4e'
    },
    {
      id: 'req_2a4b6c8d0e2f4a6b',
      batchId: 'batch_5a7b9c1d3e5f7g9h',
      certificateId: 'cert_2a4b6c8d0e2f4a6b',
      requestedBy: 'Dr. Michael Johnson',
      requestedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      status: 'verified',
      proofHash: '0x2a4b6c8d0e2f4a6b5a7b9c1d3e5f7g9h2a4b6c8d0e2f4a6b5a7b9c1d3e5f7g9h'
    },
    {
      id: 'req_3c5d7e9f1a3b5c7d',
      batchId: 'batch_2d4f6h8j0l2n4p6r',
      certificateId: 'cert_3c5d7e9f1a3b5c7d',
      requestedBy: 'Dr. Emily Chen',
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(),
      status: 'rejected',
      proofHash: '0x3c5d7e9f1a3b5c7d2d4f6h8j0l2n4p6r3c5d7e9f1a3b5c7d2d4f6h8j0l2n4p6r'
    },
    {
      id: 'req_4d6e8f0a2b4c6d8e',
      batchId: 'batch_1a3c5e7g9i1k3m5o',
      certificateId: 'cert_4d6e8f0a2b4c6d8e',
      requestedBy: 'Dr. Robert Williams',
      requestedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'pending',
      proofHash: '0x4d6e8f0a2b4c6d8e1a3c5e7g9i1k3m5o4d6e8f0a2b4c6d8e1a3c5e7g9i1k3m5o'
    },
  ];

  return requests as Array<{
    id: string;
    batchId: string;
    certificateId: string;
    requestedBy: string;
    requestedAt: string;
    status: 'pending' | 'verified' | 'rejected';
    proofHash: string;
  }>;
}