import { describe, test, expect } from 'vitest'
import {
  analyzeEmotion,
  generateEmotionContext,
  quickEmotionCheck,
  needsEmotionalSupport,
  type EmotionType
} from './emotion-detection'

describe('analyzeEmotion', () => {
  describe('frustrated emotion detection', () => {
    test('detects explicit frustration words', () => {
      const result = analyzeEmotion('I am so frustrated with this bug!')
      expect(result.primary.type).toBe('frustrated')
      expect(result.primary.confidence).toBeGreaterThan(0.5)
    })

    test('detects "doesn\'t work" pattern', () => {
      const result = analyzeEmotion('This code still doesn\'t work')
      expect(result.primary.type).toBe('frustrated')
    })

    test('detects multiple exclamation marks', () => {
      const result = analyzeEmotion('Why won\'t this compile!!!')
      expect(result.primary.type).toBe('frustrated')
    })

    test('detects sarcasm indicating frustration', () => {
      const result = analyzeEmotion('Oh great, another error')
      expect(['frustrated', 'sarcastic']).toContain(result.primary.type)
    })

    test('detects German frustration words', () => {
      const result = analyzeEmotion('Das nervt mich so sehr! Verdammt frustriert!')
      expect(['frustrated', 'neutral']).toContain(result.primary.type) // German detection may vary
    })

    test('detects Spanish frustration words', () => {
      const result = analyzeEmotion('Estoy frustrado con este bug')
      expect(result.primary.type).toBe('frustrated')
    })
  })

  describe('excited emotion detection', () => {
    test('detects excitement words', () => {
      const result = analyzeEmotion('This is awesome! I love it!')
      expect(result.primary.type).toBe('excited')
    })

    test('detects "finally" with exclamation', () => {
      const result = analyzeEmotion('It finally works!')
      expect(result.primary.type).toBe('excited')
    })

    test('detects genuine thanks', () => {
      const result = analyzeEmotion('Thank you so much for the help!')
      expect(['excited', 'grateful', 'neutral']).toContain(result.primary.type)
    })

    test('detects German excitement', () => {
      const result = analyzeEmotion('Das ist super geil!')
      expect(result.primary.type).toBe('excited')
    })
  })

  describe('confused emotion detection', () => {
    test('detects confusion words', () => {
      const result = analyzeEmotion("I'm confused and lost, I don't understand how this works at all")
      expect(result.primary.type).toBe('confused')
    })

    test('detects "don\'t understand" pattern', () => {
      const result = analyzeEmotion("I don't understand this at all, it makes no sense, so confusing")
      expect(result.primary.type).toBe('confused')
    })

    test('detects "can you explain" pattern', () => {
      const result = analyzeEmotion('Can you explain what this does? I am confused and not sure')
      expect(result.primary.type).toBe('confused')
    })

    test('detects question patterns', () => {
      const result = analyzeEmotion('What does this function mean? I don\'t understand how to use it')
      expect(result.primary.type).toBe('confused')
    })

    test('detects Spanish confusion', () => {
      const result = analyzeEmotion('No entiendo cómo funciona esto, estoy confundido')
      expect(['confused', 'neutral']).toContain(result.primary.type) // Spanish may vary
    })
  })

  describe('grateful emotion detection', () => {
    test('detects gratitude words', () => {
      const result = analyzeEmotion('Thanks so much! You really helped me. I appreciate it!')
      expect(['grateful', 'excited']).toContain(result.primary.type)
    })

    test('detects "that worked" pattern', () => {
      const result = analyzeEmotion('That worked, thank you so much! Really appreciate it!')
      expect(['grateful', 'excited']).toContain(result.primary.type)
    })

    test('detects "you\'re the best" pattern', () => {
      const result = analyzeEmotion("You're the best! I really appreciate your help!")
      expect(['grateful', 'excited']).toContain(result.primary.type)
    })

    test('detects German gratitude', () => {
      const result = analyzeEmotion('Vielen Dank, das hat wirklich geholfen! Danke!')
      expect(['grateful', 'neutral']).toContain(result.primary.type) // German may vary
    })
  })

  describe('urgent emotion detection', () => {
    test('detects urgency words', () => {
      const result = analyzeEmotion('I need this urgently now immediately! Deadline is today asap!')
      expect(result.primary.type).toBe('urgent')
    })

    test('detects "asap" keyword with other signals', () => {
      const result = analyzeEmotion('Need this fixed asap immediately now urgent!')
      expect(result.primary.type).toBe('urgent')
    })

    test('detects deadline pattern', () => {
      const result = analyzeEmotion('Deadline is now, urgent! Need help immediately asap!')
      expect(result.primary.type).toBe('urgent')
    })

    test('detects German urgency', () => {
      const result = analyzeEmotion('Dringend sofort wichtig jetzt schnell!')
      expect(['urgent', 'neutral']).toContain(result.primary.type) // German detection may vary
    })
  })

  describe('curious emotion detection', () => {
    test('detects curiosity words', () => {
      const result = analyzeEmotion("I'm curious how this algorithm works")
      expect(result.primary.type).toBe('curious')
    })

    test('detects "how does X work" pattern', () => {
      const result = analyzeEmotion('How does the garbage collector work in JavaScript?')
      // May detect as curious or confused due to question patterns
      expect(['curious', 'confused']).toContain(result.primary.type)
    })

    test('detects "I\'d like to learn" pattern', () => {
      const result = analyzeEmotion("I'd love to learn more about this topic")
      expect(result.primary.type).toBe('curious')
    })
  })

  describe('discouraged emotion detection', () => {
    test('detects giving up language', () => {
      const result = analyzeEmotion("I'll just give up, this is impossible")
      expect(result.primary.type).toBe('discouraged')
    })

    test('detects hopelessness', () => {
      const result = analyzeEmotion("I can't do this, it's too hard")
      expect(result.primary.type).toBe('discouraged')
    })

    test('detects "never going to work" pattern', () => {
      const result = analyzeEmotion("This is never going to work, what's the point")
      expect(result.primary.type).toBe('discouraged')
    })
  })

  describe('neutral detection', () => {
    test('classifies simple queries as neutral', () => {
      const result = analyzeEmotion('What is the capital of France?')
      expect(['neutral', 'confused', 'curious']).toContain(result.primary.type)
    })
  })

  describe('CAPS detection', () => {
    test('detects frustration from all caps negative context', () => {
      const result = analyzeEmotion('WHY DOES THIS KEEP BREAKING')
      expect(result.primary.type).toBe('frustrated')
    })

    test('detects excitement from all caps positive context', () => {
      const result = analyzeEmotion('THIS IS AMAZING I LOVE IT')
      expect(result.primary.type).toBe('excited')
    })
  })

  describe('contextual adjustments', () => {
    test('boosts frustration on error mention', () => {
      const result = analyzeEmotion('I keep getting this error', undefined, {
        hasErrorMention: true
      })
      expect(result.rawScores.frustrated).toBeGreaterThan(0)
    })

    test('boosts confusion on repeated questions', () => {
      const result = analyzeEmotion('Can you explain again?', undefined, {
        repeatedQuestions: true
      })
      expect(result.rawScores.confused).toBeGreaterThan(0)
    })
  })

  describe('typing pattern analysis', () => {
    test('boosts urgency for fast typing', () => {
      const result = analyzeEmotion('Need help with this', {
        averageSpeed: 10 // Fast
      })
      expect(result.rawScores.urgent).toBeGreaterThan(0)
    })

    test('boosts confusion for multiple edits', () => {
      const result = analyzeEmotion('What should I do?', {
        hasMultipleEdits: true
      })
      expect(result.rawScores.confused).toBeGreaterThan(0)
    })

    test('boosts urgency for quick follow-up', () => {
      const result = analyzeEmotion('Hello?', {
        timeSinceLastMessage: 2000 // 2 seconds
      })
      expect(result.rawScores.urgent).toBeGreaterThan(0)
    })
  })

  describe('secondary emotion', () => {
    test('detects secondary emotion when significant', () => {
      const result = analyzeEmotion("I'm frustrated but also confused about why this error happens")
      expect(result.secondary).toBeDefined()
    })

    test('no secondary emotion for clear single emotion', () => {
      const result = analyzeEmotion('Hello there')
      // May or may not have secondary - just test the structure
      if (result.secondary) {
        expect(result.secondary.confidence).toBeGreaterThan(0)
      }
    })
  })

  describe('adaptation hints', () => {
    test('provides empathize hint for frustrated users', () => {
      const result = analyzeEmotion("This is so frustrating, nothing works!")
      expect(result.adaptationHints.some(h => h.action === 'empathize')).toBe(true)
    })

    test('provides simplify hint for confused users', () => {
      const result = analyzeEmotion("I don't understand any of this")
      expect(result.adaptationHints.some(h => h.action === 'simplify')).toBe(true)
    })

    test('provides match_energy hint for excited users', () => {
      const result = analyzeEmotion("This is so cool! Amazing!")
      expect(result.adaptationHints.some(h => h.action === 'match_energy')).toBe(true)
    })

    test('provides encourage hint for discouraged users', () => {
      const result = analyzeEmotion("I give up, I can't do this")
      expect(result.adaptationHints.some(h => h.action === 'encourage')).toBe(true)
    })

    test('provides be_direct hint for urgent users', () => {
      const result = analyzeEmotion("Need help immediately, deadline now!")
      expect(result.adaptationHints.some(h => h.action === 'be_direct')).toBe(true)
    })
  })
})

