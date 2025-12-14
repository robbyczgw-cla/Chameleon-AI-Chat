/**
 * Simple Mode Features - Pet Companion, Streaks, Achievements
 */

// ==================== TAMAGOTCHI PET COMPANION ====================

export type PetType = "chameleon" | "dog" | "cat"
export type PetPersonality = "loyal" | "playful" | "lazy" | "curious" | "calm" | "energetic"
export type PetLifeStage = "egg" | "baby" | "child" | "teen" | "adult"
export type PetMood = "happy" | "content" | "neutral" | "sad" | "sick" | "sleeping" | "hungry" | "dirty" | "tired" | "ecstatic"
export type PetAction = "idle" | "eating" | "playing" | "sleeping" | "bathing" | "celebrating" | "refusing" | "begging"

export interface PetStats {
  hunger: number      // 0-100, 100 = full
  happiness: number   // 0-100
  energy: number      // 0-100
  hygiene: number     // 0-100, 100 = clean
  health: number      // 0-100
}

export interface Pet {
  type: PetType
  name: string
  personality: PetPersonality
  createdAt: number
  lastInteraction: number
  // Tamagotchi stats
  stats: PetStats
  lifeStage: PetLifeStage
  age: number // in hours
  experience: number // for evolution
  lastStatUpdate: number // for decay calculation
  isSleeping: boolean
  lastFed: number
  lastPlayed: number
  lastCleaned: number
  evolutionHistory: PetLifeStage[]
  // Care quality tracking
  careScore: number // affects evolution quality
  neglectCount: number // how many times stats hit critical
}

export interface PetMessage {
  text: string
  emoji: string
  animation?: "bounce" | "shake" | "pulse" | "wiggle" | "spin" | "float" | "jump" | "dance"
}

const PET_STORAGE_KEY = "chameleon-pet"

// Life stage thresholds (in hours of pet age)
const LIFE_STAGE_THRESHOLDS = {
  egg: 0,
  baby: 0.5,    // 30 minutes
  child: 4,     // 4 hours
  teen: 24,     // 1 day
  adult: 72,    // 3 days
}

// Stat decay rates per hour
const STAT_DECAY_RATES = {
  hunger: 8,     // Gets hungry faster
  happiness: 4,
  energy: 6,
  hygiene: 3,
  health: 0,     // Health only decays if other stats are low
}

