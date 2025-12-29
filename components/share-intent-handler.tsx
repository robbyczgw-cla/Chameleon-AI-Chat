'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ShareData {
  type: 'text' | 'image' | 'images' | 'pdf'
  data: string
  title?: string | null
}

interface ShareIntentHandlerProps {
  onShareReceived?: (data: ShareData) => void
}

/**
 * Share Intent Handler
 * Receives and processes shared content from other apps
 * Shows a dialog to confirm adding shared content to chat
 */
export function ShareIntentHandler({ onShareReceived }: ShareIntentHandlerProps) {
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) return

    const handleShareReceived = (e: CustomEvent<ShareData>) => {
      const data = e.detail
      if (data && data.data) {
        setShareData(data)
        setIsOpen(true)
      }
    }

    document.addEventListener(
      'chameleon:share-received',
      handleShareReceived as EventListener
    )

    return () => {
      document.removeEventListener(
        'chameleon:share-received',
        handleShareReceived as EventListener
      )
    }
  }, [])

  const handleAccept = () => {
    if (shareData) {
      onShareReceived?.(shareData)

      // Dispatch event for other components to handle
      window.dispatchEvent(
        new CustomEvent('chameleon:share-accepted', {
          detail: shareData,
        })
      )
    }
    setIsOpen(false)
    setShareData(null)
  }

  const handleDismiss = () => {
    setIsOpen(false)
    setShareData(null)
  }

  const getSharePreview = () => {
    if (!shareData) return null

    switch (shareData.type) {
      case 'text':
        return (
          <div className="mt-4 p-4 bg-muted rounded-lg max-h-48 overflow-auto">
            <p className="text-sm whitespace-pre-wrap">{shareData.data}</p>
          </div>
        )
      case 'image':
        return (
          <div className="mt-4 flex justify-center">
            <img
              src={shareData.data}
              alt="Shared image"
              className="max-h-48 rounded-lg object-contain"
            />
          </div>
        )
      case 'images':
        try {
          const images = JSON.parse(shareData.data)
          return (
            <div className="mt-4 flex gap-2 overflow-x-auto py-2">
              {images.slice(0, 4).map((uri: string, i: number) => (
                <img
                  key={i}
                  src={uri}
                  alt={`Shared image ${i + 1}`}
                  className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
                />
              ))}
              {images.length > 4 && (
                <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-sm text-muted-foreground">
                    +{images.length - 4} more
                  </span>
                </div>
              )}
            </div>
          )
        } catch {
          return null
        }
      case 'pdf':
        return (
          <div className="mt-4 p-4 bg-muted rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
              PDF
            </div>
            <span className="text-sm text-muted-foreground">
              PDF document shared
            </span>
          </div>
        )
      default:
        return null
    }
  }

  const getShareDescription = () => {
    switch (shareData?.type) {
      case 'text':
        return 'Add this text to your current conversation?'
      case 'image':
        return 'Add this image to your current conversation?'
      case 'images':
        return 'Add these images to your current conversation?'
      case 'pdf':
        return 'Add this PDF to your current conversation?'
      default:
        return 'Add this content to your conversation?'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {shareData?.title ? `"${shareData.title}"` : 'Shared Content'}
          </DialogTitle>
          <DialogDescription>{getShareDescription()}</DialogDescription>
        </DialogHeader>

        {getSharePreview()}

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDismiss}>
            Cancel
          </Button>
          <Button onClick={handleAccept}>Add to Chat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ShareIntentHandler
