"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/contexts/app-context"
import {
  Share2,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  AlertCircle,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatId: string
  chatTitle: string
}

interface ShareData {
  id: string
  chatId: string
  shareToken: string
  title: string | null
  isActive: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

export function ShareDialog({ open, onOpenChange, chatId, chatTitle }: ShareDialogProps) {
  const { user } = useApp()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [shares, setShares] = useState<ShareData[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [customTitle, setCustomTitle] = useState("")

  // Guest mode = no user logged in
  const isGuestMode = !user

  // Fetch existing shares when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchShares()
    }
  }, [open, user, chatId])

  const fetchShares = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/shares?chatId=${chatId}`)
      if (response.ok) {
        const data = await response.json()
        setShares(data)
      }
    } catch (error) {
      console.error("Error fetching shares:", error)
    } finally {
      setLoading(false)
    }
  }

  const createShare = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          title: customTitle || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create share")
      }

      const newShare = await response.json()
      setShares([newShare, ...shares])
      setCustomTitle("")

      toast({
        title: "Share link created",
        description: "Anyone with the link can view this conversation",
      })
    } catch (error) {
      console.error("Error creating share:", error)
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const deleteShare = async (shareId: string) => {
    try {
      const response = await fetch("/api/shares", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete share")
      }

      setShares(shares.filter((s) => s.id !== shareId))

      toast({
        title: "Share deleted",
        description: "The share link has been revoked",
      })
    } catch (error) {
      console.error("Error deleting share:", error)
      toast({
        title: "Error",
        description: "Failed to delete share link",
        variant: "destructive",
      })
    }
  }

  const toggleShareActive = async (shareId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/shares", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId, isActive }),
      })

      if (!response.ok) {
        throw new Error("Failed to update share")
      }

      const updatedShare = await response.json()
      setShares(shares.map((s) => (s.id === shareId ? updatedShare : s)))

      toast({
        title: isActive ? "Share enabled" : "Share disabled",
        description: isActive
          ? "The share link is now active"
          : "The share link is now inactive",
      })
    } catch (error) {
      console.error("Error updating share:", error)
      toast({
        title: "Error",
        description: "Failed to update share",
        variant: "destructive",
      })
    }
  }

  const copyShareLink = async (shareToken: string, shareId: string) => {
    const url = `${window.location.origin}/share/${shareToken}`
    await navigator.clipboard.writeText(url)
    setCopiedId(shareId)
    setTimeout(() => setCopiedId(null), 2000)

    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    })
  }

  const getShareUrl = (shareToken: string) => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/share/${shareToken}`
  }

  // Guest mode or not logged in
  if (isGuestMode || !user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Chat
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Sign in to share
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an account to share your conversations with others.
            </p>
            <Button asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Chat
          </DialogTitle>
          <DialogDescription>
            Create a public link to share this conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Chat Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {chatTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Anyone with the link can view this conversation
            </p>
          </div>

          {/* Create New Share */}
          <div className="space-y-3">
            <Label htmlFor="custom-title" className="text-sm">
              Custom title (optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-title"
                placeholder="Enter a custom title for the share..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createShare} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Create Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing Shares */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shares.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-sm">Active share links</Label>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      share.isActive
                        ? "bg-background border-border"
                        : "bg-muted/30 border-border/50 opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">
                            {share.title || chatTitle}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {getShareUrl(share.shareToken)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {share.viewCount} views
                          </span>
                          <span>
                            Created{" "}
                            {new Date(share.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={share.isActive}
                          onCheckedChange={(checked) =>
                            toggleShareActive(share.id, checked)
                          }
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyShareLink(share.shareToken, share.id)}
                      >
                        {copiedId === share.id ? (
                          <>
                            <Check className="h-4 w-4 mr-1 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`/share/${share.shareToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteShare(share.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No share links yet</p>
              <p className="text-xs mt-1">
                Create a link to share this conversation
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
