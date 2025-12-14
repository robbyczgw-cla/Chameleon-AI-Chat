"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  petService,
  type Pet,
  type PetType,
  type PetPersonality,
  type PetMessage,
  type PetMood,
  type PetAction,
  petFoods,
  petToys,
  achievementService,
  gamificationService
} from "@/lib/simple-mode-features"
import { cn } from "@/lib/utils"
import { Sparkles, Heart, Utensils, Gamepad2, Bath, Moon, Sun, Pill, X, ChevronDown, ChevronUp } from "lucide-react"

const translations = {
  en: {
    adoptPet: "Adopt a Pet",
    adoptDesc: "Choose your AI companion! They'll keep you company and react to your activities.",
    choosePet: "Choose your pet",
    chameleon: "Chameleon",
    dog: "Dog",
    cat: "Cat",
    petName: "Name your pet",
    namePlaceholder: "What's their name?",
    personality: "Choose personality",
    loyal: "Loyal",
    loyalDesc: "Always by your side",
    playful: "Playful",
    playfulDesc: "Full of fun and games",
    lazy: "Lazy",
    lazyDesc: "Chill and relaxed",
    curious: "Curious",
    curiousDesc: "Always exploring",
    calm: "Calm",
    calmDesc: "Peaceful and zen",
    energetic: "Energetic",
    energeticDesc: "Bouncing with energy",
    adopt: "Adopt",
    cancel: "Cancel",
    nameRequired: "Please give your pet a name!",
    petAdopted: "Welcome to the family!",
    releasePet: "Release Pet",
    releaseConfirm: "Are you sure you want to release",
    releaseWarning: "This action cannot be undone!",
    yes: "Yes, Release",
    no: "No, Keep",
    // Tamagotchi specific
    hunger: "Hunger",
    happiness: "Happiness",
    energy: "Energy",
    hygiene: "Hygiene",
    health: "Health",
    feed: "Feed",
    play: "Play",
    clean: "Clean",
    sleep: "Sleep",
    wake: "Wake",
    heal: "Heal",
    age: "Age",
    stage: "Stage",
    egg: "Egg",
    baby: "Baby",
    child: "Child",
    teen: "Teen",
    adult: "Adult",
    selectFood: "Select Food",
    selectToy: "Select Toy",
    petStatus: "Pet Status",
    actions: "Actions",
    close: "Close",
    needsAttention: "needs attention!",
    petInfo: "Pet Info",
    careScore: "Care Score",
    experience: "XP",
  },
  de: {
    adoptPet: "Haustier adoptieren",
    adoptDesc: "Wähle deinen KI-Begleiter! Sie werden dir Gesellschaft leisten.",
    choosePet: "Wähle dein Haustier",
    chameleon: "Chamäleon",
    dog: "Hund",
    cat: "Katze",
    petName: "Benenne dein Haustier",
    namePlaceholder: "Wie soll es heißen?",
    personality: "Wähle Persönlichkeit",
    loyal: "Treu",
    loyalDesc: "Immer an deiner Seite",
    playful: "Verspielt",
    playfulDesc: "Voller Spaß und Spiele",
    lazy: "Faul",
    lazyDesc: "Entspannt und chillig",
    curious: "Neugierig",
    curiousDesc: "Immer am Entdecken",
    calm: "Ruhig",
    calmDesc: "Friedlich und zen",
    energetic: "Energiegeladen",
    energeticDesc: "Voller Energie",
    adopt: "Adoptieren",
    cancel: "Abbrechen",
    nameRequired: "Gib deinem Haustier einen Namen!",
    petAdopted: "Willkommen in der Familie!",
    releasePet: "Haustier freilassen",
    releaseConfirm: "Möchtest du wirklich freilassen",
    releaseWarning: "Diese Aktion kann nicht rückgängig gemacht werden!",
    yes: "Ja, Freilassen",
    no: "Nein, Behalten",
    // Tamagotchi specific
    hunger: "Hunger",
    happiness: "Glück",
    energy: "Energie",
    hygiene: "Hygiene",
    health: "Gesundheit",
    feed: "Füttern",
    play: "Spielen",
    clean: "Waschen",
    sleep: "Schlafen",
    wake: "Aufwecken",
    heal: "Heilen",
    age: "Alter",
    stage: "Stufe",
    egg: "Ei",
    baby: "Baby",
    child: "Kind",
    teen: "Teenager",
    adult: "Erwachsen",
    selectFood: "Essen wählen",
    selectToy: "Spielzeug wählen",
    petStatus: "Haustier Status",
    actions: "Aktionen",
    close: "Schließen",
    needsAttention: "braucht Aufmerksamkeit!",
    petInfo: "Haustier Info",
    careScore: "Pflege-Score",
    experience: "XP",
  },
}

