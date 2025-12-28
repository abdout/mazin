/**
 * Receipt Upload Form Component (Stubbed)
 *
 * TODO: Install/create @/components/file for file upload functionality
 * This stub allows the build to pass without the file upload dependencies
 */

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { uploadReceipt } from "./actions"

interface UploadFormProps {
  locale?: string
}

export function UploadForm({ locale = "en" }: UploadFormProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an image (JPG, PNG, WebP) or PDF file")
        return
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }
      setSelectedFile(file)
      toast.success("File selected! Ready to process.")
    }
  }

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.")
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const result = await uploadReceipt(formData)

      if (result.success && result.data) {
        toast.success(
          "Receipt processed successfully! AI extraction in progress..."
        )
        setSelectedFile(null)
        router.push(`${result.data.receiptId}`)
        router.refresh()
      } else {
        toast.error(result.error || "Processing failed. Please try again.")
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.")
      console.error("Processing error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className="space-y-2">
        <Label htmlFor="receipt-file">Receipt File</Label>
        <Input
          id="receipt-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        {selectedFile && (
          <p className="text-muted-foreground text-sm">
            Selected: {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={!selectedFile || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Processing Receipt...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Process Receipt
          </>
        )}
      </Button>
    </div>
  )
}