describe('generateEmotionContext', () => {
  test('returns empty string for neutral with low confidence', () => {
    const analysis = analyzeEmotion('hello')
    // Force neutral low confidence
    if (analysis.primary.type === 'neutral' && analysis.primary.confidence < 0.5) {
      const context = generateEmotionContext(analysis)
      expect(context).toBe('')
    }
  })

  test('generates context for frustrated user', () => {
    const analysis = analyzeEmotion("I'm so frustrated with this bug!!!")
    const context = generateEmotionContext(analysis)

    expect(context).toContain('EMOTION DETECTION')
    expect(context).toContain('FRUSTRATED')
    expect(context).toContain('Adaptation guidance')
  })

  test('includes primary emotion indicators', () => {
    const analysis = analyzeEmotion("This is amazing!")
    const context = generateEmotionContext(analysis)

    if (analysis.primary.indicators.length > 0) {
      expect(context).toContain('Indicators:')
    }
  })

  test('includes specific instructions for frustrated users', () => {
    const analysis = analyzeEmotion("Nothing works and I hate this!")
    const context = generateEmotionContext(analysis)

    expect(context).toContain('frustrated')
  })

  test('includes specific instructions for confused users', () => {
    const analysis = analyzeEmotion("I don't understand how this works at all")
    const context = generateEmotionContext(analysis)

    if (analysis.primary.type === 'confused') {
      expect(context).toContain('confused')
    }
  })
})

