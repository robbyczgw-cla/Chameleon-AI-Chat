"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Brain,
  Sparkles,
  Target,
  User,
  Lightbulb,
  TrendingUp,
  Trash2,
  Info,
  Download,
  Upload,
  Shield,
  Cloud,
  AlertTriangle,
  RotateCcw,
  Clock,
  Archive,
  Timer,
} from "lucide-react"
import { memoryService } from "@/lib/memory-service"
import type { Memory, DeletedMemory } from "@/types"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"

export function AIMemoryHub() {
  const { settings, updateSettings } = useApp()
  const currentLanguage = settings.language || "en"
  const { t, translations } = useTranslation(currentLanguage)
  const { toast } = useToast()
  const [memories, setMemories] = useState<Memory[]>([])
  const [deletedMemories, setDeletedMemories] = useState<DeletedMemory[]>([])
  const [isEnabled, setIsEnabled] = useState(settings.memorySettings?.enabled ?? false)
  const [syncToDatabase, setSyncToDatabase] = useState(settings.memorySettings?.syncToDatabase ?? false)
  const [autoExtract, setAutoExtract] = useState(settings.memorySettings?.autoExtract ?? true)
  const [expirationEnabled, setExpirationEnabled] = useState(settings.memorySettings?.expirationEnabled ?? true)
  const [activeTab, setActiveTab] = useState<Memory["type"] | "deleted">("preference")
  const [stats, setStats] = useState(memoryService.getStats())
  const [deletedStats, setDeletedStats] = useState(memoryService.getDeletedStats())

  useEffect(() => {
    loadMemories()
  }, [])

  // Sync local state with settings changes (fixes persistence bug)
  useEffect(() => {
    setIsEnabled(settings.memorySettings?.enabled ?? false)
    setSyncToDatabase(settings.memorySettings?.syncToDatabase ?? false)
    setAutoExtract(settings.memorySettings?.autoExtract ?? true)
    setExpirationEnabled(settings.memorySettings?.expirationEnabled ?? true)
  }, [settings.memorySettings?.enabled, settings.memorySettings?.syncToDatabase, settings.memorySettings?.autoExtract, settings.memorySettings?.expirationEnabled])

  const loadMemories = () => {
    const allMemories = memoryService.getAllMemories()
    setMemories(allMemories)
    setStats(memoryService.getStats())
    setDeletedMemories(memoryService.getDeletedMemories())
    setDeletedStats(memoryService.getDeletedStats())
  }

  const toggleMemorySystem = (enabled: boolean) => {
    console.log("[AIMemoryHub] Toggle clicked:", {
      newValue: enabled,
      currentSettings: settings.memorySettings
    })
    setIsEnabled(enabled)

    const newMemorySettings = {
      ...settings.memorySettings,
      enabled,
    }
    console.log("[AIMemoryHub] Calling updateSettings with:", newMemorySettings)

    // CRITICAL: Preserve existing memorySettings, only update enabled flag
    updateSettings({
      memorySettings: newMemorySettings,
    })
  }

  const toggleDatabaseSync = (enabled: boolean) => {
    console.log("[AIMemoryHub] Database sync toggled:", enabled)
    setSyncToDatabase(enabled)

    updateSettings({
      memorySettings: {
        ...settings.memorySettings,
        syncToDatabase: enabled,
      },
    })

    if (enabled) {
      toast({
        title: "Cloud Sync Enabled",
        description: "Memories will sync to database. Less private but more convenient.",
        duration: 3000,
      })
    } else {
      toast({
        title: "Cloud Sync Disabled",
        description: "Memories stored locally only. More private.",
        duration: 3000,
      })
    }
  }

  const toggleAutoExtract = (enabled: boolean) => {
    console.log("[AIMemoryHub] Auto-extract toggled:", enabled)
    setAutoExtract(enabled)

    updateSettings({
      memorySettings: {
        ...settings.memorySettings,
        autoExtract: enabled,
      },
    })

    if (enabled) {
      toast({
        title: "Auto-Extract Enabled",
        description: "AI will automatically extract important information from conversations.",
        duration: 3000,
      })
    } else {
      toast({
        title: "Auto-Extract Disabled",
        description: "Memories will only be added manually.",
        duration: 3000,
      })
    }
  }

  const toggleExpiration = (enabled: boolean) => {
    console.log("[AIMemoryHub] Expiration toggled:", enabled)
    setExpirationEnabled(enabled)

    updateSettings({
      memorySettings: {
        ...settings.memorySettings,
        expirationEnabled: enabled,
      },
    })

    if (enabled) {
      toast({
        title: "Auto-Cleanup Enabled",
        description: "Unused memories will be archived after 7 days.",
        duration: 3000,
      })
    } else {
      toast({
        title: "Auto-Cleanup Disabled",
        description: "Memories will persist indefinitely until manually deleted.",
        duration: 3000,
      })
    }
  }

  const deleteMemory = (id: string) => {
    if (confirm(translations.memory.deleteConfirm)) {
      memoryService.deleteMemory(id)
      loadMemories()
      toast({
        title: "Memory archived",
        description: "You can restore it from the Deleted tab within 2 weeks.",
        duration: 3000,
      })
    }
  }

  const restoreMemory = (id: string) => {
    memoryService.restoreMemory(id)
    loadMemories()
    toast({
      title: "Memory restored",
      description: "The memory has been restored to your active memories.",
      duration: 2000,
    })
  }

  const permanentlyDeleteFromArchive = (id: string) => {
    if (confirm("Permanently delete this memory? This cannot be undone.")) {
      memoryService.permanentlyDeleteFromArchive(id)
      loadMemories()
      toast({
        title: "Memory permanently deleted",
        description: "The memory has been permanently removed.",
        duration: 2000,
      })
    }
  }

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now()
    const remaining = expiresAt - now
    if (remaining <= 0) return "Expiring soon"

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h left`
    return "< 1h left"
  }

  const getDeletionReasonLabel = (reason: DeletedMemory["deletionReason"]) => {
    switch (reason) {
      case "expired": return "Auto-expired"
      case "manual": return "Manually deleted"
      case "demoted": return "Demoted & expired"
      default: return reason
    }
  }

  const updateMemoryImportance = (id: string, importance: 1 | 2 | 3) => {
    memoryService.updateMemory(id, { importance })
    loadMemories()
  }

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      memories,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chameleon-memories-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Memories exported",
      description: `Exported ${memories.length} memories`,
      duration: 2000,
    })
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (!data.memories || !Array.isArray(data.memories)) {
          throw new Error("Invalid file format")
        }

        let imported = 0
        let skipped = 0

        for (const memory of data.memories) {
          if (!memory.type || !memory.content || memory.importance === undefined) {
            skipped++
            continue
          }

          const existingContent = memories.map(m => m.content.toLowerCase())
          if (existingContent.includes(memory.content.toLowerCase())) {
            skipped++
            continue
          }

          memoryService.addMemory({
            type: memory.type,
            content: memory.content,
            importance: memory.importance,
            category: memory.category,
          })
          imported++
        }

        loadMemories()

        toast({
          title: "Import complete",
          description: `Imported ${imported} memories${skipped > 0 ? `, skipped ${skipped}` : ""}`,
          duration: 2000,
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid JSON file",
          variant: "destructive",
          duration: 2000,
        })
      }
    }
    input.click()
  }

  const getTypeIcon = (type: Memory["type"]) => {
    switch (type) {
      case "preference":
        return <User className="h-4 w-4" />
      case "fact":
        return <Lightbulb className="h-4 w-4" />
      case "context":
        return <Sparkles className="h-4 w-4" />
      case "skill":
        return <TrendingUp className="h-4 w-4" />
      case "goal":
        return <Target className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: Memory["type"]) => {
    const labels = {
      preference: translations.memory.preferences,
      fact: translations.memory.facts,
      context: translations.memory.context,
      skill: translations.memory.skills,
      goal: translations.memory.goals,
    }
    return labels[type]
  }

  const getImportanceColor = (importance: 1 | 2 | 3) => {
    if (importance === 3) return "bg-red-500"
    if (importance === 2) return "bg-yellow-500"
    return "bg-green-500"
  }

  const filteredMemories = activeTab === "deleted" ? [] : memories.filter((m) => m.type === activeTab)

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{translations.memory.title}</h3>
            <p className="text-xs text-muted-foreground">
              {translations.memory.subtitle}
            </p>
          </div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={toggleMemorySystem} />
      </div>

      {/* Privacy Setting - Cloud Sync Toggle */}
      {isEnabled && (
        <div className="p-4 rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-10 w-10 rounded-lg shadow-lg flex items-center justify-center",
                syncToDatabase
                  ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                  : "bg-gradient-to-br from-green-500 to-emerald-500"
              )}>
                {syncToDatabase ? (
                  <Cloud className="h-5 w-5 text-white" />
                ) : (
                  <Shield className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {syncToDatabase ? "Cloud Sync Enabled" : "Local Storage Only"}
                  {syncToDatabase && (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">
                      <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                      Less Private
                    </Badge>
                  )}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {syncToDatabase
                    ? "Memories saved to database for cross-device access. Data stored on Supabase servers."
                    : "Memories stored in your browser only. Maximum privacy, but no sync between devices."
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={syncToDatabase}
              onCheckedChange={toggleDatabaseSync}
            />
          </div>
        </div>
      )}

      {/* Auto-Extract Toggle */}
      {isEnabled && (
        <div className="p-4 rounded-lg border bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Auto-Extract Memories</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {autoExtract
                    ? "AI automatically extracts important information from your conversations."
                    : "You'll need to add memories manually."
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={autoExtract}
              onCheckedChange={toggleAutoExtract}
            />
          </div>
        </div>
      )}

      {/* Auto-Cleanup / Expiration Toggle */}
      {isEnabled && (
        <div className="p-4 rounded-lg border bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-10 w-10 rounded-lg shadow-lg flex items-center justify-center",
                expirationEnabled
                  ? "bg-gradient-to-br from-rose-500 to-pink-500"
                  : "bg-gradient-to-br from-gray-400 to-gray-500"
              )}>
                <Timer className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  Auto-Cleanup
                  {expirationEnabled && (
                    <Badge variant="outline" className="text-[10px] border-rose-500 text-rose-600">
                      7 days
                    </Badge>
                  )}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {expirationEnabled
                    ? "Unused memories are archived after 7 days. High-importance memories get demoted first."
                    : "Memories persist indefinitely until manually deleted."
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={expirationEnabled}
              onCheckedChange={toggleExpiration}
            />
          </div>
        </div>
      )}

      {!isEnabled && (
        <Card className="p-6 text-center bg-muted/30 border-dashed">
          <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">
            {translations.memory.disabled}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {translations.memory.disabledDescription}
          </p>
          <Button onClick={() => toggleMemorySystem(true)} size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            {translations.memory.enableButton}
          </Button>
        </Card>
      )}

      {isEnabled && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-500">{stats.total}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.total}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.preference}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.preferences}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.fact}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.facts}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.skill}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.skills}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.goal}</div>
              <div className="text-xs text-muted-foreground">{translations.memory.goals}</div>
            </Card>
          </div>

          {/* Import/Export Buttons */}
          <div className="flex gap-2 justify-end">
            <Button onClick={handleExport} size="sm" variant="outline" disabled={memories.length === 0}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button onClick={handleImport} size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-1.5" />
              Import
            </Button>
          </div>

          {/* Info Card */}
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-500/30">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <p>
                  <strong>{translations.memory.howItWorks}</strong>
                </p>
                <p className="whitespace-pre-line">{translations.memory.howItWorksDescription}</p>
              </div>
            </div>
          </Card>

          {/* Memory Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Memory["type"] | "deleted")}>
            <TabsList className="w-full grid grid-cols-6">
              <TabsTrigger value="preference" className="text-xs">
                {getTypeIcon("preference")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.preferences}</span>
              </TabsTrigger>
              <TabsTrigger value="fact" className="text-xs">
                {getTypeIcon("fact")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.facts}</span>
              </TabsTrigger>
              <TabsTrigger value="context" className="text-xs">
                {getTypeIcon("context")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.context}</span>
              </TabsTrigger>
              <TabsTrigger value="skill" className="text-xs">
                {getTypeIcon("skill")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.skills}</span>
              </TabsTrigger>
              <TabsTrigger value="goal" className="text-xs">
                {getTypeIcon("goal")}
                <span className="ml-1.5 hidden sm:inline">{translations.memory.goals}</span>
              </TabsTrigger>
              <TabsTrigger value="deleted" className="text-xs relative">
                <Archive className="h-4 w-4" />
                <span className="ml-1.5 hidden sm:inline">Deleted</span>
                {deletedStats.total > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center">
                    {deletedStats.total}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Memory List - Active Memories */}
            {activeTab !== "deleted" && (
              <TabsContent value={activeTab} className="mt-4">
                {filteredMemories.length === 0 ? (
                  <Card className="p-6 text-center bg-muted/30 border-dashed">
                    <div className="flex justify-center mb-3">
                      {getTypeIcon(activeTab as Memory["type"])}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {translations.memory.noMemories}
                    </p>
                  </Card>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {filteredMemories.map((memory) => (
                        <Card key={memory.id} className="p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  {getTypeIcon(memory.type)}
                                  <span className="text-xs font-medium">{getTypeLabel(memory.type)}</span>
                                </div>
                                {memory.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {memory.category}
                                  </Badge>
                                )}
                                <div className="flex gap-1">
                                  {[1, 2, 3].map((level) => (
                                    <button
                                      key={level}
                                      onClick={() => updateMemoryImportance(memory.id, level as 1 | 2 | 3)}
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full transition-all",
                                        level <= memory.importance ? getImportanceColor(memory.importance) : "bg-muted"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm">{memory.content}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>
                                  {new Date(memory.createdAt).toLocaleDateString(currentLanguage === "de" ? "de-DE" : "en-US")}
                                </span>
                                <span>• {memory.accessCount} {translations.memory.usedTimes}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMemory(memory.id)}
                              className="h-8 w-8 p-0 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            )}

            {/* Deleted Memories Tab */}
            <TabsContent value="deleted" className="mt-4">
              {deletedMemories.length === 0 ? (
                <Card className="p-6 text-center bg-muted/30 border-dashed">
                  <Archive className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No deleted memories
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deleted memories can be restored here for up to 2 weeks.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Info banner */}
                  <Card className="p-3 mb-4 bg-amber-50 dark:bg-amber-950/20 border-amber-500/30">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <p className="font-medium text-amber-700 dark:text-amber-400">
                          {deletedStats.total} deleted {deletedStats.total === 1 ? "memory" : "memories"}
                        </p>
                        <p className="text-muted-foreground">
                          Restore within 2 weeks or they will be permanently removed.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-2">
                      {deletedMemories.map((memory) => (
                        <Card key={memory.id} className="p-3 hover:bg-muted/50 transition-colors border-dashed opacity-80">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  {getTypeIcon(memory.type)}
                                  <span className="text-xs font-medium">{getTypeLabel(memory.type)}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400">
                                  <Clock className="h-2.5 w-2.5 mr-1" />
                                  {formatTimeRemaining(memory.expiresAt)}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px]">
                                  {getDeletionReasonLabel(memory.deletionReason)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{memory.content}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>
                                  Deleted {new Date(memory.deletedAt).toLocaleDateString(currentLanguage === "de" ? "de-DE" : "en-US")}
                                </span>
                                {memory.originalImportance && memory.originalImportance !== memory.importance && (
                                  <span>• Was importance {memory.originalImportance}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => restoreMemory(memory.id)}
                                className="h-8 px-2 text-green-600 border-green-500/50 hover:bg-green-50 dark:hover:bg-green-950/30"
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                Restore
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => permanentlyDeleteFromArchive(memory.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
