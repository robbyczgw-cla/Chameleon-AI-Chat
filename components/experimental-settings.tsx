"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApp } from "@/contexts/app-context"
import { FlaskRound, AlertTriangle } from "lucide-react"

export function ExperimentalSettings() {
  const { settings, updateSettings } = useApp()
  const experimental = settings.experimental || {}

  const handleExperimentalChange = (updates: Partial<typeof experimental>) => {
    updateSettings({
      experimental: {
        ...experimental,
        ...updates,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Experimental Features</h4>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            These features are experimental and may change or be removed in future updates. Use at your own
            discretion.
          </p>
        </div>
      </div>

      {/* Response Analysis Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FlaskRound className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Response Analysis</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Response Analysis */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Response Analysis</Label>
              <p className="text-xs text-muted-foreground">
                Analyze AI responses for sentiment, confidence, complexity, and more
              </p>
            </div>
            <Switch
              checked={experimental.enableResponseAnalysis || false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableResponseAnalysis: checked })}
            />
          </div>

          {/* Info Box */}
          {experimental.enableResponseAnalysis && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Response analysis shows sentiment, confidence level, hedging phrases,
                complexity, reading time, and tone for each AI response.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
