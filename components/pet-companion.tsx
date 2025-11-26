"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { petService, type Pet, type PetType, type PetPersonality, type PetMessage, achievementService, gamificationService } from "@/lib/simple-mode-features"
import { cn } from "@/lib/utils"
import { X, Sparkles } from "lucide-react"

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
    releaseConfirm: "Are you sure you want to release your pet?",
    yes: "Yes",
    no: "No",
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
    releaseConfirm: "Möchtest du dein Haustier wirklich freilassen?",
    yes: "Ja",
    no: "Nein",
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
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            {t.adoptPet}
          </DialogTitle>
          <DialogDescription>{t.adoptDesc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto min-h-0">
          {/* Pet Type Selection */}
          <div className="space-y-2">
            <Label>{t.choosePet}</Label>
            <div className="grid grid-cols-3 gap-2">
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
                  <span className="text-sm font-medium">
                    {t[pet.type as keyof typeof t]}
                  </span>
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
            <div className="grid grid-cols-2 gap-2">
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
                  <span className="text-xs text-muted-foreground">
                    {t[`${p.id}Desc` as keyof typeof t]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            onClick={handleAdopt}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t.adopt}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Pet Widget Component
interface PetWidgetProps {
  onOpenAdopt: () => void
  lang: "en" | "de"
}

export function PetWidget({ onOpenAdopt, lang }: PetWidgetProps) {
  const [pet, setPet] = useState<Pet | null>(null)
  const [message, setMessage] = useState<PetMessage | null>(null)
  const [showMessage, setShowMessage] = useState(false)
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)

  const t = translations[lang]
  const settings = gamificationService.getSettings()

  useEffect(() => {
    if (settings.petEnabled) {
      const savedPet = petService.getPet()
      setPet(savedPet)
      if (savedPet) {
        const greeting = petService.getGreeting(savedPet)
        setMessage(greeting)
        setShowMessage(true)
        // Hide message after 3 seconds
        const timer = setTimeout(() => setShowMessage(false), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [settings.petEnabled])

  const handleInteract = () => {
    if (pet) {
      const updated = petService.interact(pet)
      setPet(updated)
      const newMessage = petService.getGreeting(updated)
      setMessage(newMessage)
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 3000)
    }
  }

  const handleRelease = () => {
    petService.deletePet()
    setPet(null)
    setShowReleaseConfirm(false)
  }

  if (!settings.petEnabled) return null

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

  const petEmoji = petService.getEmoji(pet)

  return (
    <div className="relative">
      {/* Pet Button */}
      <button
        onClick={handleInteract}
        onContextMenu={(e) => {
          e.preventDefault()
          setShowReleaseConfirm(true)
        }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-500/20 transition-all",
          message?.animation === "bounce" && "animate-bounce",
          message?.animation === "pulse" && "animate-pulse",
          message?.animation === "wiggle" && "animate-wiggle",
          message?.animation === "shake" && "animate-shake"
        )}
        title={pet.name}
      >
        <span className="text-base">{petEmoji}</span>
        <span className="text-xs font-medium max-w-[60px] truncate">{pet.name}</span>
      </button>

      {/* Speech Bubble */}
      {showMessage && message && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background border rounded-xl shadow-lg text-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{message.text}</span>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-background border-r border-b"></div>
        </div>
      )}

      {/* Release Confirmation */}
      {showReleaseConfirm && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-background border rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm mb-2">{t.releaseConfirm}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleRelease}>
              {t.yes}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowReleaseConfirm(false)}>
              {t.no}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
