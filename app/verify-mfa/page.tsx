'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { authManager } from '@/lib/auth';
import { mfaService } from '@/services/mfaservice';
import { Loader2, AlertCircle } from 'lucide-react';

export default function VerifyMFAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  useEffect(() => {
    // If user is not logged in or doesn't need MFA verification, redirect
    if (!authManager.isAuthenticated() && !authManager.requiresMFAVerification()) {
      router.push('/login');
    }
  }, [router]);

  const handleVerify = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      let verified = false;
      
      if (useBackupCode) {
        // Verify with backup code
        const userId = authManager.getUserId();
        if (!userId) {
          setError('User ID not found. Please log in again.');
          return;
        }
        
        verified = await mfaService.verifyBackupCode(userId, backupCode);
      } else {
        // Verify with TOTP code
        verified = await authManager.verifyMFA(verificationCode);
      }
      
      if (verified) {
        // Redirect to the intended destination
        router.push(redirectTo);
      } else {
        setError(useBackupCode ? 'Invalid backup code' : 'Invalid verification code');
      }
    } catch (err) {
      console.error('MFA verification error:', err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCodeType = () => {
    setUseBackupCode(!useBackupCode);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Identity</CardTitle>
          <CardDescription>
            Please enter the verification code from your authenticator app to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {useBackupCode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-code">Backup Code</Label>
                <Input
                  id="backup-code"
                  placeholder="Enter your backup code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter the 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            variant="link"
            className="mt-4 p-0 h-auto"
            onClick={toggleCodeType}
          >
            {useBackupCode
              ? "Use authenticator app instead"
              : "Lost your device? Use a backup code"}
          </Button>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={
              isLoading ||
              (useBackupCode ? !backupCode : !verificationCode)
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}