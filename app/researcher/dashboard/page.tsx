/**
 * Researcher Dashboard Page
 * Displays lab certificates, blockchain status, and AI analysis results
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LabCertificate } from '@/models/LabCertificate';
import { labCertificateService } from '@/services/labcertificateservice';
import aiService from '@/services/aiService';
import { AnomalyDetectionResult, AIAnalysisResult } from '@/services/aiService';

import { useRouter } from 'next/navigation';
import { QRCodeDisplay } from '@/components/consumer/QRCodeDisplay';
import qrCodeGenerator from '@/utils/qrCodeGenerator';

export default function ResearcherDashboard() {
  const [certificates, setCertificates] = useState<LabCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<LabCertificate | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const router = useRouter();

  // Load certificates on component mount
  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const allCertificates = await labCertificateService.getAllCertificates();
        // Convert to LabCertificate type
        setCertificates(allCertificates as unknown as LabCertificate[]);
      } catch (error) {
        console.error('Error loading certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  // Analyze a certificate with AI
  const analyzeCertificate = async (certificate: LabCertificate) => {
    setSelectedCertificate(certificate);
    setAnalysisLoading(true);

    try {
      // Use aiService directly to get AIAnalysisResult
      const result = await aiService.analyzeLabCertificate(certificate);
      setAnalysisResult(result as unknown as AIAnalysisResult);
      // Also update the certificate with labCertificateService
      await labCertificateService.analyzeCertificate(certificate.id);
    } catch (error) {
      console.error('Error analyzing certificate:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Navigate to certificate details
  const viewCertificateDetails = (certificate: LabCertificate) => {
    router.push(`/researcher/certificate/${certificate.id}`);
  };

  // Generate QR code for a certificate
  const generateQRCode = (certificate: LabCertificate) => {
    // Use the QR code generator utility to create a QR code for the certificate
    const qrCode = qrCodeGenerator.generateLabCertificateQRCode(certificate.id, {
      certificateType: certificate.certificateType,
      eventId: certificate.eventId,
      blockchainTxId: certificate.blockchainTxId,
      verified: certificate.verified
    });
    
    setQrCodeUrl(qrCode);
    setSelectedCertificate(certificate);
    setShowQrCode(true);
  };

  // Render the blockchain status badge
  const renderBlockchainStatus = (certificate: LabCertificate) => {
    if (certificate.blockchainTxId) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Anchored to Blockchain
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Not Anchored
        </Badge>
      );
    }
  };

  // Render the verification status badge
  const renderVerificationStatus = (certificate: LabCertificate) => {
    if (certificate.verified) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Unverified
        </Badge>
      );
    }
  };

  // Render quality metrics from AI analysis
  const renderQualityMetrics = (metrics: any) => {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Overall Quality</span>
            <span className="text-sm font-medium">{metrics.overallQuality}%</span>
          </div>
          <Progress value={metrics.overallQuality} className="h-2" />
        </div>

        {metrics.moistureLevel !== undefined && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Moisture Level</span>
              <span className="text-sm font-medium">{metrics.moistureLevel.toFixed(2)}%</span>
            </div>
            <Progress value={(metrics.moistureLevel / 15) * 100} className="h-2" />
          </div>
        )}

        {metrics.pesticidesLevel !== undefined && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Pesticides Level</span>
              <span className="text-sm font-medium">{metrics.pesticidesLevel.toFixed(3)} ppm</span>
            </div>
            <Progress value={(metrics.pesticidesLevel / 0.5) * 100} className="h-2" />
          </div>
        )}

        {metrics.purityScore !== undefined && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Purity Score</span>
              <span className="text-sm font-medium">{metrics.purityScore.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.purityScore} className="h-2" />
          </div>
        )}

        {metrics.recommendations && metrics.recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Recommendations:</h4>
            <ul className="text-sm space-y-1">
              {metrics.recommendations?.map((rec: string, index: number) => (
                <li key={index} className="text-gray-700">{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render anomalies from AI analysis
  const renderAnomalies = (anomalyResult: AnomalyDetectionResult) => {
    if (!anomalyResult.hasAnomalies) {
      return (
        <Alert className="bg-green-50 border-green-200">
          <AlertTitle>No Anomalies Detected</AlertTitle>
          <AlertDescription>
            All parameters are within expected ranges.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTitle>Anomalies Detected</AlertTitle>
          <AlertDescription>
            {anomalyResult.anomalies.length} issue(s) found that require attention.
          </AlertDescription>
        </Alert>

        {anomalyResult.anomalies.map((anomaly, index) => (
          <Alert key={index} className={`bg-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'yellow' : 'blue'}-50 border-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'yellow' : 'blue'}-200`}>
            <AlertTitle>{anomaly.field}</AlertTitle>
            <AlertDescription>
              <p>{anomaly.description}</p>
              {anomaly.expectedRange && anomaly.actualValue && (
                <p className="text-sm mt-1">
                  Expected: {anomaly.expectedRange[0]} - {anomaly.expectedRange[1]}, 
                  Actual: {String(anomaly.actualValue)}
                </p>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Researcher Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lab Certificates</CardTitle>
              <CardDescription>
                View and analyze lab certificates for herb batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading certificates...</div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-4">No certificates found</div>
              ) : (
                <div className="space-y-4">
                  {certificates.map((certificate) => (
                    <Card key={certificate.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {certificate.primaryFileName || 'Untitled Certificate'}
                            </CardTitle>
                            <CardDescription>
                              Event ID: {certificate.eventId}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            {renderBlockchainStatus(certificate)}
                            {renderVerificationStatus(certificate)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Certificate Type:</span>{' '}
                            {certificate.certificateType}
                          </div>
                          <div>
                            <span className="font-medium">Upload Date:</span>{' '}
                            {new Date(certificate.uploadDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Uploaded By:</span>{' '}
                            {certificate.uploadedBy}
                          </div>
                          <div>
                            <span className="font-medium">Version:</span>{' '}
                            {certificate.version}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => viewCertificateDetails(certificate)}>
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => generateQRCode(certificate)}
                          >
                            QR Code
                          </Button>
                        </div>
                        <Button 
                          variant="default" 
                          onClick={() => analyzeCertificate(certificate)}
                          disabled={analysisLoading && selectedCertificate?.id === certificate.id}
                        >
                          {analysisLoading && selectedCertificate?.id === certificate.id
                            ? 'Analyzing...'
                            : 'Analyze with AI'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                AI-powered insights and anomaly detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCertificate ? (
                <div className="text-center py-4">
                  Select a certificate to analyze
                </div>
              ) : analysisLoading ? (
                <div className="text-center py-4">
                  Analyzing certificate...
                </div>
              ) : !analysisResult ? (
                <div className="text-center py-4">
                  No analysis results available
                </div>
              ) : (
                <Tabs defaultValue="quality">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
                    <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                  </TabsList>
                  <TabsContent value="quality" className="pt-4">
                    <div className="mb-4">
                      <Badge variant={analysisResult.passesQualityGates ? 'default' : 'destructive'}>
                        {analysisResult.passesQualityGates ? 'Passes Quality Gates' : 'Failed Quality Gates'}
                      </Badge>
                      <div className="text-sm text-gray-500 mt-1">
                        Confidence: {(analysisResult.confidenceScore * 100).toFixed(1)}%
                      </div>
                    </div>
                    <Separator className="my-4" />
                    {renderQualityMetrics(analysisResult.qualityMetrics)}
                  </TabsContent>
                  <TabsContent value="anomalies" className="pt-4">
                    {analysisResult.anomalyDetection && renderAnomalies(analysisResult.anomalyDetection)}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {showQrCode && selectedCertificate && (
            <Card className="mt-6">
              <QRCodeDisplay
                batchId={selectedCertificate.id}
                qrCodeUrl={qrCodeUrl}
                title={`Certificate QR Code: ${selectedCertificate.certificateType}`}
                description="Scan this QR code to verify the lab certificate authenticity"
              />
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <div className="text-sm">
                    <p className="font-medium">New certificate uploaded</p>
                    <p className="text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  <div className="text-sm">
                    <p className="font-medium">Certificate verified on blockchain</p>
                    <p className="text-gray-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="text-sm">
                    <p className="font-medium">Anomaly detected in moisture levels</p>
                    <p className="text-gray-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}