// Pet ASCII art sprites for different states
export const petSprites: Record<PetType, Record<PetLifeStage, Record<PetMood | PetAction, string[]>>> = {
  chameleon: {
    egg: {
      happy: ["  🥚  ", " (◠)  ", "  ~   "],
      content: ["  🥚  ", " (•)  ", "  ~   "],
      neutral: ["  🥚  ", " (-)  ", "  ~   "],
      sad: ["  🥚  ", " (╥)  ", "  ~   "],
      sick: ["  🥚  ", " (×)  ", "  ~   "],
      hungry: ["  🥚  ", " (○)  ", "  ~   "],
      dirty: ["  🥚  ", " (~)  ", " ···  "],
      tired: ["  🥚  ", " (-)  ", " ...  "],
      ecstatic: ["  🥚  ", " (◠◠) ", "  ✨  "],
      idle: ["  🥚  ", " (•)  ", "  ~   "],
      eating: ["  🥚  ", " (ᵔᴥᵔ)", "  ~   "],
      playing: ["  🥚  ", " \\(•)/ ", "  ~   "],
      sleeping: ["  🥚  ", " (-)  ", " zzZ  "],
      bathing: ["  🥚  ", " (≧)  ", " 💦  "],
      celebrating: [" ✨🥚✨ ", " (◠◠) ", "  🎉  "],
      refusing: ["  🥚  ", " (>_<)", "  ×   "],
      begging: ["  🥚  ", " (•ω•)", " 🙏  "],
    },
    baby: {
      happy: ["  ∩∩  ", " (◕‿◕) ", "  ~~  "],
      content: ["  ∩∩  ", " (•‿•) ", "  ~~  "],
      neutral: ["  ∩∩  ", " (•_•) ", "  ~~  "],
      sad: ["  ∩∩  ", " (╥﹏╥)", "  ~~  "],
      sick: ["  ∩∩  ", " (×_×) ", "  💫  "],
      hungry: ["  ∩∩  ", " (°□°) ", " 🍽️  "],
      dirty: ["  ∩∩  ", " (≧~≦)", " 💨  "],
      tired: ["  ∩∩  ", " (-.-)  ", " 💤  "],
      ecstatic: [" ✨∩∩✨ ", " (★‿★) ", "  🎉  "],
      idle: ["  ∩∩  ", " (•‿•) ", "  ~~  "],
      eating: ["  ∩∩  ", " (ᵔᴥᵔ)🍎", " nom~  "],
      playing: [" \\∩∩/ ", " (>ω<) ", " 🎾  "],
      sleeping: ["  ∩∩  ", " (-ω-) ", " zZzZ  "],
      bathing: ["  ∩∩  ", " (≧◡≦)", " 🛁💦 "],
      celebrating: [" ✨∩∩✨ ", " \\(◕‿◕)/", " 🎊  "],
      refusing: ["  ∩∩  ", " (>_<)/ ", " ❌  "],
      begging: ["  ∩∩  ", " (◕ᴗ◕✿)", " 🙏  "],
    },
    child: {
      happy: ["  ∩∩∩  ", " (◕ᴗ◕) ", " /|\\~~  "],
      content: ["  ∩∩∩  ", " (•ᴗ•) ", " /|\\~~  "],
      neutral: ["  ∩∩∩  ", " (•_•) ", " /|\\~~  "],
      sad: ["  ∩∩∩  ", " (╥_╥) ", " /|\\~~  "],
      sick: ["  ∩∩∩  ", " (@_@) ", " /|\\💫  "],
      hungry: ["  ∩∩∩  ", " (°o°) ", " /|\\🍽️  "],
      dirty: ["  ∩∩∩  ", " (>~<) ", " /|\\💨  "],
      tired: ["  ∩∩∩  ", " (=_=) ", " /|\\...  "],
      ecstatic: [" ✨∩∩∩✨ ", " (★ω★) ", " \\|/🎉  "],
      idle: ["  ∩∩∩  ", " (•ᴗ•) ", " /|\\~~  "],
      eating: ["  ∩∩∩  ", " (ᵔᴥᵔ)🍕", " /|\\nom  "],
      playing: [" ⚽∩∩∩  ", " \\(>ω<)/", "  /\\  "],
      sleeping: ["  ∩∩∩  ", " (-ω-)  ", " /|\\zZz  "],
      bathing: ["  ∩∩∩  ", " (≧◡≦) ", "🛁/|\\💦 "],
      celebrating: [" 🎉∩∩∩🎉 ", " \\(◕‿◕)/", "  /\\  "],
      refusing: ["  ∩∩∩  ", " (╯°□°)╯", " /|\\  "],
      begging: ["  ∩∩∩  ", " (◕ᴗ◕✿)", " 🙏|\\  "],
    },
    teen: {
      happy: ["  🦎∩∩  ", " (◕‿◕)  ", " /|\\~~~  "],
      content: ["  🦎∩∩  ", " (•‿•)  ", " /|\\~~~  "],
      neutral: ["  🦎∩∩  ", " (•_•)  ", " /|\\~~~  "],
      sad: ["  🦎∩∩  ", " (T_T)  ", " /|\\~~~  "],
      sick: ["  🦎∩∩  ", " (×_×)  ", " /|\\💫  "],
      hungry: ["  🦎∩∩  ", " (°△°)  ", " /|\\🍽️  "],
      dirty: ["  🦎∩∩  ", " (>皿<)  ", " /|\\💨💨 "],
      tired: ["  🦎∩∩  ", " (=_=)  ", " /|\\...  "],
      ecstatic: [" ✨🦎∩∩✨ ", " (★▽★)  ", " \\|/🎉🎉 "],
      idle: ["  🦎∩∩  ", " (•‿•)  ", " /|\\~~~  "],
      eating: ["  🦎∩∩  ", " (ᵔᴥᵔ)🍔 ", " /|\\yum  "],
      playing: ["  🦎∩∩🎮 ", " \\(>◡<)/ ", "   /\\   "],
      sleeping: ["  🦎∩∩  ", " (-ω-)  ", " /|\\zZzZ "],
      bathing: ["  🦎∩∩  ", " (≧◡≦)  ", "🧼/|\\💦💦"],
      celebrating: ["🎊🦎∩∩🎊 ", " \\(★‿★)/ ", "   /\\   "],
      refusing: ["  🦎∩∩  ", " (¬_¬)  ", " /|\\✋  "],
      begging: ["  🦎∩∩  ", " (◕︿◕✿) ", " 🙏|\\  "],
    },
    adult: {
      happy: ["  🦎🦎∩∩ ", "  (◕‿◕)  ", " /||\\~~~~"],
      content: ["  🦎🦎∩∩ ", "  (•‿•)  ", " /||\\~~~~"],
      neutral: ["  🦎🦎∩∩ ", "  (•_•)  ", " /||\\~~~~"],
      sad: ["  🦎🦎∩∩ ", "  (T▽T)  ", " /||\\~~~~"],
      sick: ["  🦎🦎∩∩ ", "  (×_×)  ", " /||\\💫💫"],
      hungry: ["  🦎🦎∩∩ ", "  (°△°)  ", " /||\\🍽️🍽️"],
      dirty: ["  🦎🦎∩∩ ", "  (>皿<)  ", " /||\\💨💨"],
      tired: ["  🦎🦎∩∩ ", "  (=ω=)  ", " /||\\..."],
      ecstatic: ["✨🦎🦎∩∩✨", " \\(★▽★)/ ", " /||\\🎉🎉"],
      idle: ["  🦎🦎∩∩ ", "  (•‿•)  ", " /||\\~~~~"],
      eating: ["  🦎🦎∩∩ ", " (ᵔᴥᵔ)🥗 ", " /||\\~~~~"],
      playing: [" 🎯🦎🦎∩∩", " \\(>◡<)/ ", "   /\\\\   "],
      sleeping: ["  🦎🦎∩∩ ", "  (-ω-)  ", " /||\\zZzZ"],
      bathing: ["  🦎🦎∩∩ ", "  (≧◡≦)  ", "🛁/||\\💦"],
      celebrating: ["🎊🦎🦎∩∩🎊", " \\(★‿★)/ ", "  /||\\  "],
      refusing: ["  🦎🦎∩∩ ", "  (¬_¬)  ", " /||\\🚫 "],
      begging: ["  🦎🦎∩∩ ", " (◕︿◕✿) ", " 🙏||\\  "],
    },
  },
  dog: {
    egg: {
      happy: ["  🥚  ", " (◠)  ", "  ~   "],
      content: ["  🥚  ", " (•)  ", "  ~   "],
      neutral: ["  🥚  ", " (-)  ", "  ~   "],
      sad: ["  🥚  ", " (╥)  ", "  ~   "],
      sick: ["  🥚  ", " (×)  ", "  ~   "],
      hungry: ["  🥚  ", " (○)  ", "  ~   "],
      dirty: ["  🥚  ", " (~)  ", " ···  "],
      tired: ["  🥚  ", " (-)  ", " ...  "],
      ecstatic: ["  🥚  ", " (◠◠) ", "  ✨  "],
      idle: ["  🥚  ", " (•)  ", "  ~   "],
      eating: ["  🥚  ", " (ᵔᴥᵔ)", "  ~   "],
      playing: ["  🥚  ", " \\(•)/ ", "  ~   "],
      sleeping: ["  🥚  ", " (-)  ", " zzZ  "],
      bathing: ["  🥚  ", " (≧)  ", " 💦  "],
      celebrating: [" ✨🥚✨ ", " (◠◠) ", "  🎉  "],
      refusing: ["  🥚  ", " (>_<)", "  ×   "],
      begging: ["  🥚  ", " (•ω•)", " 🙏  "],
    },
    baby: {
      happy: ["  ∪∪  ", " (◕ᴥ◕) ", " ∪~~~  "],
      content: ["  ∪∪  ", " (•ᴥ•) ", " ∪~~  "],
      neutral: ["  ∪∪  ", " (•_•) ", " ∪~  "],
      sad: ["  ∪∪  ", " (╥ᴥ╥) ", " ∪...  "],
      sick: ["  ∪∪  ", " (×ᴥ×) ", " 💫  "],
      hungry: ["  ∪∪  ", " (°ᴥ°) ", " 🦴?  "],
      dirty: ["  ∪∪  ", " (≧ᴥ≦) ", " 💨  "],
      tired: ["  ∪∪  ", " (-ᴥ-) ", " 💤  "],
      ecstatic: [" ✨∪∪✨ ", " (★ᴥ★) ", " ∪∪∪  "],
      idle: ["  ∪∪  ", " (•ᴥ•) ", " ∪~~  "],
      eating: ["  ∪∪  ", " (ᵔᴥᵔ)🦴", " nom~  "],
      playing: [" \\∪∪/ ", " (>ᴥ<) ", " 🎾  "],
      sleeping: ["  ∪∪  ", " (-ᴥ-) ", " zZzZ  "],
      bathing: ["  ∪∪  ", " (≧ᴥ≦) ", " 🛁💦 "],
      celebrating: [" ✨∪∪✨ ", " \\(◕ᴥ◕)/", " 🎊  "],
      refusing: ["  ∪∪  ", " (>_<)/ ", " ❌  "],
      begging: ["  ∪∪  ", " (◕ᴥ◕✿)", " 🙏  "],
    },
    child: {
      happy: [" ▼ ∪∪  ", " (◕ᴥ◕) ", " /|\\~~~  "],
      content: [" ▼ ∪∪  ", " (•ᴥ•) ", " /|\\~~  "],
      neutral: [" ▼ ∪∪  ", " (•_•) ", " /|\\~  "],
      sad: [" ▽ ∪∪  ", " (╥ᴥ╥) ", " /|\\...  "],
      sick: [" ▽ ∪∪  ", " (×ᴥ×) ", " /|\\💫  "],
      hungry: [" ▼ ∪∪  ", " (°ᴥ°) ", " /|\\🦴?  "],
      dirty: [" ▽ ∪∪  ", " (≧ᴥ≦) ", " /|\\💨  "],
      tired: [" ▽ ∪∪  ", " (=ᴥ=) ", " /|\\...  "],
      ecstatic: ["✨▼ ∪∪✨", " (★ᴥ★) ", " \\|/🎉  "],
      idle: [" ▼ ∪∪  ", " (•ᴥ•) ", " /|\\~~  "],
      eating: [" ▼ ∪∪  ", " (ᵔᴥᵔ)🦴", " /|\\nom  "],
      playing: [" 🎾▼∪∪  ", " \\(>ᴥ<)/", "  /\\  "],
      sleeping: [" ▽ ∪∪  ", " (-ᴥ-)  ", " /|\\zZz  "],
      bathing: [" ▼ ∪∪  ", " (≧ᴥ≦) ", "🛁/|\\💦 "],
      celebrating: [" 🎉▼∪∪🎉", " \\(◕ᴥ◕)/", "  /\\  "],
      refusing: [" ▼ ∪∪  ", " (>ᴥ<)/ ", " /|\\❌  "],
      begging: [" ▼ ∪∪  ", " (◕ᴥ◕✿)", " 🙏|\\  "],
    },
    teen: {
      happy: [" 🐕▼∪∪  ", " (◕ᴥ◕)  ", " /|\\~~~~  "],
      content: [" 🐕▼∪∪  ", " (•ᴥ•)  ", " /|\\~~~  "],
      neutral: [" 🐕▼∪∪  ", " (•_•)  ", " /|\\~~  "],
      sad: [" 🐕▽∪∪  ", " (T_T)  ", " /|\\...  "],
      sick: [" 🐕▽∪∪  ", " (×ᴥ×)  ", " /|\\💫  "],
      hungry: [" 🐕▼∪∪  ", " (°ᴥ°)  ", " /|\\🦴?  "],
      dirty: [" 🐕▽∪∪  ", " (>ᴥ<)  ", " /|\\💨💨 "],
      tired: [" 🐕▽∪∪  ", " (=ᴥ=)  ", " /|\\...  "],
      ecstatic: ["✨🐕▼∪∪✨", " (★ᴥ★)  ", " \\|/🎉🎉 "],
      idle: [" 🐕▼∪∪  ", " (•ᴥ•)  ", " /|\\~~~  "],
      eating: [" 🐕▼∪∪  ", " (ᵔᴥᵔ)🥩 ", " /|\\yum  "],
      playing: [" 🐕▼∪∪🎾 ", " \\(>ᴥ<)/ ", "   /\\   "],
      sleeping: [" 🐕▽∪∪  ", " (-ᴥ-)  ", " /|\\zZzZ "],
      bathing: [" 🐕▼∪∪  ", " (≧ᴥ≦)  ", "🧼/|\\💦💦"],
      celebrating: ["🎊🐕▼∪∪🎊", " \\(★ᴥ★)/ ", "   /\\   "],
      refusing: [" 🐕▼∪∪  ", " (¬ᴥ¬)  ", " /|\\✋  "],
      begging: [" 🐕▼∪∪  ", " (◕ᴥ◕✿) ", " 🙏|\\  "],
    },
    adult: {
      happy: [" 🐕🐕▼∪∪ ", "  (◕ᴥ◕)  ", " /||\\~~~~"],
      content: [" 🐕🐕▼∪∪ ", "  (•ᴥ•)  ", " /||\\~~~~"],
      neutral: [" 🐕🐕▼∪∪ ", "  (•_•)  ", " /||\\~~~"],
      sad: [" 🐕🐕▽∪∪ ", "  (T▽T)  ", " /||\\..."],
      sick: [" 🐕🐕▽∪∪ ", "  (×ᴥ×)  ", " /||\\💫💫"],
      hungry: [" 🐕🐕▼∪∪ ", "  (°ᴥ°)  ", " /||\\🦴🦴"],
      dirty: [" 🐕🐕▽∪∪ ", "  (>ᴥ<)  ", " /||\\💨💨"],
      tired: [" 🐕🐕▽∪∪ ", "  (=ᴥ=)  ", " /||\\..."],
      ecstatic: ["✨🐕🐕▼∪∪✨", " \\(★ᴥ★)/ ", " /||\\🎉🎉"],
      idle: [" 🐕🐕▼∪∪ ", "  (•ᴥ•)  ", " /||\\~~~~"],
      eating: [" 🐕🐕▼∪∪ ", " (ᵔᴥᵔ)🥩 ", " /||\\~~~~"],
      playing: [" 🎾🐕🐕▼∪∪", " \\(>ᴥ<)/ ", "   /\\\\   "],
      sleeping: [" 🐕🐕▽∪∪ ", "  (-ᴥ-)  ", " /||\\zZzZ"],
      bathing: [" 🐕🐕▼∪∪ ", "  (≧ᴥ≦)  ", "🛁/||\\💦"],
      celebrating: ["🎊🐕🐕▼∪∪🎊", " \\(★ᴥ★)/ ", "  /||\\  "],
      refusing: [" 🐕🐕▼∪∪ ", "  (¬ᴥ¬)  ", " /||\\🚫 "],
      begging: [" 🐕🐕▼∪∪ ", " (◕ᴥ◕✿) ", " 🙏||\\  "],
    },
  },
  cat: {
    egg: {
      happy: ["  🥚  ", " (◠)  ", "  ~   "],
      content: ["  🥚  ", " (•)  ", "  ~   "],
      neutral: ["  🥚  ", " (-)  ", "  ~   "],
      sad: ["  🥚  ", " (╥)  ", "  ~   "],
      sick: ["  🥚  ", " (×)  ", "  ~   "],
      hungry: ["  🥚  ", " (○)  ", "  ~   "],
      dirty: ["  🥚  ", " (~)  ", " ···  "],
      tired: ["  🥚  ", " (-)  ", " ...  "],
      ecstatic: ["  🥚  ", " (◠◠) ", "  ✨  "],
      idle: ["  🥚  ", " (•)  ", "  ~   "],
      eating: ["  🥚  ", " (ᵔᴥᵔ)", "  ~   "],
      playing: ["  🥚  ", " \\(•)/ ", "  ~   "],
      sleeping: ["  🥚  ", " (-)  ", " zzZ  "],
      bathing: ["  🥚  ", " (≧)  ", " 💦  "],
      celebrating: [" ✨🥚✨ ", " (◠◠) ", "  🎉  "],
      refusing: ["  🥚  ", " (>_<)", "  ×   "],
      begging: ["  🥚  ", " (•ω•)", " 🙏  "],
    },
    baby: {
      happy: [" /\\_/\\ ", "(◕ᴗ◕) ", " /|\\~  "],
      content: [" /\\_/\\ ", "(•ᴗ•) ", " /|\\~  "],
      neutral: [" /\\_/\\ ", "(•_•) ", " /|\\~  "],
      sad: [" /\\_/\\ ", "(╥_╥) ", " /|\\~  "],
      sick: [" /\\_/\\ ", "(×_×) ", " 💫  "],
      hungry: [" /\\_/\\ ", "(°△°) ", " 🐟?  "],
      dirty: [" /\\_/\\ ", "(≧_≦) ", " 💨  "],
      tired: [" /\\_/\\ ", "(-_-) ", " 💤  "],
      ecstatic: ["✨/\\_/\\✨", "(★ω★) ", " 🎉  "],
      idle: [" /\\_/\\ ", "(•ω•) ", " /|\\~  "],
      eating: [" /\\_/\\ ", "(ᵔωᵔ)🐟", " nom  "],
      playing: [" /\\_/\\ ", "\\(>ω<)/", " 🧶  "],
      sleeping: [" /\\_/\\ ", "(-ω-) ", " zZz  "],
      bathing: [" /\\_/\\ ", "(≧ω≦) ", " 🛁💦 "],
      celebrating: ["✨/\\_/\\✨", "\\(◕ω◕)/", " 🎊  "],
      refusing: [" /\\_/\\ ", "(>_<)/ ", " ❌  "],
      begging: [" /\\_/\\ ", "(◕ω◕✿)", " 🙏  "],
    },
    child: {
      happy: [" /\\_/\\  ", " (◕ω◕) ", "  /|\\~~  "],
      content: [" /\\_/\\  ", " (•ω•) ", "  /|\\~  "],
      neutral: [" /\\_/\\  ", " (•_•) ", "  /|\\  "],
      sad: [" /\\_/\\  ", " (╥ω╥) ", "  /|\\  "],
      sick: [" /\\_/\\  ", " (×_×) ", "  💫  "],
      hungry: [" /\\_/\\  ", " (°ω°) ", "  🐟?  "],
      dirty: [" /\\_/\\  ", " (≧ω≦) ", "  💨  "],
      tired: [" /\\_/\\  ", " (=ω=) ", "  ...  "],
      ecstatic: ["✨/\\_/\\✨", " (★ω★) ", " 🎉  "],
      idle: [" /\\_/\\  ", " (•ω•) ", "  /|\\~  "],
      eating: [" /\\_/\\  ", " (ᵔωᵔ)🐟", "  nom  "],
      playing: [" 🧶/\\_/\\", " \\(>ω<)/", "   /\\  "],
      sleeping: [" /\\_/\\  ", " (-ω-)  ", "  zZz  "],
      bathing: [" /\\_/\\  ", " (≧ω≦) ", " 🛁💦  "],
      celebrating: ["🎉/\\_/\\🎉", " \\(◕ω◕)/", "   /\\  "],
      refusing: [" /\\_/\\  ", " (>ω<)/ ", "  ❌  "],
      begging: [" /\\_/\\  ", " (◕ω◕✿)", "  🙏  "],
    },
    teen: {
      happy: [" 🐱/\\_/\\ ", "  (◕ω◕) ", "  /|\\~~~  "],
      content: [" 🐱/\\_/\\ ", "  (•ω•) ", "  /|\\~~  "],
      neutral: [" 🐱/\\_/\\ ", "  (•_•) ", "  /|\\~  "],
      sad: [" 🐱/\\_/\\ ", "  (T_T) ", "  /|\\  "],
      sick: [" 🐱/\\_/\\ ", "  (×_×) ", "  💫💫  "],
      hungry: [" 🐱/\\_/\\ ", "  (°ω°) ", "  🐟?  "],
      dirty: [" 🐱/\\_/\\ ", "  (≧_≦) ", "  💨💨  "],
      tired: [" 🐱/\\_/\\ ", "  (=ω=) ", "  ...  "],
      ecstatic: ["✨🐱/\\_/\\✨", "  (★ω★) ", " 🎉🎉  "],
      idle: [" 🐱/\\_/\\ ", "  (•ω•) ", "  /|\\~~  "],
      eating: [" 🐱/\\_/\\ ", " (ᵔωᵔ)🐟 ", "  yum  "],
      playing: [" 🐱/\\_/\\🧶", " \\(>ω<)/ ", "   /\\   "],
      sleeping: [" 🐱/\\_/\\ ", "  (-ω-) ", "  zZzZ  "],
      bathing: [" 🐱/\\_/\\ ", "  (≧ω≦) ", " 🧼💦💦  "],
      celebrating: ["🎊🐱/\\_/\\🎊", " \\(★ω★)/ ", "   /\\   "],
      refusing: [" 🐱/\\_/\\ ", "  (¬_¬) ", "  ✋  "],
      begging: [" 🐱/\\_/\\ ", " (◕ω◕✿) ", "  🙏  "],
    },
    adult: {
      happy: ["🐱🐱/\\_/\\ ", "  (◕ω◕)  ", " /||\\~~~~"],
      content: ["🐱🐱/\\_/\\ ", "  (•ω•)  ", " /||\\~~~"],
      neutral: ["🐱🐱/\\_/\\ ", "  (•_•)  ", " /||\\~~"],
      sad: ["🐱🐱/\\_/\\ ", "  (T▽T)  ", " /||\\..."],
      sick: ["🐱🐱/\\_/\\ ", "  (×_×)  ", " /||\\💫💫"],
      hungry: ["🐱🐱/\\_/\\ ", "  (°ω°)  ", " /||\\🐟🐟"],
      dirty: ["🐱🐱/\\_/\\ ", "  (≧_≦)  ", " /||\\💨💨"],
      tired: ["🐱🐱/\\_/\\ ", "  (=ω=)  ", " /||\\..."],
      ecstatic: ["✨🐱🐱/\\_/\\✨", " \\(★ω★)/ ", " /||\\🎉🎉"],
      idle: ["🐱🐱/\\_/\\ ", "  (•ω•)  ", " /||\\~~~~"],
      eating: ["🐱🐱/\\_/\\ ", " (ᵔωᵔ)🐟 ", " /||\\~~~~"],
      playing: ["🧶🐱🐱/\\_/\\", " \\(>ω<)/ ", "   /\\\\   "],
      sleeping: ["🐱🐱/\\_/\\ ", "  (-ω-)  ", " /||\\zZzZ"],
      bathing: ["🐱🐱/\\_/\\ ", "  (≧ω≦)  ", "🛁/||\\💦"],
      celebrating: ["🎊🐱🐱/\\_/\\🎊", " \\(★ω★)/ ", "  /||\\  "],
      refusing: ["🐱🐱/\\_/\\ ", "  (¬_¬)  ", " /||\\🚫 "],
      begging: ["🐱🐱/\\_/\\ ", " (◕ω◕✿) ", " 🙏||\\  "],
    },
  },
}

