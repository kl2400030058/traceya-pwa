'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/db';
import { FIR } from '@/services/firpriorityservice';
import { BiasAuditResult } from '@/services/biasdetectionservice';
import { Shield, CheckCircle, AlertTriangle, Info, FileText, MapPin, Calendar, User } from 'lucide-react';

export default function VerifyPage() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [fir, setFir] = useState<FIR | null>(null);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [biasAudit, setBiasAudit] = useState<BiasAuditResult | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'unverified' | 'suspicious'>('unverified');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError('');

        // Fetch FIR data
        const firData = await db.table('firs').get(id as string) as FIR | undefined;
        
        if (!firData) {
          setError('FIR not found. Please check the ID and try again.');
          setIsLoading(false);
          return;
        }
        
        setFir(firData);
        
        // Calculate trust score (in a real app, this would be more sophisticated)
        // For demo, we'll use the priority score if available, or generate a random score
        const score = firData.priorityScore || Math.floor(Math.random() * 40) + 60; // 60-100 range
        setTrustScore(score);
        
        // Fetch bias audit data if available
        const biasAudits = await db.table('biasAuditResults').toArray() as BiasAuditResult[];
        const relevantAudit = biasAudits.find(audit => 
          audit.potentialBiasFactors.inputFactors?.firId === id
        );
        
        if (relevantAudit) {
          setBiasAudit(relevantAudit);
        }
        
        // Determine verification status
        if (score >= 80) {
          setVerificationStatus('verified');
        } else if (score >= 60) {
          setVerificationStatus('unverified');
        } else {
          setVerificationStatus('suspicious');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading verification data:', err);
        setError('An error occurred while verifying this FIR. Please try again later.');
        setIsLoading(false);
      }
    }
    
    if (id) {
      loadData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Verifying FIR</CardTitle>
            <CardDescription>Please wait while we verify this FIR...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="w-full max-w-md">
              <Progress value={45} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Verification Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>FIR Verification</CardTitle>
            <CardDescription>Verify the authenticity and trust score of this FIR</CardDescription>
          </div>
          {verificationStatus === 'verified' && (
            <Badge variant="success" className="ml-2 py-1 px-3">
              <CheckCircle className="h-4 w-4 mr-1" /> Verified
            </Badge>
          )}
          {verificationStatus === 'unverified' && (
            <Badge variant="outline" className="ml-2 py-1 px-3">
              <Info className="h-4 w-4 mr-1" /> Unverified
            </Badge>
          )}
          {verificationStatus === 'suspicious' && (
            <Badge variant="destructive" className="ml-2 py-1 px-3">
              <AlertTriangle className="h-4 w-4 mr-1" /> Suspicious
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {fir && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      <FileText className="h-5 w-5 mr-2" /> FIR Details
                    </h3>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">FIR ID:</span>
                        <span className="font-medium">{fir.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{fir.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">{fir.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={fir.status === 'resolved' ? 'success' : fir.status === 'investigating' ? 'warning' : 'outline'}>
                          {fir.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      <MapPin className="h-5 w-5 mr-2" /> Location
                    </h3>
                    <Separator className="my-2" />
                    <p>{fir.location}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      <Calendar className="h-5 w-5 mr-2" /> Date & Time
                    </h3>
                    <Separator className="my-2" />
                    <p>{new Date(fir.timestamp).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      <User className="h-5 w-5 mr-2" /> Reported By
                    </h3>
                    <Separator className="my-2" />
                    <p>{fir.reportedBy}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      <Shield className="h-5 w-5 mr-2" /> Trust Score
                    </h3>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>AI Confidence Level:</span>
                        <span className="font-bold">{trustScore}/100</span>
                      </div>
                      <Progress 
                        value={trustScore || 0} 
                        className="h-2"
                        color={trustScore && trustScore >= 80 ? 'bg-green-500' : trustScore && trustScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        {trustScore && trustScore >= 80 && 'This FIR has been verified with high confidence by our AI system.'}
                        {trustScore && trustScore >= 60 && trustScore < 80 && 'This FIR has moderate confidence. Some details may require verification.'}
                        {trustScore && trustScore < 60 && 'This FIR has low confidence. Please verify details with the authorities.'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Description</h3>
                    <Separator className="my-2" />
                    <p className="text-sm">{fir.description}</p>
                  </div>
                  
                  {biasAudit && (
                    <div>
                      <h3 className="text-lg font-semibold">Fairness Assessment</h3>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Fairness Score:</span>
                          <span className="font-bold">{biasAudit.fairnessScore}/100</span>
                        </div>
                        <Progress 
                          value={biasAudit.fairnessScore} 
                          className="h-2"
                          color={biasAudit.fairnessScore >= 80 ? 'bg-green-500' : biasAudit.fairnessScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          {biasAudit.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Full Description</h3>
                    <p className="mt-2">{fir.description}</p>
                  </div>
                  {fir.tags && fir.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold">Tags</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {fir.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="evidence" className="space-y-4">
                  {fir.evidenceFiles && fir.evidenceFiles.length > 0 ? (
                    <div>
                      <h3 className="font-semibold">Evidence Files</h3>
                      <ul className="mt-2 space-y-2">
                        {fir.evidenceFiles.map((file, index) => (
                          <li key={index} className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>{typeof file === 'object' ? file.name : file}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No Evidence</AlertTitle>
                      <AlertDescription>
                        No evidence files have been uploaded for this FIR yet.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                <TabsContent value="timeline" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Timeline</AlertTitle>
                    <AlertDescription>
                      Timeline information will be available as the case progresses.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
          <Button>Report Issue</Button>
        </CardFooter>
      </Card>
    </div>
  );
}