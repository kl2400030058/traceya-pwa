'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ShieldCheck, Clock } from 'lucide-react';
import { ZKProof, VerificationResult } from '@/services/zkpservice';

interface ZKPVerificationCardProps {
  proof: ZKProof;
  verificationResult?: VerificationResult | null;
  onVerify?: () => void;
  loading?: boolean;
  showDetails?: boolean;
  className?: string;
}

const ZKPVerificationCard: React.FC<ZKPVerificationCardProps> = ({
  proof,
  verificationResult,
  onVerify,
  loading = false,
  showDetails = true,
  className = '',
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getProofTypeLabel = (proofType: string) => {
    switch (proofType) {
      case 'identity':
        return 'Identity Verification';
      case 'location':
        return 'Location Verification';
      case 'attribute':
        return 'Attribute Verification';
      default:
        return proofType.charAt(0).toUpperCase() + proofType.slice(1);
    }
  };

  const getStatusBadge = () => {
    if (proof.verified) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3.5 w-3.5 mr-1" />
          Pending Verification
        </Badge>
      );
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{getProofTypeLabel(proof.proofType)}</CardTitle>
            <CardDescription>
              {proof.resourceType}/{proof.resourceId}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Created:</span> {formatDate(proof.timestamp)}
            </p>
            {proof.verified && (
              <p>
                <span className="font-medium">Verified:</span> {proof.verificationData?.timestamp ? formatDate(proof.verificationData.timestamp) : 'Yes'}
              </p>
            )}
          </div>

          {showDetails && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Public Information:</p>
              <div className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(proof.publicInputs, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {verificationResult && (
            <div
              className={`p-3 rounded border ${verificationResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
                }`}
            >
              <div className="flex items-center">
                {verificationResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                )}
                <p className="text-sm font-medium">{verificationResult.message}</p>
              </div>
            </div>
          )}

          {onVerify && !proof.verified && (
            <Button
              onClick={onVerify}
              disabled={loading || proof.verified}
              className="w-full"
              size="sm"
            >
              {loading ? 'Verifying...' : 'Verify Proof'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ZKPVerificationCard;