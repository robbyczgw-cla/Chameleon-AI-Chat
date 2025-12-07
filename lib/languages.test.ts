import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  languageService,
  translations,
  getTranslation,
  getPersonaDescription,
} from './languages'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('Languages', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('LANGUAGES array', () => {
    test('contains German, English, and Spanish', () => {
      expect(LANGUAGES).toHaveLength(3)

      const codes = LANGUAGES.map((l) => l.code)
      expect(codes).toContain('de')
      expect(codes).toContain('en')
      expect(codes).toContain('es')
    })

    test('all languages have required fields', () => {
      LANGUAGES.forEach((lang) => {
        expect(lang.code).toBeDefined()
        expect(lang.name).toBeDefined()
        expect(lang.nativeName).toBeDefined()
        expect(lang.flag).toBeDefined()

        expect(typeof lang.code).toBe('string')
        expect(typeof lang.name).toBe('string')
        expect(typeof lang.nativeName).toBe('string')
        expect(typeof lang.flag).toBe('string')
      })
    })

    test('German language is correctly defined', () => {
      const german = LANGUAGES.find((l) => l.code === 'de')
      expect(german).toBeDefined()
      expect(german?.name).toBe('German')
      expect(german?.nativeName).toBe('Deutsch')
      expect(german?.flag).toBe('🇩🇪')
    })

    test('English language is correctly defined', () => {
      const english = LANGUAGES.find((l) => l.code === 'en')
      expect(english).toBeDefined()
      expect(english?.name).toBe('English')
      expect(english?.nativeName).toBe('English')
      expect(english?.flag).toBe('🇬🇧')
    })

    test('Spanish language is correctly defined', () => {
      const spanish = LANGUAGES.find((l) => l.code === 'es')
      expect(spanish).toBeDefined()
      expect(spanish?.name).toBe('Spanish')
      expect(spanish?.nativeName).toBe('Español')
      expect(spanish?.flag).toBe('🇪🇸')
    })

    test('all language codes are unique', () => {
      const codes = LANGUAGES.map((l) => l.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })
  })

  describe('DEFAULT_LANGUAGE', () => {
    test('is set to English', () => {
      expect(DEFAULT_LANGUAGE).toBe('en')
    })
  })

  describe('languageService.getLanguageByCode', () => {
    test('returns language for valid code', () => {
      const german = languageService.getLanguageByCode('de')
      expect(german).toBeDefined()
      expect(german?.name).toBe('German')
    })

    test('returns undefined for invalid code', () => {
      const invalid = languageService.getLanguageByCode('invalid')
      expect(invalid).toBeUndefined()
    })
  })

  describe('translations', () => {
    test('all three languages have translations', () => {
      expect(translations.de).toBeDefined()
      expect(translations.en).toBeDefined()
      expect(translations.es).toBeDefined()
    })

    test('German translations are complete', () => {
      expect(translations.de.welcomeTitle).toBe('Hey! Ich bin dein')
      expect(translations.de.newChat).toBe('Neuer Chat')
      expect(translations.de.settings).toBe('Einstellungen')
    })

    test('English translations are complete', () => {
      expect(translations.en.welcomeTitle).toBe('Hey! I\'m your')
      expect(translations.en.newChat).toBe('New Chat')
      expect(translations.en.settings).toBe('Settings')
    })

    test('Spanish translations are complete', () => {
      expect(translations.es.welcomeTitle).toBe('¡Hola! Soy tu')
      expect(translations.es.newChat).toBe('Nuevo Chat')
      expect(translations.es.settings).toBe('Configuración')
    })

    test('all languages have same translation keys', () => {
      const deKeys = Object.keys(translations.de).sort()
      const enKeys = Object.keys(translations.en).sort()
      const esKeys = Object.keys(translations.es).sort()

      expect(deKeys).toEqual(enKeys)
      expect(enKeys).toEqual(esKeys)
    })

    test('contains persona descriptions for all personas', () => {
      const personaKeys = Object.keys(translations.de).filter((k) =>
        k.startsWith('persona_')
      )
      expect(personaKeys.length).toBeGreaterThan(10)

      // Check a few specific personas exist
      expect(translations.de.persona_friendly_desc).toBeDefined()
      expect(translations.de.persona_expert_desc).toBeDefined()
      expect(translations.de.persona_coder_desc).toBeDefined()
    })
  })

  describe('getTranslation', () => {
    test('returns German translation when language is de', () => {
      const text = getTranslation('newChat', 'de')
      expect(text).toBe('Neuer Chat')
    })

    test('returns English translation when language is en', () => {
      const text = getTranslation('newChat', 'en')
      expect(text).toBe('New Chat')
    })

    test('returns Spanish translation when language is es', () => {
      const text = getTranslation('newChat', 'es')
      expect(text).toBe('Nuevo Chat')
    })

    test('falls back to German for invalid language code', () => {
      const text = getTranslation('newChat', 'invalid')
      expect(text).toBe('Neuer Chat') // German fallback
    })

    test('uses languageService.getLanguage when no code provided', () => {
      localStorage.setItem('app-language', 'es')
      const text = getTranslation('newChat')
      expect(text).toBe('Nuevo Chat')
    })
  })

  describe('getPersonaDescription', () => {
    test('returns German description for friendly persona', () => {
      const desc = getPersonaDescription('friendly', 'de')
      expect(desc).toBe('Anpassungsfähiges, freundliches Chamäleon')
    })

    test('returns English description for expert persona', () => {
      const desc = getPersonaDescription('expert', 'en')
      expect(desc).toBe('Detailed knowledge on any topic')
    })

    test('returns Spanish description for coder persona', () => {
      const desc = getPersonaDescription('coder', 'es')
      expect(desc).toBe('Tu compañero de programación')
    })

    test('uses current language when no code provided', () => {
      localStorage.setItem('app-language', 'en')
      const desc = getPersonaDescription('creative')
      expect(desc).toBe('Brainstorming and creative ideas')
    })

    test('handles all documented personas', () => {
      const personas = ['friendly', 'expert', 'creative', 'coder', 'concise']

      personas.forEach((persona) => {
        const desc = getPersonaDescription(persona, 'en')
        expect(desc).toBeDefined()
        expect(desc.length).toBeGreaterThan(0)
      })
    })
  })

  describe('translation completeness', () => {
    test('no empty translations in German', () => {
      Object.values(translations.de).forEach((value) => {
        expect(value.length).toBeGreaterThan(0)
      })
    })

    test('no empty translations in English', () => {
      Object.values(translations.en).forEach((value) => {
        expect(value.length).toBeGreaterThan(0)
      })
    })

    test('no empty translations in Spanish', () => {
      Object.values(translations.es).forEach((value) => {
        expect(value.length).toBeGreaterThan(0)
      })
    })
  })
})
