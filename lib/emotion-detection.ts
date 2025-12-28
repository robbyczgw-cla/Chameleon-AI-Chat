/**
 * Emotion Detection Service for Chameleon AI Chat
 *
 * Detects user emotions from:
 * - Text sentiment (frustration, excitement, confusion, sarcasm)
 * - Typing patterns (speed, corrections, caps usage)
 * - Message context (error messages, repeated questions)
 *
 * Used by personas (like Cami) to adapt their responses.
 */

export type EmotionType =
  | 'neutral'
  | 'frustrated'
  | 'excited'
  | 'confused'
  | 'sarcastic'
  | 'grateful'
  | 'urgent'
  | 'curious'
  | 'discouraged'

export interface EmotionSignal {
  type: EmotionType
  confidence: number // 0-1
  indicators: string[]
}

export interface EmotionAnalysis {
  primary: EmotionSignal
  secondary?: EmotionSignal
  rawScores: Record<EmotionType, number>
  adaptationHints: AdaptationHint[]
}

export interface AdaptationHint {
  action: 'empathize' | 'simplify' | 'match_energy' | 'be_direct' | 'offer_help' | 'acknowledge_sarcasm' | 'encourage' | 'slow_down'
  reason: string
  suggestedTone?: string
}

export interface TypingPattern {
  averageSpeed?: number // chars per second
  hasMultipleEdits?: boolean
  timeSinceLastMessage?: number // ms
  messageLength?: number
}

