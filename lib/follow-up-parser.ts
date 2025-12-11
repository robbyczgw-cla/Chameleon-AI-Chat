export interface CategorizedFollowUp {
  category: 'quick' | 'deep' | 'related'
  label: string
  icon: string
  text: string
}

export interface ParsedMessage {
  content: string
  followUps: string[]
  categorizedFollowUps: CategorizedFollowUp[]
  suggestedPrompts: string[]
}

const CATEGORY_CONFIG = {
  quick: { label: 'Schnell', icon: '⚡' },
  deep: { label: 'Tiefer', icon: '🧠' },
  related: { label: 'Verwandt', icon: '🔗' }
}

export function parseFollowUps(content: string): ParsedMessage {
  let cleanContent = content

  // Extract follow-up questions (AI asks user) from [FOLLOWUP]...[/FOLLOWUP] tags
  const followUpRegex = /\[FOLLOWUP\](.*?)\[\/FOLLOWUP\]/gs
  const followUpMatches = content.match(followUpRegex)
  const followUps: string[] = []
  const categorizedFollowUps: CategorizedFollowUp[] = []

  if (followUpMatches && followUpMatches.length > 0) {
    followUpMatches.forEach(match => {
      cleanContent = cleanContent.replace(match, '').trim()
      const innerContent = match.replace('[FOLLOWUP]', '').replace('[/FOLLOWUP]', '').trim()

      // Try to parse as JSON (new structured format)
      try {
        const parsed = JSON.parse(innerContent)

        // Check if it's the new categorized format
        if (typeof parsed === 'object' && (parsed.quick || parsed.deep || parsed.related)) {
          // Process categorized follow-ups
          Object.entries(parsed).forEach(([category, suggestions]) => {
            if (Array.isArray(suggestions) && (category === 'quick' || category === 'deep' || category === 'related')) {
              suggestions.forEach((suggestion: string) => {
                const trimmed = suggestion.trim()
                if (trimmed.length > 0) {
                  categorizedFollowUps.push({
                    category: category as 'quick' | 'deep' | 'related',
                    label: CATEGORY_CONFIG[category].label,
                    icon: CATEGORY_CONFIG[category].icon,
                    text: trimmed
                  })
                }
              })
            }
          })
          return
        }
      } catch (e) {
        // Not JSON, fall back to pipe-separated format
      }

      // Fallback: Old pipe-separated format
      const suggestions = innerContent.split('|').map(s => s.trim()).filter(s => s.length > 0)
      followUps.push(...suggestions)
    })
  }

  // Extract suggested prompts (user could ask AI) from [SUGGESTED]...[/SUGGESTED] tags
  const suggestedRegex = /\[SUGGESTED\](.*?)\[\/SUGGESTED\]/g
  const suggestedMatches = content.match(suggestedRegex)
  const suggestedPrompts: string[] = []

  if (suggestedMatches && suggestedMatches.length > 0) {
    suggestedMatches.forEach(match => {
      cleanContent = cleanContent.replace(match, '').trim()
      const innerContent = match.replace('[SUGGESTED]', '').replace('[/SUGGESTED]', '')
      const suggestions = innerContent.split('|').map(s => s.trim()).filter(s => s.length > 0)
      suggestedPrompts.push(...suggestions)
    })
  }

  return {
    content: cleanContent,
    followUps: followUps.slice(0, 3), // Max 3 follow-up questions (old format)
    categorizedFollowUps: categorizedFollowUps.slice(0, 6), // Max 6 categorized (2 per category)
    suggestedPrompts: suggestedPrompts.slice(0, 3) // Max 3 suggested prompts
  }
}
