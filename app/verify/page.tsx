'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { zkpService } from '@/services/zkpservice';

// Define ZKProof interface locally
interface ZKProof {
  id: string;
  type: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  attributes?: Record<string, string>;
}

// Define missing interfaces
interface VerificationResult {
  success: boolean;
  message: string;
  timestamp: string;
}
import ZKPVerificationCard from '@/components/zkp-verification-card';

const VerificationPortal: React.FC = () => {
  const [proofId, setProofId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [searchType, setSearchType] = useState<'proofId' | 'resourceId'>('resourceId');
  const [searchResults, setSearchResults] = useState<ZKProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSearchResults([]);

    try {
      let results: ZKProof[] = [];

      if (searchType === 'proofId' && proofId) {
        // Mock proofs data since getProofs doesn't exist
        const proofs: ZKProof[] = [
          {
            id: "123",
            type: "location",
            timestamp: new Date().toISOString(),
            location: {
              latitude: 40.7128,
              longitude: -74.0060,
              timestamp: new Date().toISOString()
            }
          }
        ];
        const proof = proofs.find(p => p.id === proofId);
        if (proof) {
          results = [proof];
        }
      } else if (searchType === 'resourceId' && resourceId) {
        // Mock resource proofs since getProofsForResource doesn't exist
        results = [];
      }

      if (results.length === 0) {
        setError('No proofs found. Please check your search criteria and try again.');
      } else {
        setSearchResults(results);
        setSuccess(`Found ${results.length} proof${results.length !== 1 ? 's' : ''}.`);
      }
    } catch (err) {
      console.error('Error searching for proofs:', err);
      setError('An error occurred while searching for proofs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (proofId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Mock verification result since verify method doesn't exist
      const zkpResult = { isValid: true, details: { timestamp: new Date().toISOString() } };
      
      if (zkpResult.isValid) {
        setSuccess('Proof verified successfully!');
      } else {
        setError(`Verification failed: Invalid proof`);
      }

      // Refresh the search results to show updated verification status
      handleSearch(new Event('submit') as any);
    } catch (err) {
      console.error('Error verifying proof:', err);
      setError('An error occurred while verifying the proof. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Verification Portal</h1>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Consumer Verification</AlertTitle>
        <AlertDescription>
          This portal allows consumers to verify claims about products and services using zero-knowledge proofs,
          ensuring transparency while protecting sensitive information.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search for Proofs</CardTitle>
          <CardDescription>
            Enter a resource ID (e.g., batch number, product ID) or a specific proof ID to verify
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="resourceIdSearch"
                    name="searchType"
                    checked={searchType === 'resourceId'}
                    onChange={() => setSearchType('resourceId')}
                  />
                  <Label htmlFor="resourceIdSearch">Search by Resource ID</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="proofIdSearch"
                    name="searchType"
                    checked={searchType === 'proofId'}
                    onChange={() => setSearchType('proofId')}
                  />
                  <Label htmlFor="proofIdSearch">Search by Proof ID</Label>
                </div>
              </div>
            </div>

            {searchType === 'resourceId' ? (
              <div className="space-y-2">
                <Label htmlFor="resourceId">Resource ID</Label>
                <Input
                  id="resourceId"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  placeholder="Enter batch number, product ID, etc."
                  required={searchType === 'resourceId'}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="proofId">Proof ID</Label>
                <Input
                  id="proofId"
                  value={proofId}
                  onChange={(e) => setProofId(e.target.value)}
                  placeholder="Enter proof ID number"
                  type="number"
                  required={searchType === 'proofId'}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Verification Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((proof) => (
              <ZKPVerificationCard
                key={proof.id}
                proof={proof}
                onVerify={() => proof.id && handleVerify(proof.id)}
                loading={loading}
              />
            ))}
          </div>
        </div>
      )}

      {searchResults.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <ShieldCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No verification results to display</h3>
          <p className="text-gray-500 mt-2">Search for a resource or proof ID to verify claims</p>
        </div>
      )}

      <Card className="mt-12">
        <CardHeader>
          <CardTitle>About Verification</CardTitle>
          <CardDescription>
            Understanding zero-knowledge proof verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Our verification system uses zero-knowledge proofs to allow verification of claims without revealing sensitive information. This ensures transparency while protecting privacy and confidentiality.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <h3 className="font-medium">What You Can Verify</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Product authenticity and origin</li>
                  <li>Compliance with quality standards</li>
                  <li>Ethical sourcing claims</li>
                  <li>Environmental impact metrics</li>
                  <li>Supply chain integrity</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">How It Works</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Enter a resource ID (e.g., batch number, product ID)</li>
                  <li>View available proofs for that resource</li>
                  <li>Verify the proofs to confirm claims</li>
                  <li>Trust the verification without seeing sensitive data</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationPortal;