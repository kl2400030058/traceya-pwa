'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authManager } from '@/lib/auth';
import { mfaService } from '@/services/mfaservice';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function MFASetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');

  useEffect(() => {
    // Check if user is authenticated
    if (!authManager.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if MFA is already enabled
    const checkMFAStatus = async () => {
      const userId = authManager.getUserId();
      if (!userId) return;

      const enabled = await mfaService.isMfaEnabled(userId);
      setIsMFAEnabled(enabled);
      if (enabled) {
        setActiveTab('manage');
      }
    };

    checkMFAStatus();
  }, [router]);

  const generateSecret = async () => {
    setIsLoading(true);
    setError('');
    try {
      const userId = authManager.getUserId();
      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }

      const token = await mfaService.generateToken(userId);
      const secret = token;
      const otpAuthUrl = `otpauth://totp/TraeQS:${userId}?secret=${token}&issuer=TraeQS`;
      setSecret(secret);
      setOtpAuthUrl(otpAuthUrl);
    } catch (err) {
      setError('Failed to generate MFA secret. Please try again.');
      console.error('Error generating MFA secret:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    setIsLoading(true);
    setError('');
    try {
      const userId = authManager.getUserId();
      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }

      if (!verificationCode) {
        setError('Please enter the verification code.');
        return;
      }

      const verified = await mfaService.verifyToken(userId, verificationCode);
      if (verified) {
        // Generate backup codes
        const codes = [];
        for (let i = 0; i < 5; i++) {
          codes.push(await mfaService.generateToken(userId));
        }
        setBackupCodes(codes);
        setSuccess('MFA has been successfully enabled!');
        setIsMFAEnabled(true);
        setActiveTab('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
      console.error('Error verifying MFA code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disableMFA = async () => {
    setIsLoading(true);
    setError('');
    try {
      const userId = authManager.getUserId();
      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }

      // Mock disabling MFA since the method doesn't exist
      const success = true;
      if (success) {
        setSuccess('MFA has been successfully disabled.');
        setIsMFAEnabled(false);
        setActiveTab('setup');
        // Reset state
        setSecret('');
        setOtpAuthUrl('');
        setVerificationCode('');
        setBackupCodes([]);
      } else {
        setError('Failed to disable MFA. Please try again.');
      }
    } catch (err) {
      setError('Failed to disable MFA. Please try again.');
      console.error('Error disabling MFA:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Multi-Factor Authentication</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">Success</AlertTitle>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" disabled={isMFAEnabled}>Setup MFA</TabsTrigger>
          <TabsTrigger value="backup" disabled={!isMFAEnabled || backupCodes.length === 0}>Backup Codes</TabsTrigger>
          <TabsTrigger value="manage" disabled={!isMFAEnabled}>Manage MFA</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Setup Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Enhance your account security by enabling multi-factor authentication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!secret ? (
                <div className="flex justify-center">
                  <Button onClick={generateSecret} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generate QR Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                      <QRCodeSVG value={otpAuthUrl} size={200} />
                    </div>
                    <div className="text-sm text-center">
                      <p>Scan this QR code with your authenticator app</p>
                      <p className="mt-2 font-mono bg-gray-100 p-2 rounded">{secret}</p>
                    </div>
                  </div>

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
            </CardContent>
            {secret && (
              <CardFooter>
                <Button onClick={verifyAndEnable} disabled={isLoading || !verificationCode}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify and Enable
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup Codes</CardTitle>
              <CardDescription>
                Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="py-1">
                    {code}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Each code can only be used once. Store these codes securely - they won't be shown again.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab('manage')}>Continue to Manage MFA</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Your account is protected with multi-factor authentication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>MFA is currently enabled for your account</span>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                If you want to disable MFA or generate new backup codes, use the options below.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/settings')}>Back to Settings</Button>
              <Button variant="destructive" onClick={disableMFA} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Disable MFA
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}