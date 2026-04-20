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

import type { Dictionary } from "@/components/internationalization"

import { uploadReceipt } from "./actions"
import { logger } from "@/lib/logger"

const log = logger.forModule("receipt.upload-form")

interface UploadFormProps {
  locale?: string
  dict?: Dictionary | null
}

export function UploadForm({ locale = "en", dict }: UploadFormProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

  const upload = dict?.finance?.receipt?.upload

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ]
      if (!validTypes.includes(file.type)) {
        toast.error(
          upload?.invalidType ??
            "Please upload an image (JPG, PNG, WebP) or PDF file"
        )
        return
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(upload?.sizeExceeded ?? "File size must be less than 10MB")
        return
      }
      setSelectedFile(file)
      toast.success(upload?.fileSelected ?? "File selected! Ready to process.")
    }
  }

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error(upload?.selectFirst ?? "Please select a file first.")
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const result = await uploadReceipt(formData)

      if (result.success && result.data) {
        toast.success(
          upload?.processedSuccess ??
            "Receipt processed successfully! AI extraction in progress..."
        )
        setSelectedFile(null)
        router.push(`${result.data.receiptId}`)
        router.refresh()
      } else {
        toast.error(
          result.error ??
            upload?.processingFailed ??
            "Processing failed. Please try again."
        )
      }
    } catch (error) {
      toast.error(
        upload?.unexpectedError ??
          "An unexpected error occurred. Please try again."
      )
      log.error("Processing error", error as Error)
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedText = upload?.selectedFile
    ? upload.selectedFile
        .replace("{name}", selectedFile?.name ?? "")
        .replace("{size}", selectedFile ? (selectedFile.size / 1024).toFixed(1) : "")
    : selectedFile
      ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`
      : ""

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className="space-y-2">
        <Label htmlFor="receipt-file">
          {upload?.receiptFile ?? "Receipt File"}
        </Label>
        <Input
          id="receipt-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        {selectedFile && (
          <p className="text-muted-foreground text-sm">{selectedText}</p>
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
            <LoaderCircle className="me-2 h-4 w-4 animate-spin" />
            {upload?.processingReceipt ?? "Processing Receipt..."}
          </>
        ) : (
          <>
            <Upload className="me-2 h-4 w-4" />
            {upload?.processReceipt ?? "Process Receipt"}
          </>
        )}
      </Button>
    </div>
  )
}
