"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useApp } from "@/contexts/app-context"
import { createClient } from "@/lib/supabase/client"

/**
 * Debug Component: Check if Settings are correctly stored in Supabase
 *
 * Usage: Import this component in settings-dialog.tsx temporarily to debug
 */
export function DebugSettingsStorage() {
  const { settings, user } = useApp()
  const [dbSettings, setDbSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSupabase = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        setError("Not logged in! Please log in first.")
        return
      }

      const supabase = createClient()

      // Fetch settings from Supabase
      const { data, error: fetchError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setError("No settings found in database (first time user)")
        } else {
          setError(`Supabase error: ${fetchError.message}`)
        }
        return
      }

      setDbSettings(data)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const maskKey = (key: string | null | undefined) => {
    if (!key) return "Not set"
    if (key.length < 10) return `Too short: ${key}`
    return `${key.slice(0, 8)}...${key.slice(-4)}`
  }

  return (
    <Card className="p-6 space-y-4 border-orange-500/30 bg-orange-50 dark:bg-orange-950/20">
      <div>
        <h3 className="font-bold text-lg mb-2">🔧 Settings Storage Debug</h3>
        <p className="text-sm text-muted-foreground">
          Check if your API keys are correctly stored in Supabase database
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">👤 User Status:</p>
          <p className="text-xs text-muted-foreground">
            {user ? `✅ Logged in as ${user.email}` : "❌ Not logged in"}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">💾 Local Settings (in memory):</p>
          <div className="text-xs font-mono bg-muted p-2 rounded space-y-1">
            <div>Serper API Key: {maskKey(settings.apiKeys?.serper)}</div>
            <div>Search Provider: {settings.searchProvider || "tavily"}</div>
          </div>
        </div>

        {dbSettings && (
          <div>
            <p className="text-sm font-medium">☁️ Database Settings (Supabase):</p>
            <div className="text-xs font-mono bg-muted p-2 rounded space-y-1">
              <div>Serper API Key: {maskKey(dbSettings.serper_api_key)}</div>
              <div>Search Provider: {dbSettings.search_provider || "not set"}</div>
              <div>Serper Country: {dbSettings.serper_country || "not set"}</div>
              <div>Serper Language: {dbSettings.serper_language || "not set"}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-950/30 p-3 rounded">
            <p className="text-sm text-red-600 dark:text-red-400">❌ {error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Button onClick={checkSupabase} disabled={loading || !user} className="w-full">
            {loading ? "Checking..." : "🔍 Check Supabase Database"}
          </Button>

          {dbSettings && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-sm font-medium">🔍 Analysis:</p>
              <div className="space-y-1">
                {!dbSettings.serper_api_key && (
                  <div className="text-xs p-2 bg-yellow-100 dark:bg-yellow-950/30 rounded">
                    ⚠️ Serper key NOT in database! After entering it in Settings, click "Save" and
                    check again.
                  </div>
                )}
                {dbSettings.serper_api_key && settings.apiKeys?.serper !== dbSettings.serper_api_key && (
                  <div className="text-xs p-2 bg-yellow-100 dark:bg-yellow-950/30 rounded">
                    ⚠️ Mismatch! Local key differs from database. Page refresh needed?
                  </div>
                )}
                {dbSettings.serper_api_key && settings.apiKeys?.serper === dbSettings.serper_api_key && (
                  <div className="text-xs p-2 bg-green-100 dark:bg-green-950/30 rounded">
                    ✅ Perfect sync! Local and database match.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-3">
        <p className="font-medium mb-1">How to fix if Serper key is lost after redeploy:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Make sure you're logged in (not using localStorage only)</li>
          <li>Enter Serper API key in Settings → API Keys</li>
          <li>Click "Save Changes" (this triggers Supabase sync)</li>
          <li>Click "Check Supabase Database" above to verify it's saved</li>
          <li>If still not saved, check Supabase RLS policies for user_settings table</li>
        </ol>
      </div>
    </Card>
  )
}
