"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { keyboardShortcutService } from "@/lib/keyboard-shortcuts"
import { Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const shortcuts = keyboardShortcutService.getShortcuts()

  // Group shortcuts by category
  const navigationShortcuts = shortcuts.filter(s =>
    ['new-chat', 'search', 'toggle-sidebar'].includes(s.action)
  )
  const viewShortcuts = shortcuts.filter(s =>
    ['toggle-theme', 'prompt-library', 'model-selector'].includes(s.action)
  )
  const actionShortcuts = shortcuts.filter(s =>
    ['send-message', 'export-chat', 'cancel'].includes(s.action)
  )
  const settingsShortcuts = shortcuts.filter(s =>
    ['settings', 'keyboard-shortcuts'].includes(s.action)
  )

  const formatKey = (key: string) => {
    // Capitalize and format special keys
    if (key === 'Escape') return 'Esc'
    if (key === 'Enter') return '↵'
    if (key.length === 1) return key.toUpperCase()
    return key
  }

  const formatShortcut = (shortcut: typeof shortcuts[0]) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const parts: string[] = []

    if (shortcut.ctrl) {
      parts.push(isMac ? '⌘' : 'Ctrl')
    }
    if (shortcut.shift) {
      parts.push(isMac ? '⇧' : 'Shift')
    }
    if (shortcut.alt) {
      parts.push(isMac ? '⌥' : 'Alt')
    }
    parts.push(formatKey(shortcut.key))

    return parts
  }

  const renderShortcut = (shortcut: typeof shortcuts[0]) => (
    <div key={shortcut.action} className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {formatShortcut(shortcut).map((part, idx) => (
          <kbd
            key={idx}
            className={cn(
              "inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded border",
              "bg-muted text-foreground border-border shadow-sm min-w-[28px]"
            )}
          >
            {part}
          </kbd>
        ))}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Keyboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Quick access to common actions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Navigation */}
          {navigationShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-foreground">Navigation</h3>
              <div className="space-y-1">
                {navigationShortcuts.map(renderShortcut)}
              </div>
            </div>
          )}

          {/* View */}
          {viewShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-foreground">View</h3>
              <div className="space-y-1">
                {viewShortcuts.map(renderShortcut)}
              </div>
            </div>
          )}

          {/* Actions */}
          {actionShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-foreground">Actions</h3>
              <div className="space-y-1">
                {actionShortcuts.map(renderShortcut)}
              </div>
            </div>
          )}

          {/* Settings */}
          {settingsShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-foreground">Settings</h3>
              <div className="space-y-1">
                {settingsShortcuts.map(renderShortcut)}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold rounded border bg-muted text-foreground border-border">?</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-semibold rounded border bg-muted text-foreground border-border">Ctrl</kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 text-xs font-semibold rounded border bg-muted text-foreground border-border">/</kbd>
            {' '}to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