// Indicator patterns for each emotion
const EMOTION_PATTERNS = {
  frustrated: {
    // Explicit frustration words
    words: [
      'frustrated', 'annoying', 'annoyed', 'ugh', 'argh', 'damn', 'dammit',
      'hate', 'stupid', 'broken', 'useless', 'waste', 'terrible', 'awful',
      'ridiculous', 'impossible', 'stuck', 'again', 'still', 'why won\'t',
      'doesn\'t work', 'not working', 'keeps failing', 'error', 'bug',
      'frustriert', 'nervt', 'nervig', 'mist', 'verdammt', 'scheisse', 'scheiße',
      'funktioniert nicht', 'geht nicht', 'kaputt', 'fehler'
    ],
    // Patterns that indicate frustration
    patterns: [
      /!{2,}/,                    // Multiple exclamation marks
      /\?{2,}/,                   // Multiple question marks
      /why (won't|doesn't|can't|isn't)/i,
      /still (not|doesn't|won't|can't)/i,
      /keeps? (failing|breaking|crashing)/i,
      /(tried|try) everything/i,
      /nothing works/i,
      /give up/i,
      /this is (so )?(frustrating|annoying)/i,
    ],
    // Sarcasm patterns that indicate frustration
    sarcasmPatterns: [
      /great[,.]? (just|another|more)/i,
      /just what i needed/i,
      /oh (great|perfect|wonderful)/i,
      /thanks? (a lot|so much)[.!]*$/i,  // Sarcastic thanks
      /how (wonderful|lovely|nice)/i,
      /(exactly|just) what i (wanted|needed)/i,
      /super[.!]*$/i,
      /toll[,.]? (schon wieder|noch mehr)/i,
      /genau das was ich (brauchte|wollte)/i,
    ]
  },

  excited: {
    words: [
      'awesome', 'amazing', 'love', 'fantastic', 'perfect', 'excellent',
      'brilliant', 'wonderful', 'incredible', 'yes', 'yay', 'woohoo',
      'finally', 'great', 'cool', 'nice', 'sweet', 'excited', 'can\'t wait',
      'super', 'toll', 'geil', 'mega', 'krass', 'wahnsinn', 'endlich',
      'perfekt', 'genial', 'fantastisch', 'wunderbar'
    ],
    patterns: [
      /!{1,}/,                    // Exclamation marks (positive context)
      /\b(so|really|very|super) (excited|happy|glad)/i,
      /can'?t wait/i,
      /this is (so )?(cool|awesome|amazing)/i,
      /thank you(!+|\.)/i,       // Genuine thanks
      /finally[!.]/i,
    ]
  },

  confused: {
    words: [
      'confused', 'confusing', 'don\'t understand', 'what do you mean',
      'unclear', 'lost', 'huh', 'what', 'how', 'why', 'which',
      'not sure', 'no idea', 'makes no sense', 'doesn\'t make sense',
      'verwirrt', 'verstehe nicht', 'was meinst du', 'unklar', 'keine ahnung',
      'ergibt keinen sinn', 'kapier ich nicht', 'wie geht das'
    ],
    patterns: [
      /\?{1,}/,                   // Questions
      /what (do|does|is|are) (you|this|that|it) mean/i,
      /i don'?t (get|understand)/i,
      /can you (explain|clarify)/i,
      /what('s| is) (the|a) .{1,30}\?/i,  // Direct questions
      /how (do|does|can|should) (i|we|you)/i,
      /not sure (what|how|why|if)/i,
      /(explain|tell) (me )?(again|more)/i,
    ]
  },

  grateful: {
    words: [
      'thank', 'thanks', 'appreciate', 'helpful', 'helped', 'grateful',
      'danke', 'dankbar', 'hilfreich', 'hat geholfen'
    ],
    patterns: [
      /thank(s| you)( so much)?[!.]/i,
      /really (helped|appreciate)/i,
      /you('re| are) (the best|amazing|awesome)/i,
      /that (worked|helps|fixed)/i,
      /vielen dank/i,
      /hat (geholfen|funktioniert)/i,
    ]
  },

  urgent: {
    words: [
      'urgent', 'asap', 'immediately', 'now', 'deadline', 'emergency',
      'hurry', 'quick', 'fast', 'critical', 'important', 'need',
      'dringend', 'sofort', 'schnell', 'deadline', 'wichtig', 'muss'
    ],
    patterns: [
      /need(s?)? (this|it|help) (now|asap|immediately|urgently)/i,
      /deadline (is )?(today|tomorrow|in \d)/i,
      /(please|pls) (help|hurry)/i,
      /!{2,}/,                    // Multiple exclamation marks (urgency context)
      /as soon as possible/i,
      /right (now|away)/i,
    ]
  },

  curious: {
    words: [
      'curious', 'wondering', 'interested', 'how does', 'why does',
      'what if', 'tell me more', 'explain', 'learn',
      'neugierig', 'interessiert', 'wie funktioniert', 'warum', 'erzähl mehr'
    ],
    patterns: [
      /i('m| am) (curious|wondering|interested)/i,
      /how does .{1,50} work/i,
      /what (would|could) happen if/i,
      /can you (tell|explain|show) me (more|how)/i,
      /i('d| would) (like|love) to (know|learn|understand)/i,
    ]
  },

  discouraged: {
    words: [
      'give up', 'hopeless', 'impossible', 'can\'t do', 'too hard',
      'never', 'pointless', 'waste of time', 'failed',
      'aufgeben', 'hoffnungslos', 'unmöglich', 'schaffe ich nicht', 'zu schwer'
    ],
    patterns: [
      /i('ll| will)? (just )?give up/i,
      /(this is|it's|it is) (too )?(hard|difficult|impossible)/i,
      /i can'?t (do|figure|understand|get)/i,
      /never (going to|gonna) (work|get|figure)/i,
      /(what's|what is) the point/i,
      /i('m| am) (so )?(bad|terrible|stupid) at/i,
    ]
  }
}

/**
 * Analyze text for emotional content
 */
export function analyzeEmotion(
  text: string,
  typingPattern?: TypingPattern,
  conversationContext?: {
    previousMessages?: string[]
    repeatedQuestions?: boolean
    hasErrorMention?: boolean
  }
): EmotionAnalysis {
  const lowerText = text.toLowerCase()
  const scores: Record<EmotionType, number> = {
    neutral: 0.3,  // Base neutral score
    frustrated: 0,
    excited: 0,
    confused: 0,
    sarcastic: 0,
    grateful: 0,
    urgent: 0,
    curious: 0,
    discouraged: 0
  }

  const indicators: Record<EmotionType, string[]> = {
    neutral: [],
    frustrated: [],
    excited: [],
    confused: [],
    sarcastic: [],
    grateful: [],
    urgent: [],
    curious: [],
    discouraged: []
  }

  // Check for sarcasm first (affects frustration detection)
  let hasSarcasm = false
  for (const pattern of EMOTION_PATTERNS.frustrated.sarcasmPatterns) {
    if (pattern.test(text)) {
      hasSarcasm = true
      scores.sarcastic += 0.4
      scores.frustrated += 0.3  // Sarcasm often indicates underlying frustration
      indicators.sarcastic.push(`Sarcasm pattern: "${text.match(pattern)?.[0]}"`)
      indicators.frustrated.push('Sarcasm detected (underlying frustration)')
    }
  }

  // Analyze each emotion type
  for (const [emotion, config] of Object.entries(EMOTION_PATTERNS)) {
    if (emotion === 'frustrated' && hasSarcasm) continue // Already handled

    const emotionType = emotion as EmotionType

    // Check words
    for (const word of config.words) {
      if (lowerText.includes(word.toLowerCase())) {
        scores[emotionType] += 0.15
        indicators[emotionType].push(`Word: "${word}"`)
      }
    }

    // Check patterns
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        scores[emotionType] += 0.2
        const match = text.match(pattern)?.[0]
        if (match) {
          indicators[emotionType].push(`Pattern: "${match}"`)
        }
      }
    }
  }

  // Contextual adjustments

  // ALL CAPS detection (indicates strong emotion - frustration or excitement)
  const capsRatio = (text.match(/[A-Z]/g)?.length || 0) / text.length
  if (capsRatio > 0.5 && text.length > 10) {
    // Determine if positive or negative caps
    const hasPositiveWords = EMOTION_PATTERNS.excited.words.some(w => lowerText.includes(w))
    if (hasPositiveWords) {
      scores.excited += 0.2
      indicators.excited.push('CAPS with positive context')
    } else {
      scores.frustrated += 0.2
      indicators.frustrated.push('CAPS usage (possible frustration)')
    }
  }

  // Multiple punctuation
  if (/[!?]{3,}/.test(text)) {
    scores.frustrated += 0.15
    indicators.frustrated.push('Excessive punctuation')
  }

  // Error-related context
  if (conversationContext?.hasErrorMention || /error|exception|failed|crash/i.test(text)) {
    scores.frustrated += 0.15
    indicators.frustrated.push('Error/failure mentioned')
  }

  // Repeated questions indicate confusion or frustration
  if (conversationContext?.repeatedQuestions) {
    scores.confused += 0.2
    scores.frustrated += 0.1
    indicators.confused.push('Repeated question')
  }

  // Typing pattern analysis
  if (typingPattern) {
    // Very fast typing might indicate urgency or frustration
    if (typingPattern.averageSpeed && typingPattern.averageSpeed > 8) {
      scores.urgent += 0.1
      indicators.urgent.push('Fast typing speed')
    }

    // Multiple edits might indicate uncertainty/confusion
    if (typingPattern.hasMultipleEdits) {
      scores.confused += 0.1
      indicators.confused.push('Multiple message edits')
    }

    // Quick follow-up messages might indicate urgency
    if (typingPattern.timeSinceLastMessage && typingPattern.timeSinceLastMessage < 5000) {
      scores.urgent += 0.1
      indicators.urgent.push('Quick follow-up')
    }
  }

  // Normalize scores
  const maxScore = Math.max(...Object.values(scores))
  if (maxScore > 0) {
    for (const key of Object.keys(scores) as EmotionType[]) {
      scores[key] = Math.min(scores[key] / maxScore, 1)
    }
  }

  // Find primary and secondary emotions
  const sortedEmotions = (Object.entries(scores) as [EmotionType, number][])
    .sort((a, b) => b[1] - a[1])

  const primary: EmotionSignal = {
    type: sortedEmotions[0][0],
    confidence: sortedEmotions[0][1],
    indicators: indicators[sortedEmotions[0][0]]
  }

  const secondary: EmotionSignal | undefined =
    sortedEmotions[1][1] > 0.3
      ? {
          type: sortedEmotions[1][0],
          confidence: sortedEmotions[1][1],
          indicators: indicators[sortedEmotions[1][0]]
        }
      : undefined

  // Generate adaptation hints
  const adaptationHints = generateAdaptationHints(primary, secondary)

  return {
    primary,
    secondary,
    rawScores: scores,
    adaptationHints
  }
}

/**
 * Generate hints for how the AI should adapt its response
 */
function generateAdaptationHints(
  primary: EmotionSignal,
  secondary?: EmotionSignal
): AdaptationHint[] {
  const hints: AdaptationHint[] = []

  switch (primary.type) {
    case 'frustrated':
      hints.push({
        action: 'empathize',
        reason: 'User appears frustrated',
        suggestedTone: 'Understanding and supportive, acknowledge their difficulty'
      })
      hints.push({
        action: 'be_direct',
        reason: 'Frustrated users want solutions, not lengthy explanations',
        suggestedTone: 'Concise and solution-focused'
      })
      break

    case 'sarcastic':
      hints.push({
        action: 'acknowledge_sarcasm',
        reason: 'User is using sarcasm (likely frustrated underneath)',
        suggestedTone: 'Light acknowledgment of their frustration, then helpful'
      })
      hints.push({
        action: 'empathize',
        reason: 'Sarcasm often masks genuine frustration',
        suggestedTone: 'Warm but not overly cheerful'
      })
      break

    case 'excited':
      hints.push({
        action: 'match_energy',
        reason: 'User is enthusiastic',
        suggestedTone: 'Enthusiastic and positive, share their excitement'
      })
      break

    case 'confused':
      hints.push({
        action: 'simplify',
        reason: 'User is confused or uncertain',
        suggestedTone: 'Clear, step-by-step, patient'
      })
      hints.push({
        action: 'offer_help',
        reason: 'Proactively offer clarification',
        suggestedTone: 'Supportive and encouraging'
      })
      break

    case 'grateful':
      hints.push({
        action: 'match_energy',
        reason: 'User is expressing gratitude',
        suggestedTone: 'Warm and genuine, happy to help'
      })
      break

    case 'urgent':
      hints.push({
        action: 'be_direct',
        reason: 'User needs quick help',
        suggestedTone: 'Efficient, no fluff, straight to the point'
      })
      break

    case 'curious':
      hints.push({
        action: 'match_energy',
        reason: 'User is curious and wants to learn',
        suggestedTone: 'Enthusiastic teacher, share interesting details'
      })
      break

    case 'discouraged':
      hints.push({
        action: 'encourage',
        reason: 'User seems to be losing hope',
        suggestedTone: 'Supportive, break down the problem, show it\'s achievable'
      })
      hints.push({
        action: 'simplify',
        reason: 'Make the task seem more manageable',
        suggestedTone: 'Gentle and patient'
      })
      break

    default:
      hints.push({
        action: 'offer_help',
        reason: 'Neutral conversation',
        suggestedTone: 'Friendly and helpful'
      })
  }

  // Add secondary emotion hints if significant
  if (secondary && secondary.confidence > 0.5) {
    if (secondary.type === 'urgent' && primary.type !== 'urgent') {
      hints.push({
        action: 'be_direct',
        reason: 'Secondary urgency detected',
        suggestedTone: 'Prioritize efficiency'
      })
    }
    if (secondary.type === 'confused' && primary.type !== 'confused') {
      hints.push({
        action: 'simplify',
        reason: 'Secondary confusion detected',
        suggestedTone: 'Consider adding clarification'
      })
    }
  }

  return hints
}

/**
 * Generate a system prompt addition based on detected emotion
 * This is injected into the persona's context
 */
export function generateEmotionContext(analysis: EmotionAnalysis): string {
  const { primary, secondary, adaptationHints } = analysis

  if (primary.type === 'neutral' && primary.confidence < 0.5) {
    return '' // No special context needed for neutral messages
  }

  let context = `\n\n[EMOTION DETECTION - ADAPT YOUR RESPONSE]\n`
  context += `Primary emotion detected: ${primary.type.toUpperCase()} (${Math.round(primary.confidence * 100)}% confidence)\n`

  if (primary.indicators.length > 0) {
    context += `Indicators: ${primary.indicators.slice(0, 3).join(', ')}\n`
  }

  if (secondary && secondary.confidence > 0.4) {
    context += `Secondary emotion: ${secondary.type} (${Math.round(secondary.confidence * 100)}%)\n`
  }

  context += `\nAdaptation guidance:\n`
  for (const hint of adaptationHints) {
    context += `- ${hint.action.replace('_', ' ').toUpperCase()}: ${hint.suggestedTone || hint.reason}\n`
  }

  // Specific instructions based on emotion
  switch (primary.type) {
    case 'frustrated':
    case 'sarcastic':
      context += `\nIMPORTANT: The user seems frustrated. Start by briefly acknowledging their difficulty (e.g., "I hear you - that's frustrating" or "Error messages are the worst"). Then provide a clear, direct solution. Avoid being overly cheerful.`
      break
    case 'confused':
      context += `\nIMPORTANT: The user seems confused. Use simpler language, break things into steps, and offer to clarify further. Ask if they'd like more examples.`
      break
    case 'excited':
      context += `\nIMPORTANT: The user is excited! Match their energy, be enthusiastic, and share in their excitement.`
      break
    case 'discouraged':
      context += `\nIMPORTANT: The user seems discouraged. Be encouraging, break the problem into smaller achievable steps, and remind them that this is doable.`
      break
    case 'urgent':
      context += `\nIMPORTANT: The user needs help quickly. Be direct, skip pleasantries, and provide the most essential information first.`
      break
  }

  context += `\n[END EMOTION DETECTION]\n`

  return context
}

/**
 * Quick emotion check - returns just the primary emotion
 * Useful for lightweight checks
 */
export function quickEmotionCheck(text: string): EmotionType {
  const analysis = analyzeEmotion(text)
  return analysis.primary.type
}

/**
 * Check if the message indicates user needs emotional support
 */
export function needsEmotionalSupport(text: string): boolean {
  const analysis = analyzeEmotion(text)
  const supportEmotions: EmotionType[] = ['frustrated', 'discouraged', 'sarcastic']
  return supportEmotions.includes(analysis.primary.type) && analysis.primary.confidence > 0.5
}
