"use client"

import type React from "react"
import { Camera, CircleNotch, FolderOpen, Image, Plus, Upload } from "@phosphor-icons/react";

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { processFile, type FileAttachment } from "@/lib/file-handler"
import { useToast } from "@/hooks/use-toast"
import { FilePreviewInline } from "@/components/file-preview-inline"
import { cn, generateUUID } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { haptics } from "@/lib/haptics"
import { Capacitor } from "@capacitor/core"

interface FileUploadProps {
  onFilesChange: (files: FileAttachment[]) => void
  files: FileAttachment[]
}

export function FileUpload({ onFilesChange, files }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Only show menu on native Capacitor (Android)
  const isNativeCapacitor = Capacitor.isNativePlatform()

  // Listen for external trigger to open file dialog
  useEffect(() => {
    const handleTriggerFileUpload = () => {
      fileInputRef.current?.click()
    }

    window.addEventListener("triggerFileUpload" as any, handleTriggerFileUpload)
    return () => {
      window.removeEventListener("triggerFileUpload" as any, handleTriggerFileUpload)
    }
  }, [])

  const handleFiles = async (fileList: FileList) => {
    const selectedFiles = Array.from(fileList)
    if (selectedFiles.length === 0) return

    setIsProcessing(true)

    try {
      const processedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          try {
            return await processFile(file)
          } catch (error) {
            toast({
              title: "File processing failed",
              description: error instanceof Error ? error.message : "Unknown error",
              variant: "destructive",
            })
            return null
          }
        }),
      )

      const validFiles = processedFiles.filter((f): f is FileAttachment => f !== null)
      onFilesChange([...files, ...validFiles])

      if (validFiles.length > 0) {
        toast({
          title: "Files attached",
          description: `${validFiles.length} file(s) attached successfully`,
        })
      }
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId))
  }

  // Handle camera capture (native only)
  const handleCameraCapture = async () => {
    setIsMenuOpen(false)
    haptics.trigger('selection')
    setIsProcessing(true)

    try {
      const { nativeCamera } = await import('@/lib/capacitor/camera')
      const photo = await nativeCamera.getPhoto('camera')

      if (photo && photo.dataUrl) {
        const fileAttachment: FileAttachment = {
          id: generateUUID(),
          name: `photo_${Date.now()}.${photo.format || 'jpg'}`,
          type: `image/${photo.format || 'jpeg'}`,
          size: Math.round(photo.dataUrl.length * 0.75),
          dataUrl: photo.dataUrl,
          content: '',
        }

        onFilesChange([...files, fileAttachment])
        haptics.trigger('success')
        toast({
          title: "Photo captured",
          description: "Photo attached successfully",
        })
      }
    } catch (error) {
      console.error('[FileUpload] Camera error:', error)
      haptics.trigger('error')
      toast({
        title: "Camera error",
        description: error instanceof Error ? error.message : "Failed to capture photo",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle gallery selection (native only)
  const handleGallerySelect = async () => {
    setIsMenuOpen(false)
    haptics.trigger('selection')
    setIsProcessing(true)

    try {
      const { nativeCamera } = await import('@/lib/capacitor/camera')
      const photo = await nativeCamera.getPhoto('gallery')

      if (photo && photo.dataUrl) {
        const fileAttachment: FileAttachment = {
          id: generateUUID(),
          name: `image_${Date.now()}.${photo.format || 'jpg'}`,
          type: `image/${photo.format || 'jpeg'}`,
          size: Math.round(photo.dataUrl.length * 0.75),
          dataUrl: photo.dataUrl,
          content: '',
        }

        onFilesChange([...files, fileAttachment])
        haptics.trigger('success')
        toast({
          title: "Image selected",
          description: "Image attached successfully",
        })
      }
    } catch (error) {
      console.error('[FileUpload] Gallery error:', error)
      haptics.trigger('error')
      toast({
        title: "Gallery error",
        description: error instanceof Error ? error.message : "Failed to select image",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Open file picker from menu
  const openFilePicker = () => {
    setIsMenuOpen(false)
    haptics.trigger('selection')
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf"
      />

      {/* Native Capacitor: Show dropdown with Camera, Gallery, Files */}
      {isNativeCapacitor ? (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              disabled={isProcessing}
              title="Attach files or take photo"
            >
              {isProcessing ? (
                <CircleNotch className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={handleCameraCapture} className="gap-2 cursor-pointer">
              <Camera className="h-4 w-4" />
              <span>Take Photo</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGallerySelect} className="gap-2 cursor-pointer">
              <Image className="h-4 w-4" />
              <span>Gallery</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openFilePicker} className="gap-2 cursor-pointer">
              <FolderOpen className="h-4 w-4" />
              <span>Files</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        /* Web/PWA: Simple file picker button */
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          title="Attach files"
        >
          {isProcessing ? (
            <CircleNotch className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      )}

      {files.length > 0 && (
        <div
          className={cn(
            "absolute bottom-full left-0 right-0 mb-3 p-3 bg-background/95 border border-border/60 rounded-xl shadow-lg transition-all",
            isDragging && "border-primary/50 bg-primary/5"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-xl border-2 border-dashed border-primary z-10">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-primary">Drop files here</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              {files.length} file{files.length > 1 ? 's' : ''} attached
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
            {files.map((file) => (
              <FilePreviewInline
                key={file.id}
                file={file}
                onRemove={handleRemoveFile}
                showRemove={true}
                compact={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
