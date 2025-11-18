"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Info,
} from "lucide-react"
import { memoryService } from "@/lib/memory-service"
import type { Memory } from "@/types"
import { cn } from "@/lib/utils"

export function AIMemoryHub() {
  const { settings, updateSettings } = useApp()
  const [memories, setMemories] = useState<Memory[]>([])
  const [isEnabled, setIsEnabled] = useState(settings.memorySettings?.enabled ?? false)
  const [activeTab, setActiveTab] = useState<Memory["type"]>("preference")
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newMemory, setNewMemory] = useState({
    type: "preference" as Memory["type"],
    content: "",
    importance: 2 as 1 | 2 | 3,
    category: "",
  })
  const [stats, setStats] = useState(memoryService.getStats())

  useEffect(() => {
    loadMemories()
  }, [])

  // Sync local state with settings changes (fixes persistence bug)
  useEffect(() => {
    setIsEnabled(settings.memorySettings?.enabled ?? false)
  }, [settings.memorySettings?.enabled])

  const loadMemories = () => {
    const allMemories = memoryService.getAllMemories()
    setMemories(allMemories)
    setStats(memoryService.getStats())
  }

  const toggleMemorySystem = (enabled: boolean) => {
    setIsEnabled(enabled)
    updateSettings({
      memorySettings: {
        enabled,
        autoExtract: true,
        maxMemoriesInContext: 5,
        importanceThreshold: 2,
      },
    })
  }

  const addMemory = () => {
    if (!newMemory.content.trim()) {
      alert("Bitte gib einen Inhalt ein!")
      return
    }

    memoryService.addMemory({
      type: newMemory.type,
      content: newMemory.content,
      importance: newMemory.importance,
      category: newMemory.category || undefined,
    })

    setNewMemory({
      type: "preference",
      content: "",
      importance: 2,
      category: "",
    })
    setIsAddingNew(false)
    loadMemories()
  }

  const deleteMemory = (id: string) => {
    if (confirm("Memory wirklich löschen?")) {
      memoryService.deleteMemory(id)
      loadMemories()
    }
  }

  const updateMemoryImportance = (id: string, importance: 1 | 2 | 3) => {
    memoryService.updateMemory(id, { importance })
    loadMemories()
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
      preference: "Präferenzen",
      fact: "Fakten",
      context: "Kontext",
      skill: "Fähigkeiten",
      goal: "Ziele",
    }
    return labels[type]
  }

  const getImportanceColor = (importance: 1 | 2 | 3) => {
    if (importance === 3) return "bg-red-500"
    if (importance === 2) return "bg-yellow-500"
    return "bg-green-500"
  }

  const filteredMemories = memories.filter((m) => m.type === activeTab)

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">AI Memory System</h3>
            <p className="text-xs text-muted-foreground">
              Intelligentes Langzeit-Gedächtnis für deine Konversationen
            </p>
          </div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={toggleMemorySystem} />
      </div>

      {!isEnabled && (
        <Card className="p-6 text-center bg-muted/30 border-dashed">
          <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">
            Memory System ist deaktiviert
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Aktiviere das System, um wichtige Informationen über dich zu speichern und in zukünftigen Chats zu nutzen
          </p>
          <Button onClick={() => toggleMemorySystem(true)} size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Jetzt aktivieren
          </Button>
        </Card>
      )}

      {isEnabled && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-500">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Gesamt</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.preference}</div>
              <div className="text-xs text-muted-foreground">Präferenzen</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.fact}</div>
              <div className="text-xs text-muted-foreground">Fakten</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.skill}</div>
              <div className="text-xs text-muted-foreground">Skills</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold">{stats.byType.goal}</div>
              <div className="text-xs text-muted-foreground">Ziele</div>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-500/30">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <p>
                  <strong>Wie funktioniert es?</strong>
                </p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Conversation Insights → speichert wichtige Fakten automatisch</li>
                  <li>Personality Analysis → erstellt Präferenz-Memories</li>
                  <li>Prompt Evolution → trackt deine Skills</li>
                  <li>Knowledge Base → nutzt Memories für bessere Suche</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Memory Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Memory["type"])}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="preference" className="text-xs">
                {getTypeIcon("preference")}
                <span className="ml-1.5 hidden sm:inline">Präferenzen</span>
              </TabsTrigger>
              <TabsTrigger value="fact" className="text-xs">
                {getTypeIcon("fact")}
                <span className="ml-1.5 hidden sm:inline">Fakten</span>
              </TabsTrigger>
              <TabsTrigger value="context" className="text-xs">
                {getTypeIcon("context")}
                <span className="ml-1.5 hidden sm:inline">Kontext</span>
              </TabsTrigger>
              <TabsTrigger value="skill" className="text-xs">
                {getTypeIcon("skill")}
                <span className="ml-1.5 hidden sm:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="goal" className="text-xs">
                {getTypeIcon("goal")}
                <span className="ml-1.5 hidden sm:inline">Ziele</span>
              </TabsTrigger>
            </TabsList>

            {/* Add New Memory Button */}
            <div className="mt-3">
              {!isAddingNew ? (
                <Button onClick={() => setIsAddingNew(true)} size="sm" variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Neue {getTypeLabel(activeTab)} hinzufügen
                </Button>
              ) : (
                <Card className="p-4 space-y-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="space-y-2">
                    <Label className="text-sm">Inhalt</Label>
                    <Input
                      value={newMemory.content}
                      onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                      placeholder="z.B. 'Bevorzugt Dark Mode' oder 'Arbeitet als Entwickler'"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Kategorie (optional)</Label>
                      <Input
                        value={newMemory.category}
                        onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                        placeholder="z.B. 'UI/UX'"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Wichtigkeit</Label>
                      <select
                        value={newMemory.importance}
                        onChange={(e) => setNewMemory({ ...newMemory, importance: parseInt(e.target.value) as 1 | 2 | 3 })}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value={1}>Niedrig</option>
                        <option value={2}>Mittel</option>
                        <option value={3}>Hoch</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addMemory} size="sm" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Speichern
                    </Button>
                    <Button onClick={() => setIsAddingNew(false)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Memory List */}
            <TabsContent value={activeTab} className="mt-4">
              {filteredMemories.length === 0 ? (
                <Card className="p-6 text-center bg-muted/30 border-dashed">
                  <div className="flex justify-center mb-3">
                    {getTypeIcon(activeTab)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keine {getTypeLabel(activeTab)} vorhanden
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
                                {new Date(memory.createdAt).toLocaleDateString("de-DE")}
                              </span>
                              <span>• {memory.accessCount} mal verwendet</span>
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
          </Tabs>
        </>
      )}
    </div>
  )
}