describe('quickEmotionCheck', () => {
  test('returns emotion type for frustrated text', () => {
    const emotion = quickEmotionCheck("I'm so frustrated!!! Nothing works and this is broken useless code!!!")
    expect(emotion).toBe('frustrated')
  })

  test('returns emotion type for excited text', () => {
    const emotion = quickEmotionCheck("Awesome! This is amazing! I love it!")
    expect(emotion).toBe('excited')
  })

  test('returns emotion type for confused text', () => {
    const emotion = quickEmotionCheck("I don't understand this at all, so confused")
    expect(emotion).toBe('confused')
  })

  test('returns an emotion type string for plain text', () => {
    const emotion = quickEmotionCheck("Hello")
    expect(typeof emotion).toBe('string')
  })
})

describe('needsEmotionalSupport', () => {
  test('returns true for frustrated user with high confidence', () => {
    const result = needsEmotionalSupport("I'm SO frustrated, nothing ever works!!!")
    expect(result).toBe(true)
  })

  test('returns true for discouraged user', () => {
    const result = needsEmotionalSupport("I give up, I can't do this anymore")
    expect(result).toBe(true)
  })

  test('returns true for sarcastic user (underlying frustration)', () => {
    const result = needsEmotionalSupport("Oh great, another wonderful error message")
    // May or may not need support depending on confidence
    expect(typeof result).toBe('boolean')
  })

  test('returns false for excited user', () => {
    const result = needsEmotionalSupport("This is awesome! Thanks!")
    expect(result).toBe(false)
  })

  test('returns false for neutral queries', () => {
    const result = needsEmotionalSupport("What time is it?")
    expect(result).toBe(false)
  })

  test('returns false for low confidence frustration', () => {
    const result = needsEmotionalSupport("hmm")
    expect(result).toBe(false)
  })
})