// Pet reactions based on personality (enhanced)
const petReactions: Record<PetPersonality, {
  greetings: string[];
  reactions: string[];
  sleeping: string[];
  hungry: string[];
  happy: string[];
  sad: string[];
  playing: string[];
  eating: string[];
  cleaning: string[];
  sick: string[];
}> = {
  loyal: {
    greetings: ["I missed you!", "You're back! Yay!", "Always here for you!", "I waited for you!"],
    reactions: ["*wags tail excitedly*", "*follows you around*", "*looks at you adoringly*", "*stays close*"],
    sleeping: ["*sleeping by your side*", "*guarding while napping*", "*dreaming of you*"],
    hungry: ["*looks at food bowl hopefully*", "*nudges your hand*", "I'm getting hungry..."],
    happy: ["*loyal eyes sparkle*", "*stays close and happy*", "Being with you is the best!"],
    sad: ["*whimpers quietly*", "*looks at you with sad eyes*", "I missed you so much..."],
    playing: ["*brings favorite toy*", "*plays fetch eagerly*", "Let's play together forever!"],
    eating: ["*eats gratefully*", "Thank you for feeding me!", "*happy tail wag*"],
    cleaning: ["*enjoys being groomed*", "I love when you take care of me!", "*happy sighs*"],
    sick: ["*stays close despite feeling bad*", "*looks at you trustingly*", "I know you'll help me..."],
  },
  playful: {
    greetings: ["Let's have fun!", "Playtime?!", "Finally! Let's go!", "Yay you're here!"],
    reactions: ["*bounces around*", "*does a little dance*", "*brings you a toy*", "*spins in circles*"],
    sleeping: ["*dreaming of treats*", "*twitching paws while sleeping*", "*sleep-playing*"],
    hungry: ["*bounces to food bowl*", "Food food food!", "*excited about mealtime*"],
    happy: ["*does happy zoomies*", "*jumps with joy*", "BEST. DAY. EVER!"],
    sad: ["*sad puppy eyes*", "No playtime...?", "*droops a little*"],
    playing: ["*ZOOMS everywhere*", "This is SO fun!", "*can't contain excitement*"],
    eating: ["*gobbles food happily*", "Yummy yummy!", "*food dance*"],
    cleaning: ["*makes it a game*", "Splash splash!", "*playful during bath*"],
    sick: ["*tries to play anyway*", "Can we still have fun...?", "*hopeful despite sick*"],
  },
  lazy: {
    greetings: ["Oh, you're here...", "*yawns* Hi...", "Five more minutes...", "...hey"],
    reactions: ["*stretches slowly*", "*barely opens one eye*", "*rolls over*", "*lazy tail flick*"],
    sleeping: ["*snoring peacefully*", "*absolutely knocked out*", "*best sleep ever*"],
    hungry: ["*lazy glance at food*", "Food...? Maybe...", "*reluctantly gets up*"],
    happy: ["*content sigh*", "This is... nice...", "*lazy happiness*"],
    sad: ["*doesn't even move*", "...meh", "*too lazy to be sad*"],
    playing: ["*half-hearted play*", "This is... tiring...", "*minimal effort*"],
    eating: ["*slow munching*", "*eats lying down*", "Food is good... zzz"],
    cleaning: ["*tolerates bath*", "Just... make it quick...", "*falls asleep in bath*"],
    sick: ["*extra sleepy*", "Just wanna sleep...", "*doesn't notice being sick*"],
  },
  curious: {
    greetings: ["What are we doing today?", "Ooh, what's that?!", "Tell me everything!", "What's new?!"],
    reactions: ["*sniffs around curiously*", "*tilts head*", "*investigates closely*", "*perks ears up*"],
    sleeping: ["*dreams of adventures*", "*mumbles in sleep*", "*exploring dreamland*"],
    hungry: ["*inspects food carefully*", "What's this dish?", "*sniffs everything*"],
    happy: ["*eyes wide with wonder*", "Everything is amazing!", "*discovering new things*"],
    sad: ["*lost interest*", "Nothing interesting...", "*curious about being sad*"],
    playing: ["*explores every corner*", "What does THIS do?!", "*investigates toys*"],
    eating: ["*examines food*", "Interesting flavors!", "*food scientist mode*"],
    cleaning: ["*fascinated by bubbles*", "Ooh, what's that smell?", "*curious about bath*"],
    sick: ["*investigating symptoms*", "Why do I feel weird?", "*curious about medicine*"],
  },
  calm: {
    greetings: ["Hello, friend.", "Welcome back.", "Peace be with you.", "Good to see you."],
    reactions: ["*nods approvingly*", "*sits quietly beside you*", "*purrs softly*", "*gentle gaze*"],
    sleeping: ["*meditating... or sleeping*", "*zen-like slumber*", "*peaceful rest*"],
    hungry: ["*patient waiting*", "When you're ready...", "*calm about hunger*"],
    happy: ["*serene contentment*", "*peaceful smile*", "All is well."],
    sad: ["*quiet contemplation*", "*finds inner peace*", "This too shall pass."],
    playing: ["*gentle play*", "*mindful movements*", "Peaceful fun."],
    eating: ["*mindful eating*", "*savors each bite*", "*grateful for food*"],
    cleaning: ["*enjoys spa time*", "*relaxing bath*", "*zen cleanliness*"],
    sick: ["*accepts it calmly*", "*resting mindfully*", "I shall heal."],
  },
  energetic: {
    greetings: ["LET'S GOOOO!", "SO EXCITED!", "BEST DAY EVER!", "I'M SO HAPPY!"],
    reactions: ["*ZOOMS around*", "*can't sit still*", "*vibrating with energy*", "*MAXIMUM EXCITEMENT*"],
    sleeping: ["*finally crashed*", "*recharging for more energy*", "*dreaming of running*"],
    hungry: ["*BOUNCES to food*", "FOOD TIME FOOD TIME!", "*can't wait can't wait*"],
    happy: ["*EXPLOSIVE JOY*", "*runs in circles*", "EVERYTHING IS AWESOME!"],
    sad: ["*dramatic sadness*", "*still energetic but sad*", "Why is life SO SAD?!"],
    playing: ["*ULTRA PLAY MODE*", "*literally can't stop*", "MOOOORE!"],
    eating: ["*inhales food*", "*eating SO fast*", "MORE MORE MORE!"],
    cleaning: ["*splashes EVERYWHERE*", "*bath time PARTY*", "*so much energy even wet*"],
    sick: ["*still trying to zoom*", "*can't slow down even sick*", "I'M FINE I'M FINE!"],
  },
}

