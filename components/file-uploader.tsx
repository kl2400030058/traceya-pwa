"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
  disabled?: boolean
}

export function FileUploader({
  onFilesSelected,
  maxFiles = 5,
  acceptedFileTypes = [],
  disabled = false
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFiles = (files: File[]): File[] => {
    setError(null)
    
    // Check file count
    if (files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at once`)
      return files.slice(0, maxFiles)
    }
    
    // Check file types if specified
    if (acceptedFileTypes.length > 0) {
      const validFiles = files.filter(file => {
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
        return acceptedFileTypes.some(type => type === fileExtension || type === file.type)
      })
      
      if (validFiles.length < files.length) {
        setError(`Some files were rejected. Accepted formats: ${acceptedFileTypes.join(', ')}`)
        return validFiles
      }
      
      return validFiles
    }
    
    return files
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return
    
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files)
      const validFiles = validateFiles(filesArray)
      setSelectedFiles(validFiles)
      onFilesSelected(validFiles)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    
    if (disabled) return
    
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      const validFiles = validateFiles(filesArray)
      setSelectedFiles(validFiles)
      onFilesSelected(validFiles)
    }
  }

  const handleButtonClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const removeFile = (index: number) => {
    if (disabled) return
    
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
    
    // Reset the input to allow re-uploading the same file
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-md p-6 ${
          dragActive ? "border-primary bg-primary/5" : "border-gray-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          accept={acceptedFileTypes.join(",")}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium">
            Drag & drop files here, or click to select files
          </p>
          <p className="text-xs text-gray-500">
            {acceptedFileTypes.length > 0
              ? `Accepted formats: ${acceptedFileTypes.join(", ")}`
              : "All file types accepted"}
          </p>
          {maxFiles > 1 && (
            <p className="text-xs text-gray-500">
              Up to {maxFiles} files, max 10MB each
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
      
      {selectedFiles.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">
            {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} selected
          </p>
          <ul className="space-y-1">
            {selectedFiles.map((file, index) => (
              <li key={index} className="text-xs flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}