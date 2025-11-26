"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  achievementService,
  streakService,
  gamificationService,
  type Achievement,
  type StreakData,
  type GamificationSettings,
} from "@/lib/simple-mode-features"
import { cn } from "@/lib/utils"
import { Trophy, Flame, Lock, Check, Settings, Sparkles } from "lucide-react"

const translations = {
  en: {
    title: "Achievements & Streaks",
    achievements: "Achievements",
    streaks: "Streaks",
    settings: "Settings",
    unlocked: "Unlocked",
    locked: "Locked",
    progress: "Progress",
    currentStreak: "Current Streak",
    longestStreak: "Longest Streak",
    totalDays: "Total Days Active",
    thisWeek: "This Week",
    days: "days",
    day: "day",
    enableAchievements: "Enable Achievements",
    enableStreaks: "Enable Streaks",
    enablePet: "Enable Pet Companion",
    enableNotifications: "Show Notifications",
    disableAll: "Disable All Gamification",
    secret: "Secret Achievement",
    newUnlock: "New Achievement!",
    close: "Close",
  },
  de: {
    title: "Erfolge & Serien",
    achievements: "Erfolge",
    streaks: "Serien",
    settings: "Einstellungen",
    unlocked: "Freigeschaltet",
    locked: "Gesperrt",
    progress: "Fortschritt",
    currentStreak: "Aktuelle Serie",
    longestStreak: "Längste Serie",
    totalDays: "Gesamt aktive Tage",
    thisWeek: "Diese Woche",
    days: "Tage",
    day: "Tag",
    enableAchievements: "Erfolge aktivieren",
    enableStreaks: "Serien aktivieren",
    enablePet: "Haustier aktivieren",
    enableNotifications: "Benachrichtigungen anzeigen",
    disableAll: "Gamification deaktivieren",
    secret: "Geheimer Erfolg",
    newUnlock: "Neuer Erfolg!",
    close: "Schließen",
  },
}

interface AchievementsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lang: "en" | "de"
}