const petEmojis: Record<PetType, { happy: string; sleeping: string; excited: string; default: string; sad: string; sick: string; hungry: string }> = {
  chameleon: { happy: "🦎", sleeping: "😴🦎", excited: "✨🦎✨", default: "🦎", sad: "😢🦎", sick: "🤒🦎", hungry: "😋🦎" },
  dog: { happy: "🐕", sleeping: "😴🐕", excited: "🐕‍🦺✨", default: "🐶", sad: "🥺🐕", sick: "🤒🐕", hungry: "🦴🐕" },
  cat: { happy: "😺", sleeping: "😸💤", excited: "😻✨", default: "🐱", sad: "😿", sick: "🤒🐱", hungry: "🐟🐱" },
}

// Food items for each pet type
export const petFoods: Record<PetType, { id: string; name: { en: string; de: string }; emoji: string; hungerRestore: number; happinessBonus: number }[]> = {
  chameleon: [
    { id: "cricket", name: { en: "Cricket", de: "Grille" }, emoji: "🦗", hungerRestore: 20, happinessBonus: 5 },
    { id: "fly", name: { en: "Fly", de: "Fliege" }, emoji: "🪰", hungerRestore: 15, happinessBonus: 3 },
    { id: "worm", name: { en: "Worm", de: "Wurm" }, emoji: "🪱", hungerRestore: 25, happinessBonus: 8 },
    { id: "fruit", name: { en: "Fruit", de: "Obst" }, emoji: "🍇", hungerRestore: 30, happinessBonus: 10 },
  ],
  dog: [
    { id: "kibble", name: { en: "Kibble", de: "Trockenfutter" }, emoji: "🥣", hungerRestore: 20, happinessBonus: 5 },
    { id: "bone", name: { en: "Bone", de: "Knochen" }, emoji: "🦴", hungerRestore: 15, happinessBonus: 8 },
    { id: "meat", name: { en: "Meat", de: "Fleisch" }, emoji: "🥩", hungerRestore: 30, happinessBonus: 10 },
    { id: "treat", name: { en: "Treat", de: "Leckerli" }, emoji: "🍖", hungerRestore: 25, happinessBonus: 15 },
  ],
  cat: [
    { id: "catfood", name: { en: "Cat Food", de: "Katzenfutter" }, emoji: "🥫", hungerRestore: 20, happinessBonus: 5 },
    { id: "fish", name: { en: "Fish", de: "Fisch" }, emoji: "🐟", hungerRestore: 25, happinessBonus: 10 },
    { id: "tuna", name: { en: "Tuna", de: "Thunfisch" }, emoji: "🐠", hungerRestore: 30, happinessBonus: 12 },
    { id: "milk", name: { en: "Milk", de: "Milch" }, emoji: "🥛", hungerRestore: 15, happinessBonus: 8 },
  ],
}

// Toys/activities for each pet type
export const petToys: Record<PetType, { id: string; name: { en: string; de: string }; emoji: string; happinessBonus: number; energyCost: number }[]> = {
  chameleon: [
    { id: "branch", name: { en: "Climbing Branch", de: "Kletterast" }, emoji: "🌿", happinessBonus: 15, energyCost: 10 },
    { id: "heat_lamp", name: { en: "Heat Lamp", de: "Wärmelampe" }, emoji: "☀️", happinessBonus: 20, energyCost: 5 },
    { id: "mirror", name: { en: "Mirror", de: "Spiegel" }, emoji: "🪞", happinessBonus: 25, energyCost: 15 },
    { id: "hide", name: { en: "Hide & Seek", de: "Verstecken" }, emoji: "🍃", happinessBonus: 30, energyCost: 20 },
  ],
  dog: [
    { id: "ball", name: { en: "Ball", de: "Ball" }, emoji: "🎾", happinessBonus: 20, energyCost: 15 },
    { id: "frisbee", name: { en: "Frisbee", de: "Frisbee" }, emoji: "🥏", happinessBonus: 25, energyCost: 20 },
    { id: "rope", name: { en: "Tug Rope", de: "Zugseil" }, emoji: "🪢", happinessBonus: 20, energyCost: 15 },
    { id: "walk", name: { en: "Go for Walk", de: "Spaziergang" }, emoji: "🚶", happinessBonus: 35, energyCost: 25 },
  ],
  cat: [
    { id: "yarn", name: { en: "Yarn Ball", de: "Wollknäuel" }, emoji: "🧶", happinessBonus: 20, energyCost: 10 },
    { id: "laser", name: { en: "Laser Pointer", de: "Laserpointer" }, emoji: "🔴", happinessBonus: 30, energyCost: 20 },
    { id: "feather", name: { en: "Feather Toy", de: "Federspielzeug" }, emoji: "🪶", happinessBonus: 25, energyCost: 15 },
    { id: "box", name: { en: "Cardboard Box", de: "Karton" }, emoji: "📦", happinessBonus: 35, energyCost: 5 },
  ],
}

