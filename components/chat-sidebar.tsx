"use client"

import type React from "react"
import { X, LogOut, User } from "lucide-react"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useApp } from "@/contexts/app-context"
import { searchService } from "@/lib/search-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageSquarePlus, Search, MoreVertical, Trash2, Edit2, Pin, FolderPlus, Folder, Sparkles } from "lucide-react"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ChatSidebar({ onClose }: { onClose?: () => void }) {
  const {
    chats,
    currentChatId,
    createChat,
    deleteChat,
    deleteAllChats,
    setCurrentChat,
    updateChat,
    folders,
    createFolder,
    user,
    signOut,
  } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
  const [animatedTitleIds, setAnimatedTitleIds] = useState<Set<string>>(new Set())

  // Track AI-generated titles for animation
  useEffect(() => {
    const now = Date.now()
    const newAnimatedIds = new Set<string>()

    chats.forEach((chat) => {
      // Animate titles generated in the last 3 seconds
      if (chat.titleGeneratedAt && now - chat.titleGeneratedAt < 3000) {
        newAnimatedIds.add(chat.id)
      }
    })

    if (newAnimatedIds.size > 0) {
      setAnimatedTitleIds(newAnimatedIds)

      // Remove animation class after animation completes (1.5s)
      const timer = setTimeout(() => {
        setAnimatedTitleIds(new Set())
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [chats])

  // Build search index when chats change
  useEffect(() => {
    if (chats.length > 0) {
      searchService.buildIndex(chats)
    }
  }, [chats])

  // Enhanced search: title + message content
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats

    // If short query, just do title search for speed
    if (searchQuery.length < 3) {
      return chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Full-text search through titles AND message content
    const searchResults = searchService.search(searchQuery, chats, 100)
    const matchedChatIds = new Set(searchResults.map(r => r.chatId))

    // Also include title matches not found by search service
    const titleMatches = chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !matchedChatIds.has(chat.id)
    )

    // Combine: search results first (sorted by relevance), then title matches
    const searchChats = searchResults
      .map(r => chats.find(c => c.id === r.chatId))
      .filter(Boolean) as typeof chats

    return [...searchChats, ...titleMatches]
  }, [searchQuery, chats])

  const pinnedChats = filteredChats.filter((chat) => chat.pinned)
  const unpinnedChats = filteredChats.filter((chat) => !chat.pinned)

  const handleNewChat = () => {
    const chatId = createChat()
    setCurrentChat(chatId)
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteChat(chatId)
  }

  const handleEditStart = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(chatId)
    setEditTitle(currentTitle)
  }

  const handleEditSave = (chatId: string) => {
    if (editTitle.trim()) {
      updateChat(chatId, { title: editTitle.trim() })
    }
    setEditingId(null)
    setEditTitle("")
  }

  const handleTogglePin = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const chat = chats.find((c) => c.id === chatId)
    if (chat) {
      updateChat(chatId, { pinned: !chat.pinned })
    }
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim())
      setNewFolderName("")
      setIsNewFolderOpen(false)
    }
  }

  const handleDeleteAllChats = () => {
    deleteAllChats()
    setIsDeleteAllOpen(false)
  }

  const renderChatItem = (chat: any) => {
    // Get last message preview
    const lastMessage = chat.messages?.[chat.messages.length - 1]
    const messagePreview = lastMessage
      ? typeof lastMessage.content === "string"
        ? lastMessage.content.substring(0, 60)
        : lastMessage.content?.[0]?.text?.substring(0, 60) || "..."
      : "No messages yet"

    // Format timestamp
    const timestamp = new Date(chat.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const isActive = currentChatId === chat.id

    return (
      <div
        key={chat.id}
        onClick={() => setCurrentChat(chat.id)}
        className={cn(
          "group relative flex flex-col gap-1 rounded-lg px-2.5 py-2 text-sm cursor-pointer smooth-transition mb-1.5",
          currentChatId === chat.id
            ? "bg-primary/10 border-l-[3px] border-l-primary border-y border-r border-border/30 shadow-sm"
            : "border border-border/40 hover:border-border/60 glass-subtle hover:shadow-sm hover-lift",
        )}
      >
        {editingId === chat.id ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => handleEditSave(chat.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEditSave(chat.id)
              if (e.key === "Escape") setEditingId(null)
            }}
            className="h-7 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            {/* Title Row with Timestamp */}
            <div className="flex items-center justify-between gap-2 overflow-hidden">
              <span className={cn(
                "flex-1 min-w-0 truncate font-semibold text-sm",
                animatedTitleIds.has(chat.id) && "animate-title-appear"
              )}>{chat.title}</span>
              <span className={cn("text-xs shrink-0", isActive ? "text-foreground/70" : "text-muted-foreground/80")}>{timestamp}</span>
            </div>

            {/* Message Preview */}
            <p className={cn("text-xs line-clamp-1 overflow-hidden", isActive ? "text-foreground/80 drop-shadow-sm" : "text-muted-foreground/90")}>
              {messagePreview}
            </p>

            {/* Action Buttons - Show on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 smooth-transition animate-fade-in absolute top-1 right-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover-scale smooth-transition rounded-lg"
                onClick={(e) => handleTogglePin(chat.id, e)}
                title={chat.pinned ? "Unpin" : "Pin"}
              >
                <Pin className={cn("h-3.5 w-3.5", chat.pinned && "fill-current text-primary glow-subtle")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/15 hover-scale smooth-transition rounded-lg"
                onClick={(e) => handleDeleteChat(chat.id, e)}
                title="Delete chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover-scale smooth-transition rounded-lg">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleEditStart(chat.id, chat.title, e)}>
                    <Edit2 className="h-3 w-3 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => handleDeleteChat(chat.id, e)} className="text-destructive">
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex h-[100dvh] md:h-full md:max-h-[100dvh] w-[280px] sm:w-80 md:w-64 flex-col overflow-hidden rounded-none md:rounded-none border border-border/60 panel-elevated shadow-2xl md:shadow-lg smooth-transition bg-card sidebar-halo">
      <div className="sidebar-bridge hidden md:block" aria-hidden="true" />
      <div className="flex items-center gap-3 border-b border-border/30 p-4 md:p-5 bg-card">
        {onClose && (
          <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 hover-scale smooth-transition rounded-xl shrink-0 hover:bg-primary/10" onClick={onClose} title="Close">
            <X className="h-5 w-5" />
          </Button>
        )}
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 shadow-xl border border-primary/10 shrink-0 hover-glow smooth-transition">
          <ChameleonLogo className="text-green-600" size={28} animated />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
            Chameleon AI
          </h2>
          <p className="text-xs text-muted-foreground/90 font-medium truncate">Adapt to Any Conversation</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border/30 p-4 md:p-5">
        <Button onClick={handleNewChat} className="flex-1 gap-2 shadow-md hover:shadow-xl h-10 md:h-11 font-semibold rounded-xl smooth-transition hover-scale gradient-premium glow-subtle" size="sm">
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
        <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 md:h-11 md:w-11 shadow-md hover:shadow-xl hover-scale smooth-transition rounded-xl border-border/40">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="My Folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder()
                  }}
                />
              </div>
              <Button onClick={handleCreateFolder} className="w-full">
                Create Folder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 md:h-11 md:w-11 shadow-md hover:shadow-xl text-destructive hover:text-destructive hover:bg-destructive/15 hover-scale smooth-transition rounded-xl border-border/40"
          onClick={() => setIsDeleteAllOpen(true)}
          title="Delete All Chats"
          disabled={chats.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 md:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
          <Input
            placeholder="Search titles & messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 shadow-md rounded-xl border-border/40 hover-lift smooth-transition"
          />
          {searchQuery.length >= 3 && filteredChats.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {filteredChats.length} found
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-3">
        <div className="space-y-0">
          {pinnedChats.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Pinned</div>
              {pinnedChats.map(renderChatItem)}
              <div className="my-2 border-t border-border" />
            </>
          )}

          {folders.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Folders</div>
              {folders.map((folder) => (
                <div key={folder.id} className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                    <Folder className="h-4 w-4" />
                    {folder.name}
                  </div>
                  {chats.filter((chat) => chat.folderId === folder.id).map(renderChatItem)}
                </div>
              ))}
              <div className="my-2 border-t border-border" />
            </>
          )}

          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Recent</div>
          {unpinnedChats.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">No chats yet</div>
          ) : (
            unpinnedChats.map(renderChatItem)
          )}
        </div>
      </ScrollArea>

      {/* Login button for non-authenticated users */}
      {!user && (
        <div className="border-t p-3">
          <Button
            onClick={() => {
              window.location.href = "/auth/login"
            }}
            className="w-full gap-2"
            variant="default"
          >
            <User className="h-4 w-4" />
            Sign In
          </Button>
        </div>
      )}

      {/* User profile section at bottom */}
      {user && (
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">Signed In</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => signOut()}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All {chats.length} chat{chats.length !== 1 ? "s" : ""}{" "}
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllChats}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