const petTypes: { type: PetType; emoji: string; gradient: string }[] = [
  { type: "chameleon", emoji: "🦎", gradient: "from-green-400 to-emerald-500" },
  { type: "dog", emoji: "🐕", gradient: "from-amber-400 to-orange-500" },
  { type: "cat", emoji: "🐱", gradient: "from-purple-400 to-pink-500" },
]

const personalities: { id: PetPersonality; gradient: string }[] = [
  { id: "loyal", gradient: "from-blue-400 to-blue-600" },
  { id: "playful", gradient: "from-pink-400 to-rose-500" },
  { id: "lazy", gradient: "from-gray-400 to-slate-500" },
  { id: "curious", gradient: "from-amber-400 to-yellow-500" },
  { id: "calm", gradient: "from-teal-400 to-cyan-500" },
  { id: "energetic", gradient: "from-orange-400 to-red-500" },
]

const getStatColor = (value: number): string => {
  if (value >= 70) return "bg-green-500"
  if (value >= 40) return "bg-yellow-500"
  if (value >= 20) return "bg-orange-500"
  return "bg-red-500"
}

const getStatEmoji = (stat: string, value: number): string => {
  const emojis: Record<string, { high: string; medium: string; low: string; critical: string }> = {
    hunger: { high: "😋", medium: "😐", low: "😕", critical: "😫" },
    happiness: { high: "😊", medium: "🙂", low: "😔", critical: "😢" },
    energy: { high: "⚡", medium: "🔋", low: "🪫", critical: "😴" },
    hygiene: { high: "✨", medium: "🧼", low: "💨", critical: "🦨" },
    health: { high: "💚", medium: "💛", low: "🧡", critical: "❤️‍🩹" },
  }
  const e = emojis[stat]
  if (value >= 70) return e.high
  if (value >= 40) return e.medium
  if (value >= 20) return e.low
  return e.critical
}

interface PetAdoptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdopt: (pet: Pet) => void
  lang: "en" | "de"
}

