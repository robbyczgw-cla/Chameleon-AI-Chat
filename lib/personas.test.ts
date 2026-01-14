import { describe, test, expect } from 'vitest'
import { PERSONAS } from './personas'

describe('Personas', () => {
  describe('PERSONAS array', () => {
    test('contains at least 18 personas', () => {
      expect(PERSONAS.length).toBeGreaterThanOrEqual(18)
    })

    test('all personas have required fields', () => {
      PERSONAS.forEach((persona) => {
        expect(persona.id).toBeDefined()
        expect(persona.id).toBeTruthy()
        expect(typeof persona.id).toBe('string')

        expect(persona.name).toBeDefined()
        expect(persona.name).toBeTruthy()
        expect(typeof persona.name).toBe('string')

        expect(persona.emoji).toBeDefined()
        expect(persona.emoji).toBeTruthy()
        expect(typeof persona.emoji).toBe('string')

        expect(persona.description).toBeDefined()
        expect(persona.description).toBeTruthy()
        expect(typeof persona.description).toBe('string')

        expect(persona.color).toBeDefined()
        expect(persona.color).toBeTruthy()
        expect(typeof persona.color).toBe('string')
      })
    })

    test('all persona IDs are unique', () => {
      const ids = PERSONAS.map((p) => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    test('all persona names are unique', () => {
      const names = PERSONAS.map((p) => p.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    test('all personas have either personality or prompt', () => {
      PERSONAS.forEach((persona) => {
        const hasPersonality = Boolean(persona.personality)
        const hasPrompt = Boolean(persona.prompt)
        expect(hasPersonality || hasPrompt).toBe(true)
      })
    })

    test('color values are valid Tailwind gradient classes', () => {
      PERSONAS.forEach((persona) => {
        // Should start with "from-" for gradient
        expect(persona.color).toMatch(/^from-/)
        // Should contain "to-" for gradient end
        expect(persona.color).toContain('to-')
      })
    })

    test('emojis are single characters or emoji sequences', () => {
      PERSONAS.forEach((persona) => {
        expect(persona.emoji.length).toBeGreaterThan(0)
        // ZWJ sequences (like 👨‍💼) can have string length > 10 due to UTF-16 encoding
        expect(persona.emoji.length).toBeLessThan(20)
      })
    })
  })

  describe('specific personas exist', () => {
    test('has Cami persona', () => {
      const cami = PERSONAS.find((p) => p.id === 'friendly')
      expect(cami).toBeDefined()
      expect(cami?.name).toBe('Cami')
      expect(cami?.emoji).toBe('🦎')
    })

    test('has Dev persona', () => {
      const dev = PERSONAS.find((p) => p.id === 'coder')
      expect(dev).toBeDefined()
      expect(dev?.name).toBe('Dev')
      expect(dev?.emoji).toBe('💻')
    })

    test('has Professor Stein persona', () => {
      const professor = PERSONAS.find((p) => p.id === 'expert')
      expect(professor).toBeDefined()
      expect(professor?.name).toBe('Professor Stein')
      expect(professor?.emoji).toBe('🎓')
    })

    test('has Luna persona', () => {
      const luna = PERSONAS.find((p) => p.id === 'creative')
      expect(luna).toBeDefined()
      expect(luna?.name).toBe('Luna')
      expect(luna?.emoji).toBe('🎨')
    })
  })

  describe('persona optional settings', () => {
    test('memory settings have correct structure when present', () => {
      const personasWithMemory = PERSONAS.filter((p) => p.memorySettings)

      personasWithMemory.forEach((persona) => {
        expect(typeof persona.memorySettings?.enabled).toBe('boolean')

        if (persona.memorySettings?.maxConversations !== undefined) {
          expect(typeof persona.memorySettings.maxConversations).toBe('number')
          expect(persona.memorySettings.maxConversations).toBeGreaterThan(0)
        }
      })
    })

    test('voice settings have correct structure when present', () => {
      const personasWithVoice = PERSONAS.filter((p) => p.voiceSettings)

      personasWithVoice.forEach((persona) => {
        expect(typeof persona.voiceSettings?.enabled).toBe('boolean')

        if (persona.voiceSettings?.rate !== undefined) {
          expect(typeof persona.voiceSettings.rate).toBe('number')
          expect(persona.voiceSettings.rate).toBeGreaterThanOrEqual(0.5)
          expect(persona.voiceSettings.rate).toBeLessThanOrEqual(2.0)
        }

        if (persona.voiceSettings?.pitch !== undefined) {
          expect(typeof persona.voiceSettings.pitch).toBe('number')
          expect(persona.voiceSettings.pitch).toBeGreaterThanOrEqual(0.5)
          expect(persona.voiceSettings.pitch).toBeLessThanOrEqual(2.0)
        }
      })
    })

    test('context settings have correct structure when present', () => {
      const personasWithContext = PERSONAS.filter((p) => p.contextSettings)

      personasWithContext.forEach((persona) => {
        expect(typeof persona.contextSettings?.enabled).toBe('boolean')

        if (persona.contextSettings?.useTimeBasedGreetings !== undefined) {
          expect(typeof persona.contextSettings.useTimeBasedGreetings).toBe('boolean')
        }

        if (persona.contextSettings?.detectMood !== undefined) {
          expect(typeof persona.contextSettings.detectMood).toBe('boolean')
        }

        if (persona.contextSettings?.trackTopics !== undefined) {
          expect(typeof persona.contextSettings.trackTopics).toBe('boolean')
        }
      })
    })
  })

  describe('persona content quality', () => {
    test('descriptions are not too short', () => {
      PERSONAS.forEach((persona) => {
        expect(persona.description.length).toBeGreaterThan(10)
      })
    })

    test('personality or prompt is substantial', () => {
      PERSONAS.forEach((persona) => {
        const text = persona.personality || persona.prompt || ''
        expect(text.length).toBeGreaterThan(20)
      })
    })
  })
})
