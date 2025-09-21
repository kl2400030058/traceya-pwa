'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Share2 } from 'lucide-react';

interface QRCodeDisplayProps {
  batchId: string;
  qrCodeUrl: string;
  title?: string;
  description?: string;
}

export function QRCodeDisplay({ 
  batchId, 
  qrCodeUrl, 
  title = 'Batch QR Code',
  description = 'Scan this QR code to verify authenticity'
}: QRCodeDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `batch-${batchId.substring(0, 8)}-qrcode.png`;
    
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsDownloading(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Batch ${batchId.substring(0, 8)} QR Code`,
          text: 'Scan this QR code to verify the authenticity of this herb batch',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center p-6">
        <div className="border-4 border-white bg-white rounded-lg shadow-md p-2">
          <img 
            src={qrCodeUrl} 
            alt={`QR Code for batch ${batchId}`} 
            className="w-48 h-48"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 px-6 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}