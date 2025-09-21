"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FileUploader } from "@/components/file-uploader"
import { LabCertificate } from "@/models/LabCertificate"
import { labCertificateService } from "@/services/labcertificateservice"
import { hashFile } from "@/lib/crypto"
import { Upload, FileCheck, FileX, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface LabCertificateUploadProps {
  eventId: string
  onCertificateUploaded?: (certificate: LabCertificate) => void
}

export function LabCertificateUpload({ eventId, onCertificateUploaded }: LabCertificateUploadProps) {
  const [testType, setTestType] = useState<"dna" | "pesticide" | "moisture" | "other">("dna")
  const [notes, setNotes] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [fileHashes, setFileHashes] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [certificate, setCertificate] = useState<LabCertificate | null>(null)
  const [blockchainStatus, setBlockchainStatus] = useState<"pending" | "processing" | "anchored" | "verified" | "failed">("pending")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (files: File[]) => {
    setFiles(files)
    setFileHashes([])
    
    // Generate hashes for each file
    const hashes: string[] = []
    for (const file of files) {
      try {
        const hash = await generateFileHash(file)
        hashes.push(hash)
      } catch (error) {
        console.error("Failed to generate file hash:", error)
        setError("Failed to generate file hash")
        return
      }
    }
    
    setFileHashes(hashes)
  }

  const generateFileHash = async (file: File): Promise<string> => {
    try {
      // Convert File to ArrayBuffer before hashing
      const arrayBuffer = await file.arrayBuffer();
      return await hashFile(arrayBuffer);
    } catch (error) {
      console.error("Failed to hash file:", error);
      throw new Error("Failed to generate file hash");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (files.length === 0) {
      setError("Please upload at least one file")
      return
    }
    
    setError(null)
    setUploading(true)
    setProgress(10)
    
    try {
      // Simulate file upload
      await simulateUpload()
      setProgress(70)
      
      // Create certificate object
      const newCertificate = new LabCertificate({
        id: crypto.randomUUID(),
        eventId,
        uploadedBy: 'current-user', // Adding the required field
        certificateType: testType,
        files: [{
          name: files[0].name,
          type: files[0].type,
          size: files[0].size,
          hash: fileHashes[0]
        }],
        primaryFileName: files[0].name,
        uploadDate: Date.now(),
        notes,
        version: 1
      })
      
      // Update the hash
      newCertificate.updateHash()
      
      // Save to database first
      await labCertificateService.saveCertificate(newCertificate)
      
      setCertificate(newCertificate)
      setProgress(80)
      
      // Anchor to blockchain
      setBlockchainStatus("processing")
      try {
        const blockchainResult = await labCertificateService.anchorCertificateToBlockchain(newCertificate.id)
        
        // Update UI with the anchored certificate
        setBlockchainStatus("anchored")
        if (blockchainResult) {
          // Update the certificate with blockchain information
          const updatedCertificate = {
            ...newCertificate,
            blockchainTxId: blockchainResult.txHash,
            blockchainAnchorDate: blockchainResult.timestamp.getTime()
          };
          
          setCertificate(updatedCertificate)
          setSuccess(true)
          
          if (onCertificateUploaded) {
            onCertificateUploaded(updatedCertificate)
          }
        } else {
          throw new Error("Failed to anchor certificate")
        }
      } catch (error) {
        console.error("Failed to anchor certificate:", error)
        setBlockchainStatus("failed")
        setError(`Failed to anchor certificate: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      setProgress(100)
    } catch (error) {
      console.error("Certificate upload failed:", error)
      setError("Failed to upload certificate")
      setBlockchainStatus("failed")
    } finally {
      setUploading(false)
    }
  }

  const simulateUpload = async () => {
    // Simulate a file upload with progress
    return new Promise<void>((resolve) => {
      let currentProgress = 10
      
      const interval = setInterval(() => {
        currentProgress += 10
        setProgress(Math.min(currentProgress, 70))
        
        if (currentProgress >= 70) {
          clearInterval(interval)
          resolve()
        }
      }, 300)
    })
  }

  const resetForm = () => {
    setTestType("dna")
    setNotes("")
    setFiles([])
    setFileHashes([])
    setError(null)
    setSuccess(false)
    setCertificate(null)
    setBlockchainStatus("pending")
    setProgress(0)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Upload Lab Certificate</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && certificate && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              Certificate successfully anchored to blockchain with transaction ID: <Badge variant="outline" className="ml-1 font-mono text-xs">{certificate.blockchainTxId}</Badge>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testType">Test Type</Label>
            <Select 
              value={testType} 
              onValueChange={(value) => setTestType(value as any)}
              disabled={uploading || success}
            >
              <SelectTrigger id="testType">
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dna">DNA Barcoding</SelectItem>
                <SelectItem value="pesticide">Pesticide Analysis</SelectItem>
                <SelectItem value="moisture">Moisture Level</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="files">Upload Files (PDF, Images, JSON)</Label>
            <div className="border rounded-md p-4 bg-gray-50">
              <FileUploader 
                onFilesSelected={handleFileChange}
                maxFiles={5}
                acceptedFileTypes={[".pdf", ".jpg", ".jpeg", ".png", ".json"]}
                disabled={uploading || success}
              />
              
              {files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        {file.type.includes("pdf") ? (
                          <FileCheck className="h-4 w-4 text-blue-500" />
                        ) : file.type.includes("image") ? (
                          <FileCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <FileCheck className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Test Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter test details and observations"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={uploading || success}
              className="min-h-[100px]"
            />
          </div>
          
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading and anchoring to blockchain...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {blockchainStatus === "pending" && "Preparing"}
                  {blockchainStatus === "processing" && "Anchoring to Blockchain"}
                  {blockchainStatus === "anchored" && "Anchored Successfully"}
                  {blockchainStatus === "failed" && "Anchoring Failed"}
                </Badge>
                {blockchainStatus === "processing" && (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {success ? (
          <Button onClick={resetForm} variant="outline">
            Upload Another Certificate
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={resetForm} disabled={uploading}>
              Reset
            </Button>
            <Button onClick={handleSubmit} disabled={uploading || files.length === 0}>
              {uploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Verify
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}