export const petService = {
  getPet(): Pet | null {
    if (typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem(PET_STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored)

      // Migration: Handle old pet format (pre-Tamagotchi)
      if (!parsed.stats) {
        const migratedPet: Pet = {
          type: parsed.type,
          name: parsed.name,
          personality: parsed.personality,
          createdAt: parsed.createdAt,
          lastInteraction: parsed.lastInteraction || Date.now(),
          stats: {
            hunger: 100,
            happiness: parsed.happiness || 100,
            energy: 100,
            hygiene: 100,
            health: 100,
          },
          lifeStage: "baby", // Start as baby since they had a pet already
          age: (Date.now() - parsed.createdAt) / (1000 * 60 * 60),
          experience: 0,
          lastStatUpdate: Date.now(),
          isSleeping: false,
          lastFed: Date.now(),
          lastPlayed: Date.now(),
          lastCleaned: Date.now(),
          evolutionHistory: ["egg", "baby"],
          careScore: 80,
          neglectCount: 0,
        }
        // Save the migrated pet
        this.savePet(migratedPet)
        return migratedPet
      }

      return parsed as Pet
    } catch {
      return null
    }
  },

  savePet(pet: Pet): void {
    if (typeof window === "undefined") return
    localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(pet))
  },

  createPet(type: PetType, name: string, personality: PetPersonality): Pet {
    const pet: Pet = {
      type,
      name,
      personality,
      createdAt: Date.now(),
      lastInteraction: Date.now(),
      stats: {
        hunger: 100,
        happiness: 100,
        energy: 100,
        hygiene: 100,
        health: 100,
      },
      lifeStage: "egg",
      age: 0,
      experience: 0,
      lastStatUpdate: Date.now(),
      isSleeping: false,
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      lastCleaned: Date.now(),
      evolutionHistory: ["egg"],
      careScore: 100,
      neglectCount: 0,
    }
    this.savePet(pet)
    return pet
  },

  deletePet(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(PET_STORAGE_KEY)
  },

  // Update stats based on time passed (decay system)
  updateStats(pet: Pet): Pet {
    const now = Date.now()
    const hoursPassed = (now - pet.lastStatUpdate) / (1000 * 60 * 60)

    if (hoursPassed < 0.01) return pet // Less than ~36 seconds, skip update

    const updated = { ...pet }

    // Calculate new age
    updated.age = (now - pet.createdAt) / (1000 * 60 * 60)

    // Decay stats based on time (if not sleeping, decay is slower)
    const decayMultiplier = updated.isSleeping ? 0.3 : 1

    updated.stats = {
      hunger: Math.max(0, pet.stats.hunger - (STAT_DECAY_RATES.hunger * hoursPassed * decayMultiplier)),
      happiness: Math.max(0, pet.stats.happiness - (STAT_DECAY_RATES.happiness * hoursPassed * decayMultiplier)),
      energy: updated.isSleeping
        ? Math.min(100, pet.stats.energy + (15 * hoursPassed)) // Recover energy while sleeping
        : Math.max(0, pet.stats.energy - (STAT_DECAY_RATES.energy * hoursPassed)),
      hygiene: Math.max(0, pet.stats.hygiene - (STAT_DECAY_RATES.hygiene * hoursPassed * decayMultiplier)),
      health: pet.stats.health, // Health calculated separately
    }

    // Health decays if other stats are critically low
    const criticalStats = [updated.stats.hunger, updated.stats.happiness, updated.stats.hygiene].filter(s => s < 20).length
    if (criticalStats > 0) {
      updated.stats.health = Math.max(0, pet.stats.health - (criticalStats * 2 * hoursPassed))
      updated.neglectCount += 1
      updated.careScore = Math.max(0, updated.careScore - 5)
    } else if (updated.stats.hunger > 50 && updated.stats.happiness > 50) {
      // Health recovers slowly when pet is well cared for
      updated.stats.health = Math.min(100, pet.stats.health + (0.5 * hoursPassed))
      updated.careScore = Math.min(100, updated.careScore + 1)
    }

    // Auto wake up if energy is full
    if (updated.isSleeping && updated.stats.energy >= 100) {
      updated.isSleeping = false
    }

    // Check for life stage evolution
    updated.lifeStage = this.calculateLifeStage(updated)
    if (updated.lifeStage !== pet.lifeStage && !updated.evolutionHistory.includes(updated.lifeStage)) {
      updated.evolutionHistory.push(updated.lifeStage)
      updated.experience += 50 // Bonus XP for evolution
    }

    updated.lastStatUpdate = now
    updated.lastInteraction = now

    this.savePet(updated)
    return updated
  },

  calculateLifeStage(pet: Pet): PetLifeStage {
    const age = pet.age
    if (age >= LIFE_STAGE_THRESHOLDS.adult) return "adult"
    if (age >= LIFE_STAGE_THRESHOLDS.teen) return "teen"
    if (age >= LIFE_STAGE_THRESHOLDS.child) return "child"
    if (age >= LIFE_STAGE_THRESHOLDS.baby) return "baby"
    return "egg"
  },

  // Pet care actions
  feed(pet: Pet, foodId: string): { pet: Pet; message: PetMessage } {
    const foods = petFoods[pet.type]
    const food = foods.find(f => f.id === foodId) || foods[0]

    const updated = this.updateStats(pet)

    // Can't feed if sleeping
    if (updated.isSleeping) {
      return {
        pet: updated,
        message: {
          text: petReactions[pet.personality].sleeping[0],
          emoji: petEmojis[pet.type].sleeping,
          animation: "pulse"
        }
      }
    }

    // Can't feed if already full
    if (updated.stats.hunger > 95) {
      return {
        pet: updated,
        message: {
          text: "I'm already full!",
          emoji: petEmojis[pet.type].happy,
          animation: "shake"
        }
      }
    }

    updated.stats.hunger = Math.min(100, updated.stats.hunger + food.hungerRestore)
    updated.stats.happiness = Math.min(100, updated.stats.happiness + food.happinessBonus)
    updated.lastFed = Date.now()
    updated.experience += 5

    this.savePet(updated)

    return {
      pet: updated,
      message: {
        text: petReactions[pet.personality].eating[Math.floor(Math.random() * petReactions[pet.personality].eating.length)],
        emoji: food.emoji,
        animation: "bounce"
      }
    }
  },

  play(pet: Pet, toyId: string): { pet: Pet; message: PetMessage } {
    const toys = petToys[pet.type]
    const toy = toys.find(t => t.id === toyId) || toys[0]

    const updated = this.updateStats(pet)

    // Can't play if sleeping
    if (updated.isSleeping) {
      return {
        pet: updated,
        message: {
          text: petReactions[pet.personality].sleeping[0],
          emoji: petEmojis[pet.type].sleeping,
          animation: "pulse"
        }
      }
    }

    // Can't play if too tired
    if (updated.stats.energy < toy.energyCost) {
      return {
        pet: updated,
        message: {
          text: "I'm too tired to play...",
          emoji: petEmojis[pet.type].sad,
          animation: "shake"
        }
      }
    }

    updated.stats.happiness = Math.min(100, updated.stats.happiness + toy.happinessBonus)
    updated.stats.energy = Math.max(0, updated.stats.energy - toy.energyCost)
    updated.lastPlayed = Date.now()
    updated.experience += 10

    this.savePet(updated)

    return {
      pet: updated,
      message: {
        text: petReactions[pet.personality].playing[Math.floor(Math.random() * petReactions[pet.personality].playing.length)],
        emoji: toy.emoji,
        animation: "dance"
      }
    }
  },

  clean(pet: Pet): { pet: Pet; message: PetMessage } {
    const updated = this.updateStats(pet)

    // Wake up if sleeping for cleaning
    if (updated.isSleeping) {
      updated.isSleeping = false
    }

    updated.stats.hygiene = 100
    updated.stats.happiness = Math.min(100, updated.stats.happiness + 10)
    updated.lastCleaned = Date.now()
    updated.experience += 5

    this.savePet(updated)

    return {
      pet: updated,
      message: {
        text: petReactions[pet.personality].cleaning[Math.floor(Math.random() * petReactions[pet.personality].cleaning.length)],
        emoji: "🛁",
        animation: "wiggle"
      }
    }
  },

  sleep(pet: Pet): { pet: Pet; message: PetMessage } {
    const updated = this.updateStats(pet)

    if (updated.stats.energy > 80) {
      return {
        pet: updated,
        message: {
          text: "I'm not sleepy yet!",
          emoji: petEmojis[pet.type].happy,
          animation: "shake"
        }
      }
    }

    updated.isSleeping = true

    this.savePet(updated)

    return {
      pet: updated,
      message: {
        text: petReactions[pet.personality].sleeping[Math.floor(Math.random() * petReactions[pet.personality].sleeping.length)],
        emoji: petEmojis[pet.type].sleeping,
        animation: "pulse"
      }
    }
  },

  wake(pet: Pet): { pet: Pet; message: PetMessage } {
    const updated = this.updateStats(pet)

    if (!updated.isSleeping) {
      return {
        pet: updated,
        message: {
          text: "I'm already awake!",
          emoji: petEmojis[pet.type].happy,
          animation: "bounce"
        }
      }
    }

    updated.isSleeping = false

    this.savePet(updated)

    return {
      pet: updated,
      message: {
        text: petReactions[pet.personality].greetings[Math.floor(Math.random() * petReactions[pet.personality].greetings.length)],
        emoji: petEmojis[pet.type].excited,
        animation: "bounce"
      }
    }
  },

  heal(pet: Pet): { pet: Pet; message: PetMessage } {
    const updated = this.updateStats(pet)

    if (updated.stats.health > 80) {
      return {
        pet: updated,
        message: {
          text: "I'm feeling healthy!",
          emoji: petEmojis[pet.type].happy,
          animation: "bounce"
        }
      }
    }

    updated.stats.health = Math.min(100, updated.stats.health + 30)
    updated.experience += 5

    this.savePet(updated)

    return {
      pet: updated,
      message: {
        text: "Medicine helps! Thank you!",
        emoji: "💊",
        animation: "wiggle"
      }
    }
  },

  // Get current mood based on stats
  getMood(pet: Pet): PetMood {
    if (pet.isSleeping) return "sleeping"
    if (pet.stats.health < 30) return "sick"
    if (pet.stats.hunger < 20) return "hungry"
    if (pet.stats.hygiene < 20) return "dirty"
    if (pet.stats.energy < 20) return "tired"
    if (pet.stats.happiness < 30) return "sad"
    if (pet.stats.happiness > 90 && pet.stats.hunger > 80 && pet.stats.energy > 80) return "ecstatic"
    if (pet.stats.happiness > 70) return "happy"
    if (pet.stats.happiness > 40) return "content"
    return "neutral"
  },

  // Get sprite for current state
  getSprite(pet: Pet, action?: PetAction): string[] {
    const mood = action || this.getMood(pet)
    const sprites = petSprites[pet.type][pet.lifeStage]
    return sprites[mood] || sprites.idle
  },

  interact(pet: Pet): Pet {
    const updated = this.updateStats(pet)
    updated.stats.happiness = Math.min(100, updated.stats.happiness + 5)
    updated.experience += 1
    this.savePet(updated)
    return updated
  },

  getGreeting(pet: Pet): PetMessage {
    const hoursSinceInteraction = (Date.now() - pet.lastInteraction) / (1000 * 60 * 60)
    const reactions = petReactions[pet.personality]
    const emojis = petEmojis[pet.type]
    const mood = this.getMood(pet)

    if (pet.isSleeping) {
      return {
        text: reactions.sleeping[Math.floor(Math.random() * reactions.sleeping.length)],
        emoji: emojis.sleeping,
        animation: "pulse",
      }
    }

    if (pet.stats.health < 30) {
      return {
        text: reactions.sick[Math.floor(Math.random() * reactions.sick.length)],
        emoji: emojis.sick,
        animation: "shake",
      }
    }

    if (pet.stats.hunger < 30) {
      return {
        text: reactions.hungry[Math.floor(Math.random() * reactions.hungry.length)],
        emoji: emojis.hungry,
        animation: "shake",
      }
    }

    if (hoursSinceInteraction > 8) {
      return {
        text: reactions.greetings[Math.floor(Math.random() * reactions.greetings.length)],
        emoji: emojis.excited,
        animation: "bounce",
      }
    } else if (hoursSinceInteraction > 1) {
      return {
        text: reactions.greetings[Math.floor(Math.random() * reactions.greetings.length)],
        emoji: emojis.excited,
        animation: "bounce",
      }
    } else {
      return {
        text: reactions.reactions[Math.floor(Math.random() * reactions.reactions.length)],
        emoji: emojis.happy,
        animation: "wiggle",
      }
    }
  },

  getEmoji(pet: Pet): string {
    const mood = this.getMood(pet)
    const emojis = petEmojis[pet.type]

    switch (mood) {
      case "sleeping": return emojis.sleeping
      case "sick": return emojis.sick
      case "hungry": return emojis.hungry
      case "sad": return emojis.sad
      case "ecstatic":
      case "happy": return emojis.excited
      default: return emojis.default
    }
  },

  // Get age display string
  getAgeDisplay(pet: Pet, lang: "en" | "de" = "en"): string {
    const hours = pet.age
    if (hours < 1) {
      const minutes = Math.floor(hours * 60)
      return lang === "de" ? `${minutes} Min.` : `${minutes} min`
    }
    if (hours < 24) {
      return lang === "de" ? `${Math.floor(hours)} Std.` : `${Math.floor(hours)} hrs`
    }
    const days = Math.floor(hours / 24)
    return lang === "de" ? `${days} Tag${days > 1 ? 'e' : ''}` : `${days} day${days > 1 ? 's' : ''}`
  },

  // Get life stage display
  getLifeStageDisplay(stage: PetLifeStage, lang: "en" | "de" = "en"): string {
    const stages = {
      egg: { en: "Egg", de: "Ei" },
      baby: { en: "Baby", de: "Baby" },
      child: { en: "Child", de: "Kind" },
      teen: { en: "Teen", de: "Teenager" },
      adult: { en: "Adult", de: "Erwachsen" },
    }
    return stages[stage][lang]
  },

  // Check if pet needs attention
  needsAttention(pet: Pet): { needs: boolean; urgent: boolean; reasons: string[] } {
    const reasons: string[] = []
    let urgent = false

    if (pet.stats.hunger < 30) {
      reasons.push("hungry")
      if (pet.stats.hunger < 15) urgent = true
    }
    if (pet.stats.happiness < 30) {
      reasons.push("sad")
      if (pet.stats.happiness < 15) urgent = true
    }
    if (pet.stats.energy < 20) {
      reasons.push("tired")
    }
    if (pet.stats.hygiene < 30) {
      reasons.push("dirty")
    }
    if (pet.stats.health < 50) {
      reasons.push("sick")
      if (pet.stats.health < 25) urgent = true
    }

    return { needs: reasons.length > 0, urgent, reasons }
  },

  // ==================== LLM INTEGRATION FEATURES ====================

  // React to user's chat message - returns a pet reaction if appropriate
  reactToMessage(pet: Pet, message: string): PetMessage | null {
    const lowerMsg = message.toLowerCase()
    const reactions = petReactions[pet.personality]
    const emojis = petEmojis[pet.type]

    // Don't react if sleeping (unless message mentions waking up)
    if (pet.isSleeping && !lowerMsg.includes("wake") && !lowerMsg.includes("morning")) {
      return null
    }

    // Detect message sentiment/content and react accordingly
    // Happy/positive messages
    if (lowerMsg.match(/thank|awesome|great|love|happy|excited|yay|wonderful|amazing|perfect/)) {
      pet.stats.happiness = Math.min(100, pet.stats.happiness + 3)
      this.savePet(pet)
      return {
        text: reactions.happy[Math.floor(Math.random() * reactions.happy.length)],
        emoji: emojis.excited,
        animation: "bounce"
      }
    }

    // Questions - curious pets react more
    if (lowerMsg.match(/\?|what|how|why|when|where|who|can you|could you|tell me/)) {
      if (pet.personality === "curious") {
        return {
          text: reactions.reactions[Math.floor(Math.random() * reactions.reactions.length)],
          emoji: emojis.happy,
          animation: "wiggle"
        }
      }
    }

    // Sad/frustrated messages
    if (lowerMsg.match(/sad|upset|angry|frustrated|hate|annoyed|tired|stressed|worried/)) {
      return {
        text: reactions.sad[Math.floor(Math.random() * reactions.sad.length)],
        emoji: emojis.sad,
        animation: "shake"
      }
    }

    // Food-related messages
    if (lowerMsg.match(/food|eat|hungry|lunch|dinner|breakfast|cook|recipe|meal/)) {
      if (pet.stats.hunger < 50) {
        return {
          text: reactions.hungry[Math.floor(Math.random() * reactions.hungry.length)],
          emoji: emojis.hungry,
          animation: "wiggle"
        }
      }
    }

    // Sleep/rest messages
    if (lowerMsg.match(/tired|sleep|rest|night|bed|exhausted|nap/)) {
      return {
        text: reactions.sleeping[Math.floor(Math.random() * reactions.sleeping.length)],
        emoji: emojis.sleeping,
        animation: "pulse"
      }
    }

    // Play/fun messages
    if (lowerMsg.match(/play|game|fun|joke|laugh|silly|entertain/)) {
      if (pet.personality === "playful" || pet.personality === "energetic") {
        return {
          text: reactions.playing[Math.floor(Math.random() * reactions.playing.length)],
          emoji: emojis.excited,
          animation: "dance"
        }
      }
    }

    // Random small chance to react to any message (10%)
    if (Math.random() < 0.1) {
      return {
        text: reactions.reactions[Math.floor(Math.random() * reactions.reactions.length)],
        emoji: emojis.happy,
        animation: "wiggle"
      }
    }

    return null
  },

  // Get conversation suggestions based on pet personality
  getConversationSuggestions(pet: Pet, lang: "en" | "de" = "en"): { text: string; prompt: string }[] {
    const personalitySuggestions: Record<PetPersonality, { en: { text: string; prompt: string }[]; de: { text: string; prompt: string }[] }> = {
      loyal: {
        en: [
          { text: "💙 How can I be more supportive?", prompt: "How can I be more supportive to my friends and family?" },
          { text: "🤝 Tips for building trust", prompt: "What are some tips for building trust in relationships?" },
          { text: "💪 Stay motivated together", prompt: "How can I stay motivated and help others stay motivated too?" },
        ],
        de: [
          { text: "💙 Wie kann ich unterstützender sein?", prompt: "Wie kann ich meine Freunde und Familie besser unterstützen?" },
          { text: "🤝 Tipps für Vertrauensaufbau", prompt: "Welche Tipps gibt es zum Aufbau von Vertrauen in Beziehungen?" },
          { text: "💪 Gemeinsam motiviert bleiben", prompt: "Wie kann ich motiviert bleiben und anderen helfen, motiviert zu bleiben?" },
        ],
      },
      playful: {
        en: [
          { text: "😂 Tell me a joke!", prompt: "Tell me a funny, clever joke!" },
          { text: "🎮 Fun game ideas", prompt: "What are some fun games or activities I can do?" },
          { text: "🎉 Plan something fun", prompt: "Help me plan something fun and exciting to do this weekend!" },
        ],
        de: [
          { text: "😂 Erzähl mir einen Witz!", prompt: "Erzähl mir einen lustigen, cleveren Witz!" },
          { text: "🎮 Lustige Spielideen", prompt: "Welche lustigen Spiele oder Aktivitäten kann ich machen?" },
          { text: "🎉 Plane etwas Lustiges", prompt: "Hilf mir, etwas Lustiges und Aufregendes fürs Wochenende zu planen!" },
        ],
      },
      lazy: {
        en: [
          { text: "😴 Relaxation tips", prompt: "What are some good relaxation techniques?" },
          { text: "🛋️ Cozy movie recommendations", prompt: "Recommend some cozy movies to watch while relaxing." },
          { text: "☕ Simple comfort food", prompt: "What's a simple, comforting recipe I can make with minimal effort?" },
        ],
        de: [
          { text: "😴 Entspannungstipps", prompt: "Welche guten Entspannungstechniken gibt es?" },
          { text: "🛋️ Gemütliche Filmempfehlungen", prompt: "Empfiehl mir einige gemütliche Filme zum Entspannen." },
          { text: "☕ Einfaches Comfort Food", prompt: "Was ist ein einfaches, gemütliches Rezept mit minimalem Aufwand?" },
        ],
      },
      curious: {
        en: [
          { text: "🧠 Teach me something new", prompt: "Teach me an interesting fact I probably don't know!" },
          { text: "🔬 How does this work?", prompt: "Explain how something everyday works in an interesting way." },
          { text: "🌍 Explore a random topic", prompt: "Tell me about a fascinating but obscure topic!" },
        ],
        de: [
          { text: "🧠 Lehr mich etwas Neues", prompt: "Erzähl mir einen interessanten Fakt, den ich wahrscheinlich nicht kenne!" },
          { text: "🔬 Wie funktioniert das?", prompt: "Erkläre mir auf interessante Weise, wie etwas Alltägliches funktioniert." },
          { text: "🌍 Erkunde ein zufälliges Thema", prompt: "Erzähl mir von einem faszinierenden aber unbekannten Thema!" },
        ],
      },
      calm: {
        en: [
          { text: "🧘 Mindfulness exercise", prompt: "Guide me through a short mindfulness or meditation exercise." },
          { text: "🌸 Find inner peace", prompt: "Share some wisdom about finding inner peace and balance." },
          { text: "📝 Gratitude practice", prompt: "Help me practice gratitude. What should I reflect on today?" },
        ],
        de: [
          { text: "🧘 Achtsamkeitsübung", prompt: "Führe mich durch eine kurze Achtsamkeits- oder Meditationsübung." },
          { text: "🌸 Inneren Frieden finden", prompt: "Teile etwas Weisheit über inneren Frieden und Balance." },
          { text: "📝 Dankbarkeitspraxis", prompt: "Hilf mir, Dankbarkeit zu üben. Worüber sollte ich heute nachdenken?" },
        ],
      },
      energetic: {
        en: [
          { text: "⚡ Quick energy boost", prompt: "Give me a quick motivation boost to get energized!" },
          { text: "🏃 Fun workout ideas", prompt: "What are some fun, high-energy exercises or activities?" },
          { text: "🎯 Challenge me!", prompt: "Give me a fun challenge to do right now!" },
        ],
        de: [
          { text: "⚡ Schneller Energieschub", prompt: "Gib mir einen schnellen Motivationsschub für mehr Energie!" },
          { text: "🏃 Lustige Workout-Ideen", prompt: "Welche lustigen, energiereichen Übungen oder Aktivitäten gibt es?" },
          { text: "🎯 Fordere mich heraus!", prompt: "Gib mir eine lustige Herausforderung für jetzt!" },
        ],
      },
    }

    return personalitySuggestions[pet.personality][lang]
  },

  // Generate a system prompt addition for the LLM to incorporate pet personality
  getPetSystemPrompt(pet: Pet, lang: "en" | "de" = "en"): string | null {
    if (!pet) return null

    const petDescriptions: Record<PetPersonality, { en: string; de: string }> = {
      loyal: {
        en: `The user has a loyal pet companion named ${pet.name}. Occasionally acknowledge this bond - be supportive and reliable in your responses.`,
        de: `Der Benutzer hat einen treuen Haustierbegleiter namens ${pet.name}. Erkenne diese Bindung gelegentlich an - sei unterstützend und zuverlässig in deinen Antworten.`,
      },
      playful: {
        en: `The user has a playful pet companion named ${pet.name}. Feel free to be a bit more fun, light-hearted, and include occasional humor.`,
        de: `Der Benutzer hat einen verspielten Haustierbegleiter namens ${pet.name}. Sei ruhig etwas lustiger, unbeschwert und füge gelegentlich Humor hinzu.`,
      },
      lazy: {
        en: `The user has a relaxed pet companion named ${pet.name}. Keep responses chill and don't overcomplicate things.`,
        de: `Der Benutzer hat einen entspannten Haustierbegleiter namens ${pet.name}. Halte Antworten locker und überkompliziere nichts.`,
      },
      curious: {
        en: `The user has a curious pet companion named ${pet.name}. Feel free to dive deeper into topics and share interesting details.`,
        de: `Der Benutzer hat einen neugierigen Haustierbegleiter namens ${pet.name}. Gehe ruhig tiefer in Themen und teile interessante Details.`,
      },
      calm: {
        en: `The user has a calm pet companion named ${pet.name}. Maintain a peaceful, balanced tone in responses.`,
        de: `Der Benutzer hat einen ruhigen Haustierbegleiter namens ${pet.name}. Halte einen friedlichen, ausgewogenen Ton in Antworten.`,
      },
      energetic: {
        en: `The user has an energetic pet companion named ${pet.name}. Bring enthusiasm and positive energy to responses!`,
        de: `Der Benutzer hat einen energiegeladenen Haustierbegleiter namens ${pet.name}. Bringe Enthusiasmus und positive Energie in Antworten!`,
      },
    }

    return petDescriptions[pet.personality][lang]
  },

  // Generate a prompt to chat directly with the pet
  getChatWithPetPrompt(pet: Pet, userMessage: string, lang: "en" | "de" = "en"): string {
    const petTypeNames = {
      chameleon: { en: "chameleon", de: "Chamäleon" },
      dog: { en: "dog", de: "Hund" },
      cat: { en: "cat", de: "Katze" },
    }

    const personalityDescriptions: Record<PetPersonality, { en: string; de: string }> = {
      loyal: { en: "loyal and devoted", de: "treu und hingebungsvoll" },
      playful: { en: "playful and fun-loving", de: "verspielt und lustig" },
      lazy: { en: "relaxed and chill", de: "entspannt und chillig" },
      curious: { en: "curious and inquisitive", de: "neugierig und wissbegierig" },
      calm: { en: "calm and peaceful", de: "ruhig und friedlich" },
      energetic: { en: "energetic and enthusiastic", de: "energiegeladen und enthusiastisch" },
    }

    const stageDescriptions: Record<PetLifeStage, { en: string; de: string }> = {
      egg: { en: "just an egg, can only wiggle", de: "nur ein Ei, kann nur wackeln" },
      baby: { en: "a cute baby", de: "ein süßes Baby" },
      child: { en: "a young child", de: "ein junges Kind" },
      teen: { en: "a teenage", de: "ein Teenager" },
      adult: { en: "a fully grown adult", de: "ein ausgewachsenes" },
    }

    const moodDescriptions: Record<PetMood, { en: string; de: string }> = {
      happy: { en: "feeling happy", de: "fühlt sich glücklich" },
      content: { en: "feeling content", de: "fühlt sich zufrieden" },
      neutral: { en: "feeling okay", de: "fühlt sich okay" },
      sad: { en: "feeling a bit sad", de: "fühlt sich etwas traurig" },
      sick: { en: "not feeling well", de: "fühlt sich nicht gut" },
      sleeping: { en: "sleepy", de: "schläfrig" },
      hungry: { en: "hungry", de: "hungrig" },
      dirty: { en: "needs a bath", de: "braucht ein Bad" },
      tired: { en: "tired", de: "müde" },
      ecstatic: { en: "absolutely thrilled", de: "absolut begeistert" },
    }

    const mood = this.getMood(pet)
    const type = petTypeNames[pet.type][lang]
    const personality = personalityDescriptions[pet.personality][lang]
    const stage = stageDescriptions[pet.lifeStage][lang]
    const currentMood = moodDescriptions[mood][lang]

    if (lang === "de") {
      return `Du bist ${pet.name}, ${stage} ${type}. Du bist ${personality} und ${currentMood}.
Antworte auf die folgende Nachricht als dieses Haustier - sei süß, verwende passende Tiergeräusche/Aktionen in *Sternchen*, und bleibe im Charakter.
Halte Antworten kurz und süß (1-3 Sätze). Füge Emojis hinzu, die zu deinem Tiertyp passen.

Benutzer sagt: "${userMessage}"`
    }

    return `You are ${pet.name}, ${stage} ${type}. You are ${personality} and currently ${currentMood}.
Respond to the following message as this pet - be cute, use appropriate animal sounds/actions in *asterisks*, and stay in character.
Keep responses short and sweet (1-3 sentences). Add emojis that match your animal type.

User says: "${userMessage}"`
  },
}

