'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verifyQRCode } from '@/lib/qrcode';
import { AlertTriangle, Camera, Check, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the HTML5QrcodeScanner to avoid SSR issues
const QrScanner = dynamic<any>(() => 
  import('html5-qrcode').then((mod) => {
    // Return a wrapper component that uses Html5QrcodeScanner
    return function QrScannerComponent(props: any) {
      return <div id="qr-reader" {...props} />;
    };
  }),
  { ssr: false }
);

interface QRCodeScannerProps {
  onScanSuccess: (batchId: string, isValid: boolean) => void;
}

export function QRCodeScanner({ onScanSuccess }: QRCodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [scanResult, setScanResult] = useState<{ batchId: string; isValid: boolean } | null>(null);
  const [scanner, setScanner] = useState<any>(null);
  
  // Start the QR code scanning
  const startScanning = async () => {
    setError('');
    setScanResult(null);
    
    try {
      if (!scannerRef.current) return;
      
      // Clear previous scanner instance if it exists
      if (scanner) {
        scanner.clear();
      }
      
      // Load the Html5QrcodeScanner dynamically
      const Html5QrcodeScanner = (await import('html5-qrcode')).Html5QrcodeScanner;
      
      // Create a new scanner instance
      const qrScanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: 250,
          rememberLastUsedCamera: true,
          aspectRatio: 1.0
        },
        false
      );
      
      // Set up success callback
      qrScanner.render(async (decodedText: string) => {
        // Stop scanning after successful scan
        qrScanner.pause();
        
        try {
          // Verify the QR code
          const isValid = await verifyQRCode(decodedText, decodedText);
          
          // Set the scan result
          setScanResult({ batchId: decodedText, isValid });
          
          // Call the onScanSuccess callback
          onScanSuccess(decodedText, isValid);
        } catch (err) {
          console.error('Error verifying QR code:', err);
          setError('Failed to verify QR code. Please try again.');
        }
      }, (errorMessage: string) => {
        // Error callback - only set error for permanent failures, not transient scanning
        if (errorMessage.includes('Camera access denied') || 
            errorMessage.includes('No camera detected')) {
          setError(errorMessage);
        }
      });
      
      setScanner(qrScanner);
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      setError('Could not start QR scanner. Please ensure camera permissions are granted.');
    }
  };
  
  // Stop the QR code scanning
  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
    }
    setIsScanning(false);
  };
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="relative bg-muted rounded-md overflow-hidden">
          {/* This div will be replaced by the HTML5QrcodeScanner */}
          <div id="qr-reader" ref={scannerRef} className="w-full"></div>
          
          {!isScanning && !scanResult && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Camera is off</p>
            </div>
          )}
          
          {scanResult && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
              <div className={`rounded-full p-2 mb-2 ${scanResult.isValid ? 'bg-green-500' : 'bg-red-500'}`}>
                {scanResult.isValid ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>
              <p className="font-medium text-center">
                {scanResult.isValid ? 'Valid QR Code' : 'Invalid QR Code'}
              </p>
              <p className="text-sm opacity-80 text-center mt-1">
                {scanResult.batchId}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} disabled={!!scanResult}>
              <Camera className="mr-2 h-4 w-4" />
              {scanResult ? 'Scan Complete' : 'Start Scanning'}
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanning}>
              Cancel
            </Button>
          )}
          
          {scanResult && (
            <Button variant="outline" onClick={() => {
              setScanResult(null);
            }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}