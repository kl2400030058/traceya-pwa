'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ipfsService, IPFSUploadResult } from '@/services/ipfsservice';
import { authManager } from '@/lib/auth';
import { Upload, X, Check, AlertCircle, FileIcon, Image, Film, FileText } from 'lucide-react';

// Interfaces
interface UploadProgress {
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

// Define IPFSFile interface
interface IPFSFile {
  cid: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

interface IPFSFileUploaderProps {
  resourceType: string;
  resourceId: string;
  onUploadComplete?: (files: IPFSFile[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
  showPreview?: boolean;
  metadata?: any;
}

const IPFSFileUploader: React.FC<IPFSFileUploaderProps> = ({
  resourceType,
  resourceId,
  onUploadComplete,
  maxFiles = 5,
  acceptedFileTypes = '*',
  showPreview = true,
  metadata = {}
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [uploadedFiles, setUploadedFiles] = useState<IPFSFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize IPFS and load existing files
  useEffect(() => {
    const init = async () => {
      try {
        await ipfsService.initialize();
      } catch (err) {
        console.error('Failed to initialize IPFS:', err);
        setError('Failed to initialize IPFS service. Please try again later.');
      }

      try {
        const files = await ipfsService.getUserFiles(resourceId);
        const formattedFiles: IPFSFile[] = files.map(f => ({
          cid: f.cid,
          name: f.cid.substring(0, 10),
          size: f.size || 0,
          type: 'application/octet-stream',
          url: f.url || ipfsService.getFileUrl(f.cid),
          uploadedAt: new Date()
        }));
        setUploadedFiles(formattedFiles);
        if (onUploadComplete) onUploadComplete(formattedFiles);
      } catch (err) {
        console.error('Failed to load existing files:', err);
      }
    };

    init();
  }, [resourceId, onUploadComplete]);

  // Add files
  const addFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length + uploadedFiles.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }
    setError(null);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const removeUploadedFile = (cid: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.cid !== cid);
      if (onUploadComplete) onUploadComplete(updated);
      return updated;
    });
  };

  // Drag & drop
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  };

  // File input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);
    const userId = authManager.getUserId() || 'anonymous';
    const uploadedFilesList: IPFSFile[] = [];

    try {
      const initialProgress: Record<string, UploadProgress> = {};
      files.forEach(file => initialProgress[file.name] = { progress: 0, status: 'pending' });
      setUploadProgress(initialProgress);

      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, [file.name]: { ...prev[file.name], status: 'uploading' } }));

        try {
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const current = prev[file.name]?.progress || 0;
              if (current < 90) return { ...prev, [file.name]: { ...prev[file.name], progress: current + 10 } };
              return prev;
            });
          }, 300);

          const result: IPFSUploadResult = await ipfsService.uploadFile(file);
          clearInterval(progressInterval);

          const ipfsFile: IPFSFile = {
            cid: result.cid,
            name: file.name,
            size: file.size,
            type: file.type,
            url: result.url,
            uploadedAt: new Date()
          };

          uploadedFilesList.push(ipfsFile);

          setUploadProgress(prev => ({ ...prev, [file.name]: { progress: 100, status: 'success' } }));
        } catch (err) {
          console.error('Upload error:', err);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress: 0, status: 'error', message: err instanceof Error ? err.message : 'Upload failed' }
          }));
        }
      }

      setUploadedFiles(prev => [...prev, ...uploadedFilesList]);
      setFiles([]);
      if (onUploadComplete) onUploadComplete(uploadedFilesList);

    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // File icons & previews
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (type.startsWith('video/')) return <Film className="h-6 w-6" />;
    if (type.startsWith('text/')) return <FileText className="h-6 w-6" />;
    return <FileIcon className="h-6 w-6" />;
  };

  // Create a separate component for file previews to properly use hooks
  const FilePreview = ({ file }: { file: File }) => {
    const objectUrl = URL.createObjectURL(file);
    
    // This is now correctly used at the component level
    useEffect(() => {
      return () => URL.revokeObjectURL(objectUrl);
    }, [objectUrl]);

    if (file.type.startsWith('image/')) {
      return <div className="relative h-20 w-20 rounded overflow-hidden bg-gray-100">
        <img src={objectUrl} alt={file.name} className="h-full w-full object-cover" />
      </div>;
    }
    return <div className="flex items-center justify-center h-20 w-20 rounded bg-gray-100">{getFileIcon(file.type)}</div>;
  };
  
  // This function now returns the component instead of directly using hooks
  const getFilePreview = (file: File) => {
    return <FilePreview file={file} />;
  };

  const getUploadedFilePreview = (file: IPFSFile) => {
    if (file.type.startsWith('image/')) {
      return <div className="relative h-20 w-20 rounded overflow-hidden bg-gray-100">
        <img src={ipfsService.getFileUrl(file.cid)} alt={file.name} className="h-full w-full object-cover" />
      </div>;
    }
    return <div className="flex items-center justify-center h-20 w-20 rounded bg-gray-100">{getFileIcon(file.type)}</div>;
  };

  return (
    <Card>
      <CardHeader><CardTitle>Upload Files to IPFS</CardTitle></CardHeader>
      <CardContent>
        {error && <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>}

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Drag and drop files here, or
            <Button variant="link" className="px-1" onClick={() => fileInputRef.current?.click()}>browse</Button>
          </p>
          <p className="text-xs text-gray-500">
            {maxFiles > 1 ? `Up to ${maxFiles} files` : 'One file'} • {acceptedFileTypes === '*' ? 'Any file type' : acceptedFileTypes}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple={maxFiles > 1}
            accept={acceptedFileTypes === '*' ? undefined : acceptedFileTypes}
            disabled={isUploading}
          />
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Selected Files</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    {showPreview && getFilePreview(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={isUploading}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Upload Progress</h3>
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="p-2 border rounded">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm truncate">{fileName}</p>
                    <span className="text-xs font-medium">
                      {progress.status === 'success' ? (
                        <span className="text-green-600 flex items-center"><Check className="h-3 w-3 mr-1" /> Complete</span>
                      ) : progress.status === 'error' ? (
                        <span className="text-red-600 flex items-center"><X className="h-3 w-3 mr-1" /> Failed</span>
                      ) : `${progress.progress}%`}
                    </span>
                  </div>
                  <Progress value={progress.progress} className={progress.status === 'success' ? 'bg-green-100' : progress.status === 'error' ? 'bg-red-100' : ''} />
                  {progress.message && <p className="text-xs text-red-600 mt-1">{progress.message}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Uploaded Files</h3>
            <div className="space-y-2">
              {uploadedFiles.map(file => (
                <div key={file.cid} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    {showPreview && getUploadedFilePreview(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      <a href={ipfsService.getFileUrl(file.cid)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View on IPFS</a>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeUploadedFile(file.cid)} disabled={isUploading}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload} disabled={files.length === 0 || isUploading} className="w-full">
          {isUploading ? 'Uploading...' : 'Upload to IPFS'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IPFSFileUploader;