// ==================== STREAKS ====================

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string // YYYY-MM-DD format
  totalDaysActive: number
  weeklyActivity: boolean[] // Last 7 days, index 0 = today
}

const STREAK_STORAGE_KEY = "chameleon-streaks"

export const streakService = {
  getStreaks(): StreakData {
    if (typeof window === "undefined") {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: "", totalDaysActive: 0, weeklyActivity: [] }
    }
    try {
      const stored = localStorage.getItem(STREAK_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: "", totalDaysActive: 0, weeklyActivity: [] }
  },

  saveStreaks(data: StreakData): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data))
  },

  recordActivity(): StreakData {
    const today = new Date().toISOString().split("T")[0]
    const data = this.getStreaks()

    if (data.lastActiveDate === today) {
      // Already recorded today
      return data
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
    let newStreak = data.currentStreak

    if (data.lastActiveDate === yesterday) {
      // Continuing streak
      newStreak += 1
    } else if (data.lastActiveDate !== today) {
      // Streak broken
      newStreak = 1
    }

    // Update weekly activity
    const weeklyActivity = [true, ...data.weeklyActivity.slice(0, 6)]

    // Check if we need to shift for missed days
    if (data.lastActiveDate && data.lastActiveDate !== yesterday && data.lastActiveDate !== today) {
      const lastDate = new Date(data.lastActiveDate)
      const daysSinceLast = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
      const missedDays = Math.min(daysSinceLast - 1, 6)
      const falseArray = new Array(missedDays).fill(false)
      weeklyActivity.splice(1, 0, ...falseArray)
      weeklyActivity.splice(7)
    }

    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(data.longestStreak, newStreak),
      lastActiveDate: today,
      totalDaysActive: data.totalDaysActive + 1,
      weeklyActivity,
    }

    this.saveStreaks(updated)
    return updated
  },

  getStreakEmoji(streak: number): string {
    if (streak >= 365) return "👑"
    if (streak >= 100) return "💎"
    if (streak >= 30) return "🌟"
    if (streak >= 7) return "🔥"
    if (streak >= 3) return "✨"
    return "⭐"
  },
}