export function PetAdoptDialog({ open, onOpenChange, onAdopt, lang }: PetAdoptDialogProps) {
  const t = translations[lang]
  const [selectedType, setSelectedType] = useState<PetType>("chameleon")
  const [selectedPersonality, setSelectedPersonality] = useState<PetPersonality>("playful")
  const [petName, setPetName] = useState("")
  const [error, setError] = useState(false)

  const handleAdopt = () => {
    if (!petName.trim()) {
      setError(true)
      return
    }
    const pet = petService.createPet(selectedType, petName.trim(), selectedPersonality)
    achievementService.unlock("pet_owner")
    onAdopt(pet)
    onOpenChange(false)
    setPetName("")
    setError(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,900px)] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            {t.adoptPet}
          </DialogTitle>
          <DialogDescription>{t.adoptDesc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Pet Type Selection */}
          <div className="space-y-2">
            <Label>{t.choosePet}</Label>
            <div className="grid grid-cols-3 gap-3">
              {petTypes.map((pet) => (
                <button
                  key={pet.type}
                  onClick={() => setSelectedType(pet.type)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    selectedType === pet.type
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-border hover:border-violet-300"
                  )}
                >
                  <div className={cn("h-12 w-12 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl", pet.gradient)}>
                    {pet.emoji}
                  </div>
                  <span className="text-sm font-medium">{t[pet.type as keyof typeof t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pet Name */}
          <div className="space-y-2">
            <Label htmlFor="pet-name">{t.petName}</Label>
            <Input
              id="pet-name"
              placeholder={t.namePlaceholder}
              value={petName}
              onChange={(e) => {
                setPetName(e.target.value)
                if (e.target.value.trim()) setError(false)
              }}
              className={cn("h-11", error && "border-red-500")}
            />
            {error && <p className="text-sm text-red-500">{t.nameRequired}</p>}
          </div>

          {/* Personality Selection */}
          <div className="space-y-2">
            <Label>{t.personality}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {personalities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersonality(p.id)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left",
                    selectedPersonality === p.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-border hover:border-violet-300"
                  )}
                >
                  <span className="font-medium text-sm">{t[p.id as keyof typeof t]}</span>
                  <span className="text-xs text-muted-foreground">{t[`${p.id}Desc` as keyof typeof t]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            onClick={handleAdopt}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t.adopt}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Stat Bar Component
function StatBar({ label, value, emoji, lang }: { label: string; value: number; emoji: string; lang: "en" | "de" }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          <span>{emoji}</span>
          <span className="text-muted-foreground">{label}</span>
        </span>
        <span className={cn(
          "font-medium",
          value >= 70 ? "text-green-500" : value >= 40 ? "text-yellow-500" : value >= 20 ? "text-orange-500" : "text-red-500"
        )}>
          {Math.round(value)}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", getStatColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// Pet Sprite Display Component
function PetSprite({ pet, action, animate }: { pet: Pet; action?: PetAction; animate?: boolean }) {
  const sprite = petService.getSprite(pet, action)
  const mood = petService.getMood(pet)

  const animationClass = animate ? cn(
    mood === "happy" || mood === "ecstatic" ? "animate-bounce" :
    mood === "sleeping" ? "animate-pulse" :
    mood === "sick" ? "animate-shake" :
    mood === "hungry" ? "animate-wiggle" :
    "animate-float"
  ) : ""

  return (
    <div className={cn("font-mono text-center leading-tight whitespace-pre", animationClass)}>
      {sprite.map((line, i) => (
        <div key={i} className="text-lg sm:text-xl">{line}</div>
      ))}
    </div>
  )
}

// Full Tamagotchi Dialog
interface TamagotchiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pet: Pet
  onPetUpdate: (pet: Pet) => void
  onRelease: () => void
  lang: "en" | "de"
}

export function TamagotchiDialog({ open, onOpenChange, pet, onPetUpdate, onRelease, lang }: TamagotchiDialogProps) {
  const t = translations[lang]
  const [message, setMessage] = useState<PetMessage | null>(null)
  const [currentAction, setCurrentAction] = useState<PetAction | null>(null)
  const [showFoodMenu, setShowFoodMenu] = useState(false)
  const [showToyMenu, setShowToyMenu] = useState(false)
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)

  const foods = petFoods[pet.type]
  const toys = petToys[pet.type]
  const mood = petService.getMood(pet)
  const attention = petService.needsAttention(pet)

  const handleAction = useCallback((actionFn: () => { pet: Pet; message: PetMessage }, action: PetAction) => {
    setCurrentAction(action)
    const result = actionFn()
    onPetUpdate(result.pet)
    setMessage(result.message)
    setTimeout(() => {
      setCurrentAction(null)
      setMessage(null)
    }, 2000)
  }, [onPetUpdate])

  const handleFeed = (foodId: string) => {
    handleAction(() => petService.feed(pet, foodId), "eating")
    setShowFoodMenu(false)
  }

  const handlePlay = (toyId: string) => {
    handleAction(() => petService.play(pet, toyId), "playing")
    setShowToyMenu(false)
  }

  const handleClean = () => {
    handleAction(() => petService.clean(pet), "bathing")
  }

  const handleSleep = () => {
    if (pet.isSleeping) {
      handleAction(() => petService.wake(pet), "idle")
    } else {
      handleAction(() => petService.sleep(pet), "sleeping")
    }
  }

  const handleHeal = () => {
    handleAction(() => petService.heal(pet), "celebrating")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,500px)] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {petService.getEmoji(pet)} {pet.name}
              </h2>
              <p className="text-sm opacity-90">
                {petService.getLifeStageDisplay(pet.lifeStage, lang)} • {petService.getAgeDisplay(pet, lang)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Attention Alert */}
          {attention.needs && (
            <div className={cn(
              "rounded-lg p-3 text-sm flex items-center gap-2",
              attention.urgent ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            )}>
              <span className="text-lg">{attention.urgent ? "⚠️" : "💭"}</span>
              <span>{pet.name} {t.needsAttention}</span>
            </div>
          )}

          {/* Pet Display */}
          <div className="bg-gradient-to-b from-sky-100 to-green-100 dark:from-sky-900/30 dark:to-green-900/30 rounded-xl p-6 text-center">
            <PetSprite pet={pet} action={currentAction || undefined} animate />

            {/* Speech Bubble */}
            {message && (
              <div className="mt-4 inline-block bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm">{message.emoji} {message.text}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              {t.petStatus}
            </h3>
            <div className="grid gap-2">
              <StatBar label={t.hunger} value={pet.stats.hunger} emoji={getStatEmoji("hunger", pet.stats.hunger)} lang={lang} />
              <StatBar label={t.happiness} value={pet.stats.happiness} emoji={getStatEmoji("happiness", pet.stats.happiness)} lang={lang} />
              <StatBar label={t.energy} value={pet.stats.energy} emoji={getStatEmoji("energy", pet.stats.energy)} lang={lang} />
              <StatBar label={t.hygiene} value={pet.stats.hygiene} emoji={getStatEmoji("hygiene", pet.stats.hygiene)} lang={lang} />
              <StatBar label={t.health} value={pet.stats.health} emoji={getStatEmoji("health", pet.stats.health)} lang={lang} />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-violet-500" />
              {t.actions}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {/* Feed Button */}
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setShowFoodMenu(!showFoodMenu)}
                  disabled={pet.isSleeping}
                >
                  <Utensils className="h-4 w-4" />
                  {t.feed}
                  {showFoodMenu ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </Button>
                {showFoodMenu && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-10 p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                    {foods.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => handleFeed(food.id)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center gap-2 text-sm"
                      >
                        <span>{food.emoji}</span>
                        <span>{food.name[lang]}</span>
                        <span className="text-xs text-muted-foreground ml-auto">+{food.hungerRestore}%</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Play Button */}
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setShowToyMenu(!showToyMenu)}
                  disabled={pet.isSleeping || pet.stats.energy < 5}
                >
                  <Gamepad2 className="h-4 w-4" />
                  {t.play}
                  {showToyMenu ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </Button>
                {showToyMenu && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-10 p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                    {toys.map((toy) => (
                      <button
                        key={toy.id}
                        onClick={() => handlePlay(toy.id)}
                        disabled={pet.stats.energy < toy.energyCost}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm",
                          pet.stats.energy < toy.energyCost ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                        )}
                      >
                        <span>{toy.emoji}</span>
                        <span>{toy.name[lang]}</span>
                        <span className="text-xs text-muted-foreground ml-auto">-{toy.energyCost}⚡</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clean Button */}
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={handleClean}
              >
                <Bath className="h-4 w-4" />
                {t.clean}
              </Button>

              {/* Sleep/Wake Button */}
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={handleSleep}
              >
                {pet.isSleeping ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {pet.isSleeping ? t.wake : t.sleep}
              </Button>

              {/* Heal Button */}
              <Button
                variant="outline"
                className="justify-start gap-2 col-span-2"
                onClick={handleHeal}
                disabled={pet.stats.health > 80}
              >
                <Pill className="h-4 w-4" />
                {t.heal}
              </Button>
            </div>
          </div>

          {/* Pet Info */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold">{t.petInfo}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.stage}:</span>
                <span>{petService.getLifeStageDisplay(pet.lifeStage, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.age}:</span>
                <span>{petService.getAgeDisplay(pet, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.careScore}:</span>
                <span>{Math.round(pet.careScore)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.experience}:</span>
                <span>{pet.experience}</span>
              </div>
            </div>
          </div>

          {/* Release Pet */}
          <div className="pt-2 border-t">
            {!showReleaseConfirm ? (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={() => setShowReleaseConfirm(true)}
              >
                {t.releasePet}
              </Button>
            ) : (
              <div className="bg-destructive/10 rounded-lg p-4 space-y-3">
                <p className="text-sm text-center">
                  {t.releaseConfirm} <strong>{pet.name}</strong>?
                </p>
                <p className="text-xs text-center text-muted-foreground">{t.releaseWarning}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowReleaseConfirm(false)}
                  >
                    {t.no}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      onRelease()
                      onOpenChange(false)
                    }}
                  >
                    {t.yes}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Pet Widget Component (header button)
interface PetWidgetProps {
  onOpenAdopt: () => void
  lang: "en" | "de"
  onChatWithPet?: (prompt: string) => void
}

export function PetWidget({ onOpenAdopt, lang, onChatWithPet }: PetWidgetProps) {
  const [pet, setPet] = useState<Pet | null>(null)
  const [message, setMessage] = useState<PetMessage | null>(null)
  const [showMessage, setShowMessage] = useState(false)
  const [showTamagotchi, setShowTamagotchi] = useState(false)

  const t = translations[lang]
  const settings = gamificationService.getSettings()
  const petMode = settings.petMode || (settings.petEnabled ? "full" : "off")

  // Update pet stats periodically
  useEffect(() => {
    if (petMode === "off") return

    const savedPet = petService.getPet()
    if (savedPet) {
      // Only update stats in full mode
      const updated = petMode === "full" ? petService.updateStats(savedPet) : savedPet
      setPet(updated)
      const greeting = petService.getGreeting(updated)
      setMessage(greeting)
      setShowMessage(true)
      const timer = setTimeout(() => setShowMessage(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setPet(null)
    }
  }, [petMode])

  // Periodic stat update (only in full mode)
  useEffect(() => {
    if (!pet || petMode !== "full") return

    const interval = setInterval(() => {
      const updated = petService.updateStats(pet)
      setPet(updated)
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [pet, petMode])

  const handleInteract = () => {
    if (!pet) return

    if (petMode === "minimal") {
      // In minimal mode, just interact and show a message
      const updated = petService.interact(pet)
      setPet(updated)
      const greeting = petService.getGreeting(updated)
      setMessage(greeting)
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 3000)
    } else {
      // In full mode, open the Tamagotchi dialog
      setShowTamagotchi(true)
    }
  }

  const handlePetUpdate = (updatedPet: Pet) => {
    setPet(updatedPet)
  }

  const handleRelease = () => {
    petService.deletePet()
    setPet(null)
  }

  // Public method to trigger pet reaction from chat
  const triggerReaction = useCallback((userMessage: string) => {
    if (!pet || petMode === "off") return null
    const reaction = petService.reactToMessage(pet, userMessage)
    if (reaction) {
      setMessage(reaction)
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 3000)
    }
    return reaction
  }, [pet, petMode])

  if (petMode === "off") return null

  if (!pet) {
    return (
      <button
        onClick={onOpenAdopt}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-500/20 transition-all"
        title={t.adoptPet}
      >
        <span className="text-base">🐾</span>
      </button>
    )
  }

  const attention = petMode === "full" ? petService.needsAttention(pet) : { needs: false, urgent: false, reasons: [] }
  const mood = petService.getMood(pet)
  const petEmoji = petService.getEmoji(pet)

  return (
    <>
      <div className="relative">
        {/* Pet Button */}
        <button
          onClick={handleInteract}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border transition-all",
            petMode === "full" && attention.urgent ? "border-red-500 animate-pulse" :
            petMode === "full" && attention.needs ? "border-yellow-500" : "border-violet-500/20",
            mood === "happy" && "animate-bounce",
            mood === "sleeping" && "opacity-75"
          )}
          title={pet.name}
        >
          <span className="text-base">{petEmoji}</span>
          {petMode === "full" && (
            <>
              <span className="text-xs font-medium max-w-[60px] truncate">{pet.name}</span>
              {attention.urgent && <span className="text-xs">⚠️</span>}
            </>
          )}
        </button>

        {/* Speech Bubble */}
        {showMessage && message && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background border rounded-xl shadow-lg text-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
            <span>{message.text}</span>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-background border-r border-b" />
          </div>
        )}
      </div>

      {/* Tamagotchi Dialog - only in full mode */}
      {pet && petMode === "full" && (
        <TamagotchiDialog
          open={showTamagotchi}
          onOpenChange={setShowTamagotchi}
          pet={pet}
          onPetUpdate={handlePetUpdate}
          onRelease={handleRelease}
          lang={lang}
        />
      )}
    </>
  )
}

// Export a hook for other components to use pet features
export function usePetFeatures(lang: "en" | "de" = "en") {
  const pet = petService.getPet()
  const settings = gamificationService.getSettings()
  const petMode = settings.petMode || "off"

  return {
    pet,
    petMode,
    isEnabled: petMode !== "off",
    isFullMode: petMode === "full",
    // Get conversation suggestions based on pet personality
    getSuggestions: () => pet ? petService.getConversationSuggestions(pet, lang) : [],
    // Get system prompt for LLM
    getSystemPrompt: () => pet ? petService.getPetSystemPrompt(pet, lang) : null,
    // Get chat with pet prompt
    getChatWithPetPrompt: (message: string) => pet ? petService.getChatWithPetPrompt(pet, message, lang) : null,
    // React to a message
    reactToMessage: (message: string) => pet ? petService.reactToMessage(pet, message) : null,
  }
}
