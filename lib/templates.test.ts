import { describe, test, expect } from 'vitest'
import {
  CONVERSATION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  getTemplateById
} from './templates'

describe('CONVERSATION_TEMPLATES', () => {
  test('all templates have required fields', () => {
    for (const template of CONVERSATION_TEMPLATES) {
      expect(template.id).toBeTruthy()
      expect(template.title).toBeTruthy()
      expect(template.emoji).toBeTruthy()
      expect(template.description).toBeTruthy()
      expect(template.category).toBeTruthy()
      expect(template.personaId).toBeTruthy()
      expect(template.initialPrompt).toBeTruthy()
    }
  })

  test('all template IDs are unique', () => {
    const ids = CONVERSATION_TEMPLATES.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  test('all templates have valid categories', () => {
    const validCategories = ['creative', 'coding', 'learning', 'productivity', 'fun']
    for (const template of CONVERSATION_TEMPLATES) {
      expect(validCategories).toContain(template.category)
    }
  })

  test('contains expected template categories', () => {
    const categories = new Set(CONVERSATION_TEMPLATES.map(t => t.category))
    expect(categories.has('creative')).toBe(true)
    expect(categories.has('coding')).toBe(true)
    expect(categories.has('learning')).toBe(true)
    expect(categories.has('productivity')).toBe(true)
    expect(categories.has('fun')).toBe(true)
  })

  test('emojis are valid emoji characters or strings', () => {
    for (const template of CONVERSATION_TEMPLATES) {
      // Basic check that emoji is a non-empty string
      expect(template.emoji.length).toBeGreaterThan(0)
    }
  })

  test('initial prompts are meaningful (not too short)', () => {
    for (const template of CONVERSATION_TEMPLATES) {
      expect(template.initialPrompt.length).toBeGreaterThan(50)
    }
  })
})

describe('TEMPLATE_CATEGORIES', () => {
  test('has expected categories', () => {
    const categoryIds = TEMPLATE_CATEGORIES.map(c => c.id)
    expect(categoryIds).toContain('creative')
    expect(categoryIds).toContain('coding')
    expect(categoryIds).toContain('learning')
    expect(categoryIds).toContain('productivity')
    expect(categoryIds).toContain('fun')
  })

  test('all categories have labels and emojis', () => {
    for (const category of TEMPLATE_CATEGORIES) {
      expect(category.id).toBeTruthy()
      expect(category.label).toBeTruthy()
      expect(category.emoji).toBeTruthy()
    }
  })

  test('category IDs match template categories', () => {
    const categoryIds = new Set(TEMPLATE_CATEGORIES.map(c => c.id))
    const templateCategories = new Set(CONVERSATION_TEMPLATES.map(t => t.category))

    for (const cat of templateCategories) {
      expect(categoryIds.has(cat)).toBe(true)
    }
  })
})

describe('getTemplatesByCategory', () => {
  test('returns templates for creative category', () => {
    const templates = getTemplatesByCategory('creative')
    expect(templates.length).toBeGreaterThan(0)
    expect(templates.every(t => t.category === 'creative')).toBe(true)
  })

  test('returns templates for coding category', () => {
    const templates = getTemplatesByCategory('coding')
    expect(templates.length).toBeGreaterThan(0)
    expect(templates.every(t => t.category === 'coding')).toBe(true)
  })

  test('returns templates for learning category', () => {
    const templates = getTemplatesByCategory('learning')
    expect(templates.length).toBeGreaterThan(0)
    expect(templates.every(t => t.category === 'learning')).toBe(true)
  })

  test('returns templates for productivity category', () => {
    const templates = getTemplatesByCategory('productivity')
    expect(templates.length).toBeGreaterThan(0)
    expect(templates.every(t => t.category === 'productivity')).toBe(true)
  })

  test('returns templates for fun category', () => {
    const templates = getTemplatesByCategory('fun')
    expect(templates.length).toBeGreaterThan(0)
    expect(templates.every(t => t.category === 'fun')).toBe(true)
  })

  test('returns empty array for invalid category', () => {
    // @ts-expect-error - testing invalid input
    const templates = getTemplatesByCategory('invalid')
    expect(templates).toEqual([])
  })
})

describe('getTemplateById', () => {
  test('returns template by ID', () => {
    const template = getTemplateById('brainstorm-startup')
    expect(template).toBeDefined()
    expect(template?.id).toBe('brainstorm-startup')
    expect(template?.title).toBe('Startup Idea Brainstorm')
  })

  test('returns code-review template', () => {
    const template = getTemplateById('code-review')
    expect(template).toBeDefined()
    expect(template?.category).toBe('coding')
  })

  test('returns eli5-topic template', () => {
    const template = getTemplateById('eli5-topic')
    expect(template).toBeDefined()
    expect(template?.category).toBe('learning')
  })

  test('returns undefined for non-existent ID', () => {
    const template = getTemplateById('non-existent-template')
    expect(template).toBeUndefined()
  })

  test('returns undefined for empty string', () => {
    const template = getTemplateById('')
    expect(template).toBeUndefined()
  })
})

describe('specific templates', () => {
  test('brainstorm-startup template has follow-up suggestions', () => {
    const template = getTemplateById('brainstorm-startup')
    expect(template?.followUpSuggestions).toBeDefined()
    expect(template?.followUpSuggestions?.length).toBeGreaterThan(0)
  })

  test('code-review template has follow-up suggestions', () => {
    const template = getTemplateById('code-review')
    expect(template?.followUpSuggestions).toBeDefined()
  })

  test('debug-session template exists and is coding category', () => {
    const template = getTemplateById('debug-session')
    expect(template).toBeDefined()
    expect(template?.category).toBe('coding')
    expect(template?.personaId).toBe('coder')
  })

  test('philosophy-debate template uses correct persona', () => {
    const template = getTemplateById('philosophy-debate')
    expect(template).toBeDefined()
    expect(template?.personaId).toBe('cogito')
  })

  test('cosmic-perspective template uses nihilo persona', () => {
    const template = getTemplateById('cosmic-perspective')
    expect(template).toBeDefined()
    expect(template?.personaId).toBe('nihilo')
  })
})
