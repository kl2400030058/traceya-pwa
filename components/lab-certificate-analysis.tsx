'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LabCertificate } from '@/models/LabCertificate';
import { labCertificateService } from '@/services/labcertificateservice';
import { AlertCircle, CheckCircle, RefreshCw, LineChart, AlertTriangle, Zap } from 'lucide-react';
import { ProcessingEvent } from '@/models/ProcessingEvent';
import { generateAutomatedAlerts, calculatePredictiveQualityScore } from '@/lib/aiAnalysis';

interface LabCertificateAnalysisProps {
  certificate: LabCertificate;
  processingEvents?: ProcessingEvent[];
  onAnalysisComplete?: (certificate: LabCertificate) => void;
}

export function LabCertificateAnalysis({
  certificate,
  processingEvents = [],
  onAnalysisComplete
}: LabCertificateAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [alerts, setAlerts] = useState<{message: string; level: 'info' | 'warning' | 'critical'; timestamp: number}[]>([]);
  const [predictiveScore, setPredictiveScore] = useState<{score: number; insights: string[]; confidenceLevel: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to analyze the certificate
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Use the labCertificateService to analyze the certificate
      const analysisResult = await labCertificateService.analyzeCertificate(certificate.id);
      
      // Create a new certificate with the analysis data
      const analyzedCertificate = {
        ...certificate,
        qualityMetrics: analysisResult.qualityMetrics
      };
      
      // Generate automated alerts
      const alertsResult = await generateAutomatedAlerts(analysisResult);
      setAlerts(alertsResult.alerts);
      
      // Calculate predictive quality score if we have processing events
      if (processingEvents && processingEvents.length > 0) {
        const scoreResult = await calculatePredictiveQualityScore(
          certificate.eventId,
          [certificate],
          processingEvents
        );
        setPredictiveScore(scoreResult);
      }
      
      if (onAnalysisComplete) {
        onAnalysisComplete(analyzedCertificate);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setError("Failed to analyze certificate");
    } finally {
      setAnalyzing(false);
    }
  };

  // Function to render severity badge
  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Medium
          </Badge>
        );
      case 'low':
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Low
          </Badge>
        );
    }
  };

  // Function to render alert level badge
  const renderAlertLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Critical
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Warning
          </Badge>
        );
      case 'info':
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Info
          </Badge>
        );
    }
  };

  // Function to render confidence level badge
  const renderConfidenceLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            High Confidence
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Medium Confidence
          </Badge>
        );
      case 'low':
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Low Confidence
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">AI Analysis</CardTitle>
            <CardDescription>Quality metrics and anomaly detection</CardDescription>
          </div>
          {certificate.qualityMetrics && Object.keys(certificate.qualityMetrics).length > 0 ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Analyzed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Not Analyzed
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
          </Alert>
        )}
        
        {certificate.qualityMetrics && Object.keys(certificate.qualityMetrics).length > 0 ? (
          <div className="space-y-6">
            {/* Quality Metrics Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Quality Metrics</h3>
              
              {certificate.qualityMetrics.overallQuality !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Quality</span>
                    <span className="text-sm font-medium">
                      {certificate.qualityMetrics.overallQuality}/100
                    </span>
                  </div>
                  <Progress 
                    value={certificate.qualityMetrics.overallQuality} 
                    className={`h-2 ${certificate.qualityMetrics.overallQuality > 80 ? 'bg-green-100' : 
                      certificate.qualityMetrics.overallQuality > 60 ? 'bg-amber-100' : 'bg-red-100'}`}
                  />
                </div>
              )}
              
              {certificate.qualityMetrics.moistureLevel !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Moisture Level</span>
                    <span className="text-sm font-medium">
                      {certificate.qualityMetrics.moistureLevel.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, certificate.qualityMetrics.moistureLevel * 6.67)} 
                    className={`h-2 ${certificate.qualityMetrics.moistureLevel < 10 ? 'bg-green-100' : 
                      certificate.qualityMetrics.moistureLevel < 12 ? 'bg-amber-100' : 'bg-red-100'}`}
                  />
                </div>
              )}
              
              {certificate.qualityMetrics.pesticidesLevel !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pesticides Level</span>
                    <span className="text-sm font-medium">
                      {certificate.qualityMetrics.pesticidesLevel.toFixed(2)} ppm
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, certificate.qualityMetrics.pesticidesLevel * 200)} 
                    className={`h-2 ${certificate.qualityMetrics.pesticidesLevel < 0.3 ? 'bg-green-100' : 
                      certificate.qualityMetrics.pesticidesLevel < 0.4 ? 'bg-amber-100' : 'bg-red-100'}`}
                  />
                </div>
              )}
              
              {certificate.qualityMetrics.purityScore !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Purity Score</span>
                    <span className="text-sm font-medium">
                      {certificate.qualityMetrics.purityScore.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={certificate.qualityMetrics.purityScore} 
                    className={`h-2 ${certificate.qualityMetrics.purityScore > 85 ? 'bg-green-100' : 
                      certificate.qualityMetrics.purityScore > 75 ? 'bg-amber-100' : 'bg-red-100'}`}
                  />
                </div>
              )}
              
              {certificate.qualityMetrics.potencyScore !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Potency Score</span>
                    <span className="text-sm font-medium">
                      {certificate.qualityMetrics.potencyScore.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={certificate.qualityMetrics.potencyScore} 
                    className={`h-2 ${certificate.qualityMetrics.potencyScore > 80 ? 'bg-green-100' : 
                      certificate.qualityMetrics.potencyScore > 70 ? 'bg-amber-100' : 'bg-red-100'}`}
                  />
                </div>
              )}
              
              {certificate.qualityMetrics.contaminationRisk !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Contamination Risk</span>
                    <span className="text-sm font-medium">
                      {certificate.qualityMetrics.contaminationRisk.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={certificate.qualityMetrics.contaminationRisk * 5} 
                    className={`h-2 ${certificate.qualityMetrics.contaminationRisk < 10 ? 'bg-green-100' : 
                      certificate.qualityMetrics.contaminationRisk < 15 ? 'bg-amber-100' : 'bg-red-100'}`}
                  />
                </div>
              )}
            </div>
            
            {/* Recommendations Section */}
            {certificate.qualityMetrics.recommendations && Array.isArray(certificate.qualityMetrics.recommendations) && certificate.qualityMetrics.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Recommendations</h3>
                <ul className="space-y-1 text-sm">
                  {certificate.qualityMetrics.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Anomalies Section */}
            {certificate.anomalyFlags && certificate.anomalyFlags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Detected Anomalies</h3>
                <div className="space-y-2">
                  {certificate.anomalyFlags && certificate.anomalyFlags.map((anomaly, index) => {
                    // Handle string anomalies
                    if (typeof anomaly === 'string') {
                      return (
                        <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded-md border border-red-100">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{anomaly}</p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle object anomalies (from AI service)
                    return (
                      <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded-md border border-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">{(anomaly as any).field}</span>
                            {(anomaly as any).severity && renderSeverityBadge((anomaly as any).severity)}
                          </div>
                          <p className="text-sm text-gray-700">{(anomaly as any).description || String(anomaly)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Alerts Section */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Automated Alerts</h3>
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-amber-50 rounded-md border border-amber-100">
                      <Zap className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{new Date(alert.timestamp).toLocaleString()}</span>
                          {renderAlertLevelBadge(alert.level)}
                        </div>
                        <p className="text-sm text-gray-700">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Predictive Score Section */}
            {predictiveScore && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Predictive Quality Score</h3>
                  {renderConfidenceLevelBadge(predictiveScore.confidenceLevel)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Predicted Quality</span>
                    <span className="text-sm font-medium">
                      {predictiveScore.score.toFixed(1)}/100
                    </span>
                  </div>
                  <Progress 
                    value={predictiveScore.score} 
                    className={`h-2 ${predictiveScore.score > 80 ? 'bg-green-100' : 
                      predictiveScore.score > 60 ? 'bg-amber-100' : 'bg-red-100'}`}
                  />
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="insights">
                    <AccordionTrigger className="text-sm">Quality Insights</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1 text-sm">
                        {predictiveScore.insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <LineChart className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <LineChart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No AI analysis has been performed on this certificate yet.</p>
            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing || !certificate.verified}
              className="mx-auto"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <LineChart className="mr-2 h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
            {!certificate.verified && (
              <p className="text-xs text-amber-600 mt-2 flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Certificate must be verified before analysis
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}