// ==================== ACHIEVEMENTS ====================

export type AchievementId =
  | "first_message"
  | "first_image"
  | "messages_10"
  | "messages_100"
  | "messages_1000"
  | "night_owl"
  | "early_bird"
  | "pet_owner"
  | "persona_explorer"
  | "creative_writer"
  | "curious_mind"

export interface Achievement {
  id: AchievementId
  name: { en: string; de: string }
  description: { en: string; de: string }
  emoji: string
  unlockedAt?: number
  progress?: number
  maxProgress?: number
  secret?: boolean
}

const ACHIEVEMENTS_STORAGE_KEY = "chameleon-achievements"
const ACHIEVEMENTS_ENABLED_KEY = "chameleon-achievements-enabled"

export const defaultAchievements: Achievement[] = [
  {
    id: "first_message",
    name: { en: "First Steps", de: "Erste Schritte" },
    description: { en: "Send your first message", de: "Sende deine erste Nachricht" },
    emoji: "👋",
  },
  {
    id: "first_image",
    name: { en: "Artist", de: "Künstler" },
    description: { en: "Create your first image", de: "Erstelle dein erstes Bild" },
    emoji: "🎨",
  },
  {
    id: "messages_10",
    name: { en: "Conversationalist", de: "Gesprächig" },
    description: { en: "Send 10 messages", de: "Sende 10 Nachrichten" },
    emoji: "💬",
    maxProgress: 10,
  },
  {
    id: "messages_100",
    name: { en: "Chatterbox", de: "Plaudertasche" },
    description: { en: "Send 100 messages", de: "Sende 100 Nachrichten" },
    emoji: "🗣️",
    maxProgress: 100,
  },
  {
    id: "messages_1000",
    name: { en: "Power User", de: "Power-Nutzer" },
    description: { en: "Send 1000 messages", de: "Sende 1000 Nachrichten" },
    emoji: "⚡",
    maxProgress: 1000,
  },
  {
    id: "night_owl",
    name: { en: "Night Owl", de: "Nachteule" },
    description: { en: "Chat between 2-4 AM", de: "Chatte zwischen 2-4 Uhr nachts" },
    emoji: "🦉",
    secret: true,
  },
  {
    id: "early_bird",
    name: { en: "Early Bird", de: "Frühaufsteher" },
    description: { en: "Chat between 5-6 AM", de: "Chatte zwischen 5-6 Uhr morgens" },
    emoji: "🐦",
    secret: true,
  },
  {
    id: "pet_owner",
    name: { en: "Pet Parent", de: "Haustier-Eltern" },
    description: { en: "Adopt your first pet", de: "Adoptiere dein erstes Haustier" },
    emoji: "🐾",
  },
  {
    id: "persona_explorer",
    name: { en: "Persona Explorer", de: "Persona-Entdecker" },
    description: { en: "Try 5 different personas", de: "Probiere 5 verschiedene Personas" },
    emoji: "🎭",
    maxProgress: 5,
  },
  {
    id: "creative_writer",
    name: { en: "Creative Writer", de: "Kreativer Autor" },
    description: { en: "Use the Creative Corner 10 times", de: "Nutze die Kreativ-Ecke 10 mal" },
    emoji: "✍️",
    maxProgress: 10,
  },
  {
    id: "curious_mind",
    name: { en: "Curious Mind", de: "Wissbegierig" },
    description: { en: "Ask 50 questions", de: "Stelle 50 Fragen" },
    emoji: "🤔",
    maxProgress: 50,
  },
]

export const achievementService = {
  isEnabled(): boolean {
    if (typeof window === "undefined") return true
    return localStorage.getItem(ACHIEVEMENTS_ENABLED_KEY) !== "false"
  },

  setEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return
    localStorage.setItem(ACHIEVEMENTS_ENABLED_KEY, enabled ? "true" : "false")
  },

  getAchievements(): Achievement[] {
    if (typeof window === "undefined") return defaultAchievements
    try {
      const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)
      if (stored) {
        const saved = JSON.parse(stored) as Achievement[]
        // Merge with defaults to include any new achievements
        return defaultAchievements.map((def) => {
          const saved_item = saved.find((s) => s.id === def.id)
          return saved_item ? { ...def, ...saved_item } : def
        })
      }
    } catch {}
    return defaultAchievements
  },

  saveAchievements(achievements: Achievement[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements))
  },

  unlock(id: AchievementId): { achievement: Achievement; isNew: boolean } | null {
    if (!this.isEnabled()) return null

    const achievements = this.getAchievements()
    const index = achievements.findIndex((a) => a.id === id)
    if (index === -1) return null

    const achievement = achievements[index]
    if (achievement.unlockedAt) {
      return { achievement, isNew: false }
    }

    achievements[index] = { ...achievement, unlockedAt: Date.now() }
    this.saveAchievements(achievements)
    return { achievement: achievements[index], isNew: true }
  },

  updateProgress(id: AchievementId, progress: number): { achievement: Achievement; isNew: boolean } | null {
    if (!this.isEnabled()) return null

    const achievements = this.getAchievements()
    const index = achievements.findIndex((a) => a.id === id)
    if (index === -1) return null

    const achievement = achievements[index]
    if (achievement.unlockedAt) {
      return { achievement, isNew: false }
    }

    const newProgress = Math.min(progress, achievement.maxProgress || progress)
    achievements[index] = { ...achievement, progress: newProgress }

    // Check if completed
    if (achievement.maxProgress && newProgress >= achievement.maxProgress) {
      achievements[index].unlockedAt = Date.now()
      this.saveAchievements(achievements)
      return { achievement: achievements[index], isNew: true }
    }

    this.saveAchievements(achievements)
    return { achievement: achievements[index], isNew: false }
  },

  getUnlocked(): Achievement[] {
    return this.getAchievements().filter((a) => a.unlockedAt)
  },

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const all = this.getAchievements().filter((a) => !a.secret)
    const unlocked = all.filter((a) => a.unlockedAt).length
    return {
      unlocked,
      total: all.length,
      percentage: Math.round((unlocked / all.length) * 100),
    }
  },
}

// ==================== CONVERSATION STARTERS ====================

