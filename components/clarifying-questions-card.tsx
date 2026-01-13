"use client"

import { memo } from "react"
import { Question, Lightning } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ClarifyingQuestion } from "@/lib/agent-prompts"

interface ClarifyingQuestionsCardProps {
  questions: ClarifyingQuestion[]
  onSelectOption: (answer: string) => void
  language?: "en" | "de" | "es"
  disabled?: boolean
}

const labels = {
  en: {
    title: "Before I research...",
    subtitle: "Help me understand your needs better",
    customAnswer: "Type custom answer",
  },
  de: {
    title: "Bevor ich recherchiere...",
    subtitle: "Hilf mir, deine Bedürfnisse besser zu verstehen",
    customAnswer: "Eigene Antwort eingeben",
  },
  es: {
    title: "Antes de investigar...",
    subtitle: "Ayúdame a entender mejor tus necesidades",
    customAnswer: "Escribir respuesta personalizada",
  },
}

/**
 * Clarifying Questions Card
 * Displays Agent Mode clarifying questions with clickable option chips
 */
export const ClarifyingQuestionsCard = memo(({
  questions,
  onSelectOption,
  language = "en",
  disabled = false,
}: ClarifyingQuestionsCardProps) => {
  const lang = labels[language] || labels.en

  if (!questions || questions.length === 0) return null

  return (
    <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 shadow-sm">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
          <Question className="w-5 h-5 text-white" weight="fill" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {lang.title}
          </h3>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
            {lang.subtitle}
          </p>
        </div>
        <div className="ml-auto">
          <Lightning className="w-5 h-5 text-amber-500/50" weight="fill" />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="space-y-2.5">
            {/* Question Text */}
            <p className="text-sm font-medium text-foreground pl-1">
              {q.question}
            </p>

            {/* Option Chips */}
            <div className="flex flex-wrap gap-2">
              {q.options.map((option, optIdx) => (
                <Button
                  key={optIdx}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onSelectOption(option)}
                  className={cn(
                    "h-auto py-1.5 px-3 text-xs font-medium rounded-full",
                    "border-amber-500/40 hover:border-amber-500",
                    "bg-white/50 dark:bg-white/5 hover:bg-amber-500/10",
                    "text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200",
                    "transition-all duration-200",
                    "shadow-sm hover:shadow-md",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="text-[10px] text-amber-600/60 dark:text-amber-400/60 pl-1 pt-1">
        Click an option or type your own answer below
      </p>
    </div>
  )
})

ClarifyingQuestionsCard.displayName = "ClarifyingQuestionsCard"

export default ClarifyingQuestionsCard
