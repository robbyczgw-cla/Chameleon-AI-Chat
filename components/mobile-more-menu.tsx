"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Settings,
  User,
  Brain,
  Columns2,
  FolderOpen,
  Swords,
  FileCode,
  BarChart3,
  Music,
  VolumeX,
  Moon,
  Sun,
  MoreHorizontal,
  Wand2,
  Sparkles,
  Download,
  FileText,
  Globe,
  Link,
  Check,
} from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { cn } from "@/lib/utils"
import { usePromptInspectorStore } from "@/lib/prompt-inspector-store"
import { ambientMusicService } from "@/lib/ambient-music"
import { haptics } from "@/lib/haptics"
import { useToast } from "@/hooks/use-toast"

interface MobileMoreMenuProps {
  onSettingsClick: () => void
  onProfileClick: () => void
  onMemoryClick: () => void
  onComparisonClick: () => void
  onDocCollectionsClick: () => void
  onDebateClick: () => void
  onInspectorClick: () => void
  onStatsClick: () => void
  onPersonasClick: () => void
  onPromptHelperClick: () => void
  compact?: boolean // For header usage
}

export function MobileMoreMenu({
  onSettingsClick,
  onProfileClick,
  onMemoryClick,
  onComparisonClick,
  onDocCollectionsClick,
  onDebateClick,
  onInspectorClick,
  onStatsClick,
  onPersonasClick,
  onPromptHelperClick,
  compact = true,
}: MobileMoreMenuProps) {
  const { settings, updateSettings, chats, currentChatId } = useApp()
  const { inspectorData } = usePromptInspectorStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(
    localStorage.getItem("chameleon-ambient-music") === "enabled"
  )

  // Find current chat for export functions
  let currentChat = chats.find((c) => c.id === currentChatId)
  if (!currentChat && chats.length > 0) {
    currentChat = chats.find((c) => c.messages && c.messages.length > 0)
    if (!currentChat) currentChat = chats[0]
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === "dark" ? "light" : "dark"
    updateSettings({ theme: newTheme })
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    haptics.trigger("selection")
  }

  const toggleMusic = async () => {
    const currentTheme = localStorage.getItem("chameleon-theme") || "light"
    haptics.trigger("selection")

    if (isMusicPlaying) {
      ambientMusicService.stop()
      setIsMusicPlaying(false)
      localStorage.setItem("chameleon-ambient-music", "disabled")
    } else {
      try {
        await ambientMusicService.play(currentTheme)
        setIsMusicPlaying(true)
        localStorage.setItem("chameleon-ambient-music", "enabled")
      } catch (error) {
        console.error("Failed to start music:", error)
        setIsMusicPlaying(false)
      }
    }
  }

  // Export functions
  const handleExportMarkdown = () => {
    if (!currentChat) return
    let markdown = `# ${currentChat.title}\n\n`
    markdown += `*Exported: ${new Date().toLocaleString()}*\n\n---\n\n`
    currentChat.messages.forEach((msg) => {
      const role = msg.role === "user" ? "👤 User" : "🤖 Assistant"
      markdown += `### ${role}\n\n${msg.content}\n\n---\n\n`
    })
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, "_")}.md`
    a.click()
    URL.revokeObjectURL(url)
    haptics.trigger("success")
    setOpen(false)
  }

  const handleExportJSON = () => {
    if (!currentChat) return
    const json = JSON.stringify(currentChat, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
    haptics.trigger("success")
    setOpen(false)
  }

  const handleExportHTML = () => {
    if (!currentChat) return
    const theme = localStorage.getItem("chameleon-theme") || "light"
    const isDark = theme === "dark"
    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${currentChat.title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.6;padding:2rem;background:${isDark ? '#0f172a' : '#f8fafc'};color:${isDark ? '#e2e8f0' : '#1e293b'};max-width:900px;margin:0 auto}h1{font-size:2rem;margin-bottom:0.5rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.meta{color:${isDark ? '#94a3b8' : '#64748b'};font-size:0.875rem;margin-bottom:2rem;padding-bottom:1rem;border-bottom:2px solid ${isDark ? '#334155' : '#e2e8f0'}}.message{margin:1.5rem 0;padding:1.5rem;border-radius:12px;background:${isDark ? '#1e293b' : '#ffffff'};border:1px solid ${isDark ? '#334155' : '#e2e8f0'};box-shadow:0 1px 3px rgba(0,0,0,0.1)}.message-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;font-weight:600;font-size:0.875rem}.user{color:#3b82f6}.assistant{color:#8b5cf6}.message-content{white-space:pre-wrap;word-wrap:break-word}</style></head><body><h1>${currentChat.title}</h1><div class="meta">Exported: ${new Date().toLocaleString('en-US')} • ${currentChat.messages.length} messages</div>`
    currentChat.messages.forEach((msg) => {
      const roleClass = msg.role === "user" ? "user" : "assistant"
      const roleIcon = msg.role === "user" ? "👤" : "🤖"
      const roleName = msg.role === "user" ? "User" : "Assistant"
      html += `<div class="message"><div class="message-header ${roleClass}"><span>${roleIcon}</span><span>${roleName}</span></div><div class="message-content">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></div>`
    })
    html += `</body></html>`
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, "_")}.html`
    a.click()
    URL.revokeObjectURL(url)
    haptics.trigger("success")
    setOpen(false)
  }

  const handleCopyShareLink = () => {
    if (!currentChat) return
    const shareData = {
      v: 1,
      t: currentChat.title,
      m: currentChat.messages.map(msg => ({
        r: msg.role === "user" ? "u" : "a",
        c: msg.content
      })),
      d: new Date().toISOString().split('T')[0]
    }
    const jsonStr = JSON.stringify(shareData)
    const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    const shareUrl = `${window.location.origin}?share=${base64}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      haptics.trigger("success")
      toast({
        title: "Link copied!",
        description: "Share this link to let others view this conversation",
      })
    }).catch((error) => {
      console.error("Failed to copy share link:", error)
      toast({
        title: "Failed to copy",
        description: "Could not copy the share link. Try again.",
        variant: "destructive",
      })
    })
  }

  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    badge,
    badgeColor,
  }: {
    icon: any
    label: string
    onClick: () => void
    badge?: boolean
    badgeColor?: string
  }) => (
    <Button
      variant="ghost"
      className="w-full justify-start h-12 text-base gap-3"
      onClick={() => {
        haptics.trigger("selection")
        onClick()
        setOpen(false)
      }}
    >
      <div className="relative">
        <Icon className="h-5 w-5" />
        {badge && (
          <span
            className={cn(
              "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full animate-pulse",
              badgeColor || "bg-purple-500"
            )}
          />
        )}
      </div>
      <span>{label}</span>
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "transition-all text-muted-foreground hover:text-foreground",
            compact
              ? "h-8 w-8 rounded-xl hover:bg-muted/50 active:scale-95"
              : "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg"
          )}
        >
          <MoreHorizontal className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {!compact && <span className="text-[10px] font-medium">More</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>Settings & Tools</SheetTitle>
          <SheetDescription>Access advanced features and settings</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          {/* Theme & Music */}
          <div className="mb-4 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base gap-3"
              onClick={toggleTheme}
            >
              {settings.theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-500" />
              )}
              <span>{settings.theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base gap-3"
              onClick={toggleMusic}
            >
              {isMusicPlaying ? (
                <VolumeX className="h-5 w-5 text-green-500" />
              ) : (
                <Music className="h-5 w-5" />
              )}
              <span>{isMusicPlaying ? "Stop Music" : "Play Music"}</span>
            </Button>
          </div>

          <div className="border-t pt-2 space-y-1">
            <MenuItem icon={Wand2} label="Personas" onClick={onPersonasClick} />
            <MenuItem
              icon={Sparkles}
              label="Prompt Helper"
              onClick={onPromptHelperClick}
            />
            <MenuItem icon={User} label="Profile" onClick={onProfileClick} />
            <MenuItem
              icon={Brain}
              label="Memory System"
              onClick={onMemoryClick}
              badge={settings.memorySettings?.enabled}
              badgeColor="bg-purple-500"
            />
            <MenuItem icon={FolderOpen} label="Documents" onClick={onDocCollectionsClick} />
          </div>

          <div className="border-t pt-2 space-y-1">
            <MenuItem icon={Columns2} label="Model Comparison" onClick={onComparisonClick} />
            <MenuItem icon={Swords} label="AI Discussion" onClick={onDebateClick} />
            <MenuItem
              icon={FileCode}
              label="Prompt Inspector"
              onClick={onInspectorClick}
              badge={!!inspectorData}
              badgeColor="bg-blue-500"
            />
            <MenuItem icon={BarChart3} label="Statistics" onClick={onStatsClick} />
          </div>

          {/* Export & Share Section */}
          <div className="border-t pt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-4 py-2">Export & Share</p>
            <Button
              variant="ghost"
              className="w-full justify-start h-11 text-sm gap-3"
              onClick={handleExportHTML}
              disabled={!currentChat || !currentChat.messages?.length}
            >
              <Globe className="h-4 w-4" />
              <span>Export as HTML</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-11 text-sm gap-3"
              onClick={handleExportMarkdown}
              disabled={!currentChat || !currentChat.messages?.length}
            >
              <FileText className="h-4 w-4" />
              <span>Export as Markdown</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-11 text-sm gap-3"
              onClick={handleExportJSON}
              disabled={!currentChat}
            >
              <Download className="h-4 w-4" />
              <span>Export as JSON</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-11 text-sm gap-3"
              onClick={handleCopyShareLink}
              disabled={!currentChat || !currentChat.messages?.length}
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Link Copied!</span>
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" />
                  <span>Copy Chat Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