export function AchievementsDialog({ open, onOpenChange, lang }: AchievementsDialogProps) {
  const t = translations[lang]
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [streaks, setStreaks] = useState<StreakData | null>(null)
  const [settings, setSettings] = useState<GamificationSettings | null>(null)
  const [activeTab, setActiveTab] = useState("achievements")

  useEffect(() => {
    if (open) {
      setAchievements(achievementService.getAchievements())
      setStreaks(streakService.getStreaks())
      setSettings(gamificationService.getSettings())
    }
  }, [open])

  const handleSettingChange = (key: keyof GamificationSettings, value: boolean) => {
    if (!settings) return
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    gamificationService.saveSettings(newSettings)
  }

  const handleDisableAll = () => {
    const newSettings: GamificationSettings = {
      achievementsEnabled: false,
      streaksEnabled: false,
      petEnabled: false,
      notificationsEnabled: false,
    }
    setSettings(newSettings)
    gamificationService.saveSettings(newSettings)
  }

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length
  const totalCount = achievements.filter((a) => !a.secret || a.unlockedAt).length
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100)

  const weekDays = lang === "de"
    ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  // Reverse weekly activity to show from Monday to today
  const getWeeklyDisplay = () => {
    if (!streaks) return []
    const today = new Date().getDay()
    const adjustedToday = today === 0 ? 6 : today - 1 // Convert Sunday=0 to Monday-based
    const result = []
    for (let i = 0; i < 7; i++) {
      const dayIndex = (adjustedToday - (6 - i) + 7) % 7
      result.push({
        day: weekDays[dayIndex],
        active: streaks.weeklyActivity[6 - i] || false,
        isToday: i === 6,
      })
    }
    return result
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {unlockedCount} / {totalCount} {t.unlocked} ({progressPercent}%)
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 gap-1">
            <TabsTrigger value="achievements" className="text-xs gap-1">
              <Trophy className="h-3.5 w-3.5" />
              {t.achievements}
            </TabsTrigger>
            <TabsTrigger value="streaks" className="text-xs gap-1">
              <Flame className="h-3.5 w-3.5" />
              {t.streaks}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1">
              <Settings className="h-3.5 w-3.5" />
              {t.settings}
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="flex-1 overflow-y-auto mt-4 space-y-2">
            {achievements.map((achievement) => {
              const isUnlocked = !!achievement.unlockedAt
              const isSecret = achievement.secret && !isUnlocked
              const name = achievement.name[lang]
              const description = achievement.description[lang]
              const progress = achievement.progress || 0
              const maxProgress = achievement.maxProgress || 0

              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    isUnlocked
                      ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                      isUnlocked
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                        : "bg-muted"
                    )}
                  >
                    {isSecret ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : isUnlocked ? (
                      achievement.emoji
                    ) : (
                      <span className="opacity-30">{achievement.emoji}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium text-sm", !isUnlocked && "text-muted-foreground")}>
                        {isSecret ? t.secret : name}
                      </p>
                      {isUnlocked && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {isSecret ? "???" : description}
                    </p>
                    {maxProgress > 0 && !isUnlocked && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={(progress / maxProgress) * 100} className="h-1.5" />
                        <span className="text-xs text-muted-foreground">
                          {progress}/{maxProgress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {streaks && settings?.streaksEnabled ? (
              <>
                {/* Current Streak */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.currentStreak}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold">{streaks.currentStreak}</span>
                        <span className="text-lg">{streaks.currentStreak === 1 ? t.day : t.days}</span>
                        <span className="text-2xl">{streakService.getStreakEmoji(streaks.currentStreak)}</span>
                      </div>
                    </div>
                    <Flame className="h-12 w-12 text-orange-500" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border bg-muted/50">
                    <p className="text-xs text-muted-foreground">{t.longestStreak}</p>
                    <p className="text-xl font-bold">{streaks.longestStreak} {t.days}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-muted/50">
                    <p className="text-xs text-muted-foreground">{t.totalDays}</p>
                    <p className="text-xl font-bold">{streaks.totalDaysActive}</p>
                  </div>
                </div>

                {/* Weekly Activity */}
                <div className="p-4 rounded-xl border">
                  <p className="text-sm font-medium mb-3">{t.thisWeek}</p>
                  <div className="flex justify-between gap-1">
                    {getWeeklyDisplay().map((day, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center text-sm",
                            day.active
                              ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
                              : "bg-muted text-muted-foreground",
                            day.isToday && "ring-2 ring-violet-500 ring-offset-2"
                          )}
                        >
                          {day.active ? "✓" : "·"}
                        </div>
                        <span className="text-xs text-muted-foreground">{day.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Flame className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Streaks are disabled</p>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {settings && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="achievements-toggle" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      {t.enableAchievements}
                    </Label>
                    <Switch
                      id="achievements-toggle"
                      checked={settings.achievementsEnabled}
                      onCheckedChange={(v) => handleSettingChange("achievementsEnabled", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="streaks-toggle" className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {t.enableStreaks}
                    </Label>
                    <Switch
                      id="streaks-toggle"
                      checked={settings.streaksEnabled}
                      onCheckedChange={(v) => handleSettingChange("streaksEnabled", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="pet-toggle" className="flex items-center gap-2">
                      <span className="text-base">🐾</span>
                      {t.enablePet}
                    </Label>
                    <Switch
                      id="pet-toggle"
                      checked={settings.petEnabled}
                      onCheckedChange={(v) => handleSettingChange("petEnabled", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications-toggle" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      {t.enableNotifications}
                    </Label>
                    <Switch
                      id="notifications-toggle"
                      checked={settings.notificationsEnabled}
                      onCheckedChange={(v) => handleSettingChange("notificationsEnabled", v)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleDisableAll}
                    className="w-full text-muted-foreground"
                  >
                    {t.disableAll}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>{t.close}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Achievement Toast Component for new unlocks
interface AchievementToastProps {
  achievement: Achievement
  lang: "en" | "de"
  onClose: () => void
}

export function AchievementToast({ achievement, lang, onClose }: AchievementToastProps) {
  const t = translations[lang]

  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl shadow-lg">
        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-xl">
          {achievement.emoji}
        </div>
        <div>
          <p className="text-xs font-medium opacity-90">{t.newUnlock}</p>
          <p className="font-bold">{achievement.name[lang]}</p>
        </div>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  )
}

// Streak Widget for header
interface StreakWidgetProps {
  onClick: () => void
}

export function StreakWidget({ onClick }: StreakWidgetProps) {
  const [streaks, setStreaks] = useState<StreakData | null>(null)
  const settings = gamificationService.getSettings()

  useEffect(() => {
    if (settings.streaksEnabled) {
      setStreaks(streakService.getStreaks())
    }
  }, [settings.streaksEnabled])

  if (!settings.streaksEnabled || !streaks || streaks.currentStreak === 0) return null

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 border border-orange-500/20 transition-all"
      title={`${streaks.currentStreak} day streak`}
    >
      <Flame className="h-3.5 w-3.5 text-orange-500" />
      <span className="text-xs font-bold">{streaks.currentStreak}</span>
    </button>
  )
}
