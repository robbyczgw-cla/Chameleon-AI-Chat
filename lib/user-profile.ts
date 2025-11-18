import { supabaseSync } from "@/lib/supabase/sync"

export interface UserProfile {
  name?: string
  age?: string
  interests?: string[]
  occupation?: string
  location?: string
  aboutMe?: string
  goals?: string[]
  preferences?: {
    communicationStyle?: string
    topicsToAvoid?: string[]
  }
}

const STORAGE_KEY = "user-profile"

export const userProfileService = {
  getProfile(): UserProfile {
    if (typeof window === "undefined") return {}

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("[User Profile] Failed to load profile:", error)
      return {}
    }
  },

  async saveProfile(profile: UserProfile, userId?: string): Promise<void> {
    if (typeof window === "undefined") return

    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      console.log("[User Profile] Saved profile to localStorage:", profile)

      // Save to Supabase if user is logged in
      if (userId) {
        try {
          await supabaseSync.saveUserProfile(userId, profile)
          console.log("[User Profile] Saved profile to Supabase")
        } catch (error) {
          console.error("[User Profile] Failed to save to Supabase:", error)
          // Don't throw - localStorage save was successful
        }
      }
    } catch (error) {
      console.error("[User Profile] Failed to save profile:", error)
    }
  },

  async updateProfile(updates: Partial<UserProfile>, userId?: string): Promise<UserProfile> {
    const current = this.getProfile()
    const updated = { ...current, ...updates }
    await this.saveProfile(updated, userId)
    return updated
  },

  async loadProfileFromSupabase(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await supabaseSync.getUserProfile(userId)
      if (profile) {
        // Update localStorage with Supabase data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
        console.log("[User Profile] Loaded profile from Supabase:", profile)
        return profile
      }
      return null
    } catch (error) {
      console.error("[User Profile] Failed to load from Supabase:", error)
      return null
    }
  },

  clearProfile(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
  },

  // Generate a system prompt context from the profile
  getProfileContext(profile: UserProfile): string {
    const parts: string[] = []

    if (profile.name) {
      parts.push(`Der Nutzer heißt ${profile.name}.`)
    }

    if (profile.age) {
      parts.push(`Alter: ${profile.age}.`)
    }

    if (profile.occupation) {
      parts.push(`Beruf/Tätigkeit: ${profile.occupation}.`)
    }

    if (profile.location) {
      parts.push(`Wohnort: ${profile.location}.`)
    }

    if (profile.interests && profile.interests.length > 0) {
      parts.push(`Interessen: ${profile.interests.join(", ")}.`)
    }

    if (profile.goals && profile.goals.length > 0) {
      parts.push(`Ziele: ${profile.goals.join(", ")}.`)
    }

    if (profile.aboutMe) {
      parts.push(`Über mich: ${profile.aboutMe}`)
    }

    if (profile.preferences?.communicationStyle) {
      parts.push(`Bevorzugter Kommunikationsstil: ${profile.preferences.communicationStyle}.`)
    }

    if (profile.preferences?.topicsToAvoid && profile.preferences.topicsToAvoid.length > 0) {
      parts.push(`Themen die vermieden werden sollen: ${profile.preferences.topicsToAvoid.join(", ")}.`)
    }

    if (parts.length === 0) {
      return ""
    }

    return `\n\n📋 PERSÖNLICHE INFORMATIONEN ÜBER DEN NUTZER:\n${parts.join(" ")}\n\nBitte berücksichtige diese Informationen bei deinen Antworten und mache sie persönlicher und relevanter für den Nutzer.`
  },

  hasProfile(): boolean {
    const profile = this.getProfile()
    return Object.keys(profile).some(key => {
      const value = profile[key as keyof UserProfile]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') return Object.keys(value || {}).length > 0
      return !!value
    })
  }
}
