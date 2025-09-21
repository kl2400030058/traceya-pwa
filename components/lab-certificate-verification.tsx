"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LabCertificate } from "@/models/LabCertificate"
import { labCertificateService } from "@/services/labcertificateservice"
import { formatTimestamp } from "@/lib/utils"
import { FileText, CheckCircle, AlertCircle, RefreshCw, Shield, Download, ExternalLink } from "lucide-react"

interface LabCertificateVerificationProps {
  certificate: LabCertificate
  onVerificationComplete?: (verified: boolean) => void
}

export function LabCertificateVerification({ 
  certificate, 
  onVerificationComplete 
}: LabCertificateVerificationProps) {
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    setVerifying(true)
    setError(null)
    
    try {
      // Use the labCertificateService to verify the certificate
      const isVerified = await labCertificateService.verifyCertificate(certificate.id)
      setVerified(isVerified)
      
      if (onVerificationComplete) {
        onVerificationComplete(isVerified)
      }
    } catch (error) {
      console.error("Verification failed:", error)
      setError("Failed to verify certificate on blockchain")
      setVerified(false)
      
      if (onVerificationComplete) {
        onVerificationComplete(false)
      }
    } finally {
      setVerifying(false)
    }
  }

  const getStatusColor = () => {
    if (verified === true) return "text-green-600"
    if (verified === false) return "text-red-600"
    return "text-amber-600"
  }

  const getStatusBadge = () => {
    if (certificate.verified) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Verified</Badge>
    }
    if (certificate.blockchainTxId) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Anchored</Badge>
    }
    if (certificate.certificateHash) {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Ready for Anchoring</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pending</Badge>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Lab Certificate</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
          </Alert>
        )}
        
        {verified === true && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              Certificate verified on blockchain. Tamper-proof and authentic.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Certificate ID</p>
            <p className="text-sm font-mono">{certificate.id}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Event ID</p>
            <p className="text-sm font-mono">{certificate.eventId}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Uploaded By</p>
            <p className="text-sm">{certificate.uploadedBy}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Certificate Type</p>
            <p className="text-sm capitalize">{certificate.certificateType}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Upload Date</p>
            <p className="text-sm">{formatTimestamp(new Date(certificate.uploadDate))}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Blockchain Status</p>
            <div className="flex items-center gap-1">
              <Shield className={`h-4 w-4 ${getStatusColor()}`} />
              <p className="text-sm capitalize">{certificate.verified ? "Verified" : certificate.blockchainTxId ? "Anchored" : "Pending"}</p>
            </div>
          </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="test-results">
            <AccordionTrigger className="text-sm font-medium">Test Results</AccordionTrigger>
            <AccordionContent>
              <div className="p-3 bg-gray-50 rounded-md">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(certificate.qualityMetrics, null, 2)}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="blockchain-details">
            <AccordionTrigger className="text-sm font-medium">Blockchain Details</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {certificate.blockchainTxId ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Transaction ID</p>
                    <p className="text-xs font-mono break-all">{certificate.blockchainTxId}</p>
                    <Button variant="link" size="sm" className="h-6 p-0 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Explorer
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Not yet anchored to blockchain</p>
                )}
                
                {certificate.certificateHash && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Certificate Hash</p>
                    <p className="text-xs font-mono break-all">{certificate.certificateHash}</p>
                  </div>
                )}
                
                {certificate.merkleProof && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Merkle Proof</p>
                    <p className="text-xs font-mono break-all">{JSON.stringify(certificate.merkleProof)}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="border rounded-md p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Attached Files</p>
            <Button variant="outline" size="sm" className="h-7">
              <Download className="h-3.5 w-3.5 mr-1" />
              Download All
            </Button>
          </div>
          
          {certificate.files && certificate.files.length > 0 && (
            <div className="space-y-2">
              {certificate.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="truncate max-w-[300px]">{file.name}</span>
                    <Badge variant="outline" className="ml-2">{file.type}</Badge>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleVerify} 
          disabled={verifying || !certificate.blockchainTxId}
        >
          {verifying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verifying
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Verify on Blockchain
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}