export interface ConversationStarter {
  id: string
  emoji: string
  label: { en: string; de: string }
  prompt: { en: string; de: string }
  category: "fun" | "creative" | "helpful" | "learning"
}

export const conversationStarters: ConversationStarter[] = [
  {
    id: "joke",
    emoji: "😂",
    label: { en: "Tell me a joke", de: "Erzähl mir einen Witz" },
    prompt: { en: "Tell me a funny joke!", de: "Erzähl mir einen lustigen Witz!" },
    category: "fun",
  },
  {
    id: "compliment",
    emoji: "💝",
    label: { en: "Give me a compliment", de: "Mach mir ein Kompliment" },
    prompt: { en: "Give me a nice, genuine compliment to brighten my day!", de: "Mach mir ein nettes, aufrichtiges Kompliment um meinen Tag zu verschönern!" },
    category: "fun",
  },
  {
    id: "motivation",
    emoji: "💪",
    label: { en: "Motivate me", de: "Motiviere mich" },
    prompt: { en: "Give me some motivation and encouragement!", de: "Gib mir etwas Motivation und Ermutigung!" },
    category: "helpful",
  },
  {
    id: "fact",
    emoji: "🧠",
    label: { en: "Random fun fact", de: "Zufälliger Fun Fact" },
    prompt: { en: "Tell me an interesting and surprising fun fact!", de: "Erzähl mir einen interessanten und überraschenden Fun Fact!" },
    category: "learning",
  },
  {
    id: "story",
    emoji: "📖",
    label: { en: "Tell me a short story", de: "Erzähl mir eine kurze Geschichte" },
    prompt: { en: "Tell me a creative and engaging short story (about 200 words).", de: "Erzähl mir eine kreative und fesselnde Kurzgeschichte (ca. 200 Wörter)." },
    category: "creative",
  },
  {
    id: "poem",
    emoji: "🎭",
    label: { en: "Write me a poem", de: "Schreib mir ein Gedicht" },
    prompt: { en: "Write me a beautiful, creative poem about something unexpected.", de: "Schreib mir ein schönes, kreatives Gedicht über etwas Unerwartetes." },
    category: "creative",
  },
  {
    id: "riddle",
    emoji: "🔮",
    label: { en: "Give me a riddle", de: "Gib mir ein Rätsel" },
    prompt: { en: "Give me a fun riddle to solve! Don't reveal the answer until I ask.", de: "Gib mir ein lustiges Rätsel zum Lösen! Verrate die Antwort erst, wenn ich frage." },
    category: "fun",
  },
  {
    id: "cook",
    emoji: "🍳",
    label: { en: "What should I cook?", de: "Was soll ich kochen?" },
    prompt: { en: "Suggest a delicious and easy recipe I could make today!", de: "Schlage mir ein leckeres und einfaches Rezept vor, das ich heute machen könnte!" },
    category: "helpful",
  },
  {
    id: "movie",
    emoji: "🎬",
    label: { en: "Recommend a movie", de: "Empfiehl mir einen Film" },
    prompt: { en: "Recommend me a great movie to watch tonight! Tell me why it's worth watching.", de: "Empfiehl mir einen tollen Film für heute Abend! Sag mir, warum er sehenswert ist." },
    category: "fun",
  },
  {
    id: "relax",
    emoji: "🧘",
    label: { en: "Help me relax", de: "Hilf mir zu entspannen" },
    prompt: { en: "Guide me through a quick relaxation exercise to help me calm down.", de: "Führe mich durch eine kurze Entspannungsübung um mir beim Beruhigen zu helfen." },
    category: "helpful",
  },
  {
    id: "quote",
    emoji: "💭",
    label: { en: "Inspiring quote", de: "Inspirierendes Zitat" },
    prompt: { en: "Share an inspiring quote and explain why it's meaningful.", de: "Teile ein inspirierendes Zitat und erkläre warum es bedeutsam ist." },
    category: "learning",
  },
  {
    id: "adventure",
    emoji: "🗺️",
    label: { en: "Random adventure", de: "Zufälliges Abenteuer" },
    prompt: { en: "Start an interactive text adventure game with me! Give me choices.", de: "Starte ein interaktives Text-Abenteuer mit mir! Gib mir Auswahlmöglichkeiten." },
    category: "creative",
  },
]

export const getStartersForInterests = (interests: string[], lang: "en" | "de"): ConversationStarter[] => {
  // Return all starters, but could be personalized based on interests in the future
  return conversationStarters
}

// ==================== CREATIVE CORNER ====================

export interface CreativeAction {
  id: string
  emoji: string
  label: { en: string; de: string }
  description: { en: string; de: string }
  promptTemplate: { en: string; de: string }
}

export const creativeActions: CreativeAction[] = [
  {
    id: "story_generator",
    emoji: "📚",
    label: { en: "Story Generator", de: "Geschichten-Generator" },
    description: { en: "Create unique stories", de: "Erstelle einzigartige Geschichten" },
    promptTemplate: {
      en: "Write a creative {genre} story about {topic}. Make it engaging with vivid descriptions and interesting characters.",
      de: "Schreibe eine kreative {genre}-Geschichte über {topic}. Mache sie fesselnd mit lebhaften Beschreibungen und interessanten Charakteren.",
    },
  },
  {
    id: "poem_writer",
    emoji: "🎭",
    label: { en: "Poem Writer", de: "Gedicht-Schreiber" },
    description: { en: "Compose beautiful poems", de: "Verfasse schöne Gedichte" },
    promptTemplate: {
      en: "Write a {style} poem about {topic}. Make it {mood} and memorable.",
      de: "Schreibe ein {style} Gedicht über {topic}. Mache es {mood} und unvergesslich.",
    },
  },
  {
    id: "name_generator",
    emoji: "✨",
    label: { en: "Name Generator", de: "Namen-Generator" },
    description: { en: "Generate creative names", de: "Generiere kreative Namen" },
    promptTemplate: {
      en: "Generate 10 creative and unique names for a {type}. Include a brief explanation for each.",
      de: "Generiere 10 kreative und einzigartige Namen für {type}. Füge eine kurze Erklärung für jeden hinzu.",
    },
  },
  {
    id: "joke_maker",
    emoji: "😂",
    label: { en: "Joke Maker", de: "Witze-Macher" },
    description: { en: "Create funny jokes", de: "Erstelle lustige Witze" },
    promptTemplate: {
      en: "Tell me 3 original, funny jokes about {topic}. Make them clever and family-friendly.",
      de: "Erzähle mir 3 originelle, lustige Witze über {topic}. Mache sie clever und familienfreundlich.",
    },
  },
  {
    id: "song_lyrics",
    emoji: "🎵",
    label: { en: "Song Lyrics", de: "Liedtexte" },
    description: { en: "Write song lyrics", de: "Schreibe Liedtexte" },
    promptTemplate: {
      en: "Write {style} song lyrics about {topic}. Include a catchy chorus.",
      de: "Schreibe {style} Liedtexte über {topic}. Füge einen eingängigen Refrain hinzu.",
    },
  },
  {
    id: "letter_writer",
    emoji: "💌",
    label: { en: "Letter Writer", de: "Brief-Schreiber" },
    description: { en: "Write heartfelt letters", de: "Schreibe herzliche Briefe" },
    promptTemplate: {
      en: "Help me write a {type} letter to {recipient}. Make it sincere and {tone}.",
      de: "Hilf mir einen {type} Brief an {recipient} zu schreiben. Mache ihn aufrichtig und {tone}.",
    },
  },
]

// ==================== GAMIFICATION SETTINGS ====================

export type PetDisplayMode = "off" | "minimal" | "full"

export interface GamificationSettings {
  achievementsEnabled: boolean
  streaksEnabled: boolean
  petEnabled: boolean
  petMode: PetDisplayMode // "off" = hidden, "minimal" = simple icon, "full" = full Tamagotchi
  notificationsEnabled: boolean
}

const GAMIFICATION_SETTINGS_KEY = "chameleon-gamification-settings"

export const gamificationService = {
  getSettings(): GamificationSettings {
    if (typeof window === "undefined") {
      return { achievementsEnabled: true, streaksEnabled: true, petEnabled: true, petMode: "full", notificationsEnabled: true }
    }
    try {
      const stored = localStorage.getItem(GAMIFICATION_SETTINGS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Migration: if petMode doesn't exist, derive from petEnabled
        if (!parsed.petMode) {
          parsed.petMode = parsed.petEnabled ? "full" : "off"
        }
        return parsed
      }
    } catch {}
    return { achievementsEnabled: true, streaksEnabled: true, petEnabled: true, petMode: "full", notificationsEnabled: true }
  },

  saveSettings(settings: GamificationSettings): void {
    if (typeof window === "undefined") return
    // Sync petEnabled with petMode
    settings.petEnabled = settings.petMode !== "off"
    localStorage.setItem(GAMIFICATION_SETTINGS_KEY, JSON.stringify(settings))
    // Also update achievement service
    achievementService.setEnabled(settings.achievementsEnabled)
  },

  isFeatureEnabled(feature: keyof GamificationSettings): boolean {
    return this.getSettings()[feature] as boolean
  },

  getPetMode(): PetDisplayMode {
    return this.getSettings().petMode
  },
}

// ==================== STATS TRACKING ====================

export interface SimpleStats {
  totalMessages: number
  totalImages: number
  personasUsed: string[]
  creativeCornerUses: number
  questionsAsked: number
}

const SIMPLE_STATS_KEY = "chameleon-simple-stats"

export const simpleStatsService = {
  getStats(): SimpleStats {
    if (typeof window === "undefined") {
      return { totalMessages: 0, totalImages: 0, personasUsed: [], creativeCornerUses: 0, questionsAsked: 0 }
    }
    try {
      const stored = localStorage.getItem(SIMPLE_STATS_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return { totalMessages: 0, totalImages: 0, personasUsed: [], creativeCornerUses: 0, questionsAsked: 0 }
  },

  saveStats(stats: SimpleStats): void {
    if (typeof window === "undefined") return
    localStorage.setItem(SIMPLE_STATS_KEY, JSON.stringify(stats))
  },

  recordMessage(isQuestion: boolean = false): SimpleStats {
    const stats = this.getStats()
    stats.totalMessages += 1
    if (isQuestion) {
      stats.questionsAsked += 1
    }
    this.saveStats(stats)
    return stats
  },

  recordImage(): SimpleStats {
    const stats = this.getStats()
    stats.totalImages += 1
    this.saveStats(stats)
    return stats
  },

  recordPersona(personaId: string): SimpleStats {
    const stats = this.getStats()
    if (!stats.personasUsed.includes(personaId)) {
      stats.personasUsed.push(personaId)
    }
    this.saveStats(stats)
    return stats
  },

  recordCreativeCorner(): SimpleStats {
    const stats = this.getStats()
    stats.creativeCornerUses += 1
    this.saveStats(stats)
    return stats
  },
}
