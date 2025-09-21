"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthGuard } from "@/components/auth-guard"
import { LabCertificateUpload } from "@/components/lab-certificate-upload"
import { LabCertificateVerification } from "@/components/lab-certificate-verification"
import { LabCertificateAnalysis } from "@/components/lab-certificate-analysis"
import { LabCertificate } from "@/models/LabCertificate"
import { db } from "@/lib/db"
import { authManager } from "@/lib/auth"
import { FileText, Plus, RefreshCw, Search, LineChart } from "lucide-react"

export default function ResearcherLabPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [certificates, setCertificates] = useState<LabCertificate[]>([])
  const [selectedCertificate, setSelectedCertificate] = useState<LabCertificate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [batchId, setBatchId] = useState<string>("") // For certificate upload

  useEffect(() => {
    // Check if there's a batchId in the URL params
    const batchIdParam = searchParams.get("batchId")
    if (batchIdParam) {
      setBatchId(batchIdParam)
      setShowUpload(true)
    }
    
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, this would load from IndexedDB or API
      // For now, we'll use mock data
      const mockCertificates: LabCertificate[] = [
new LabCertificate({
          id: "cert_1234567890",
          eventId: "batch_123",
          uploadedBy: "lab_456",
          certificateType: "dna",
          files: [{
            name: "dna_results.pdf",
            type: "application/pdf",
            size: 1024000,
            hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          }],
          primaryFileName: "dna_results.pdf",
          uploadDate: Date.now() - 86400000, // 1 day ago
          certificateHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          blockchainTxId: "tx_9876543210",
          blockchainAnchorDate: Date.now() - 86000000,
          verified: true,
          verificationDate: Date.now() - 85000000,
          notes: "DNA barcoding confirms Withania somnifera species",
          version: 1
        }),
        new LabCertificate({
          id: "cert_0987654321",
          eventId: "batch_456",
          uploadedBy: "lab_456",
          certificateType: "pesticide",
          files: [{
            name: "pesticide_analysis.pdf",
            type: "application/pdf",
            size: 512000,
            hash: "a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          }],
          primaryFileName: "pesticide_analysis.pdf",
          uploadDate: Date.now() - 172800000, // 2 days ago
          certificateHash: "a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          blockchainTxId: "tx_1234567890",
          blockchainAnchorDate: Date.now() - 172000000,
          verified: true,
          verificationDate: Date.now() - 171000000,
          notes: "Pesticide analysis shows levels within acceptable range",
          version: 1
        })
      ];
      setCertificates(mockCertificates)
      
      // If there's a certificate ID in the URL, select it
      const certIdParam = searchParams.get("certId")
      if (certIdParam) {
        const cert = mockCertificates.find(c => c.id === certIdParam) || null
        setSelectedCertificate(cert)
      }
    } catch (error) {
      console.error("Failed to load certificates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCertificateUploaded = (certificate: LabCertificate) => {
    // Add the new certificate to the list
    setCertificates(prev => [certificate, ...prev])
    
    // Select the new certificate
    setSelectedCertificate(certificate)
    
    // Hide the upload form
    setShowUpload(false)
  }

  const handleCertificateSelect = (certificate: LabCertificate) => {
    setSelectedCertificate(certificate)
    setShowUpload(false)
    setShowAnalysis(false)
  }

  const handleNewCertificate = () => {
    setSelectedCertificate(null)
    setShowUpload(true)
    setShowAnalysis(false)
  }
  
  const handleShowAnalysis = () => {
    if (selectedCertificate) {
      setShowAnalysis(true)
      setShowUpload(false)
    }
  }
  
  const handleVerificationComplete = (verified: boolean) => {
    // Refresh the certificate data after verification
    if (verified && selectedCertificate) {
      loadCertificates()
    }
  }

  return (
    <AuthGuard>
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Laboratory Portal</h1>
          <Button
            onClick={handleNewCertificate}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            New Certificate
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Lab Certificates</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={loadCertificates}
                    disabled={isLoading}
                    className="h-8 w-8"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : certificates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No certificates found</p>
                    <Button
                      variant="link"
                      onClick={handleNewCertificate}
                      className="mt-2"
                    >
                      Upload your first certificate
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedCertificate?.id === cert.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted border border-transparent"
                        }`}
                        onClick={() => handleCertificateSelect(cert)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm capitalize">{cert.certificateType} Test</p>
                            <p className="text-xs text-muted-foreground">
                              Event: {cert.eventId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(cert.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            cert.verified ? "bg-green-100 text-green-800" :
                            cert.blockchainTxId ? "bg-blue-100 text-blue-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {cert.verified ? "Verified" : cert.blockchainTxId ? "Anchored" : "Pending"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            {showUpload ? (
              <LabCertificateUpload 
                eventId={batchId || "event_" + Date.now()}
                onCertificateUploaded={handleCertificateUploaded}
              />
            ) : selectedCertificate ? (
              <>
                {showAnalysis ? (
                  <LabCertificateAnalysis 
                    certificate={selectedCertificate}
                    onAnalysisComplete={(updatedCertificate) => {
                      // Refresh certificates after analysis
                      loadCertificates()
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <LabCertificateVerification 
                      certificate={selectedCertificate}
                      onVerificationComplete={handleVerificationComplete}
                    />
                    
                    {selectedCertificate.verified && (
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleShowAnalysis}
                          className="flex items-center gap-1"
                        >
                          <LineChart className="h-4 w-4" />
                          AI Analysis
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground text-center">
                    Select a certificate from the list or create a new one
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleNewCertificate}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Certificate
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}