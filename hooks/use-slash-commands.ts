/**
 * useSlashCommands Hook
 * Handles slash command detection and suggestions
 */

import { useState, useCallback, useMemo } from "react"
import {
  parseSlashCommand,
  getCommandSuggestions,
  buildCommandPrompt,
  SLASH_COMMANDS,
} from "@/lib/slash-commands"

type SlashCommand = (typeof SLASH_COMMANDS)[number]

interface UseSlashCommandsReturn {
  commandSuggestions: SlashCommand[]
  showCommandMenu: boolean
  handleInputChange: (value: string, setInput: (v: string) => void) => void
  selectCommand: (command: SlashCommand, setInput: (v: string) => void) => void
  processCommand: (input: string) => { processed: string; isCommand: boolean; command?: SlashCommand }
}

export function useSlashCommands(): UseSlashCommandsReturn {
  const [commandSuggestions, setCommandSuggestions] = useState<SlashCommand[]>([])
  const [showCommandMenu, setShowCommandMenu] = useState(false)

  const handleInputChange = useCallback(
    (value: string, setInput: (v: string) => void) => {
      setInput(value)

      // Check for slash commands
      if (value.trim().startsWith("/")) {
        const suggestions = getCommandSuggestions(value.trim())
        setCommandSuggestions(suggestions)
        setShowCommandMenu(suggestions.length > 0)
      } else {
        setShowCommandMenu(false)
        setCommandSuggestions([])
      }
    },
    []
  )

  const selectCommand = useCallback(
    (command: SlashCommand, setInput: (v: string) => void) => {
      setInput(command.command + " ")
      setShowCommandMenu(false)
    },
    []
  )

  const processCommand = useCallback(
    (input: string): { processed: string; isCommand: boolean; command?: SlashCommand } => {
      const { isCommand, command, remainingText } = parseSlashCommand(input)

      if (isCommand && command) {
        return {
          processed: buildCommandPrompt(command, remainingText),
          isCommand: true,
          command,
        }
      }

      return {
        processed: input,
        isCommand: false,
      }
    },
    []
  )

  return {
    commandSuggestions,
    showCommandMenu,
    handleInputChange,
    selectCommand,
    processCommand,
  }
}
