import { describe, test, expect } from 'vitest'
import { parseFollowUps } from './follow-up-parser'

describe('Follow-up Parser', () => {
  describe('parseFollowUps', () => {
    test('extracts categorized follow-ups in JSON format', () => {
      const content = `Here is my answer.
[FOLLOWUP]{
  "quick": ["What's the summary?", "Can you clarify?"],
  "deep": ["Explain the technical details", "What are the edge cases?"],
  "related": ["How does this compare to X?", "What about Y?"]
}[/FOLLOWUP]`

      const result = parseFollowUps(content)

      expect(result.content).toBe('Here is my answer.')
      expect(result.categorizedFollowUps).toHaveLength(6)

      // Check quick category
      const quick = result.categorizedFollowUps.filter((f) => f.category === 'quick')
      expect(quick).toHaveLength(2)
      expect(quick[0].text).toBe("What's the summary?")
      expect(quick[0].icon).toBe('⚡')
      expect(quick[0].label).toBe('Schnell')

      // Check deep category
      const deep = result.categorizedFollowUps.filter((f) => f.category === 'deep')
      expect(deep).toHaveLength(2)
      expect(deep[0].text).toBe('Explain the technical details')
      expect(deep[0].icon).toBe('🧠')

      // Check related category
      const related = result.categorizedFollowUps.filter((f) => f.category === 'related')
      expect(related).toHaveLength(2)
      expect(related[0].icon).toBe('🔗')
    })

    test('extracts old pipe-separated format as fallback', () => {
      const content = `Answer here.
[FOLLOWUP]Question 1?|Question 2?|Question 3?[/FOLLOWUP]`

      const result = parseFollowUps(content)

      expect(result.content).toBe('Answer here.')
      expect(result.followUps).toHaveLength(3)
      expect(result.followUps[0]).toBe('Question 1?')
      expect(result.followUps[1]).toBe('Question 2?')
    })

    test('limits follow-ups to 3 in old format', () => {
      const content = `Answer.
[FOLLOWUP]Q1|Q2|Q3|Q4|Q5[/FOLLOWUP]`

      const result = parseFollowUps(content)

      expect(result.followUps).toHaveLength(3)
      expect(result.followUps).toEqual(['Q1', 'Q2', 'Q3'])
    })

    test('limits categorized follow-ups to 9', () => {
      const content = `Answer.
[FOLLOWUP]{
  "quick": ["Q1", "Q2", "Q3", "Q4"],
  "deep": ["D1", "D2", "D3", "D4"],
  "related": ["R1", "R2", "R3", "R4"]
}[/FOLLOWUP]`

      const result = parseFollowUps(content)

      expect(result.categorizedFollowUps).toHaveLength(9)
    })

    test('extracts suggested prompts from SUGGESTED tags', () => {
      const content = `Answer here.
[SUGGESTED]Tell me more|Explain further|Give examples[/SUGGESTED]`

      const result = parseFollowUps(content)

      expect(result.content).toBe('Answer here.')
      expect(result.suggestedPrompts).toHaveLength(3)
      expect(result.suggestedPrompts[0]).toBe('Tell me more')
      expect(result.suggestedPrompts[1]).toBe('Explain further')
    })

    test('limits suggested prompts to 3', () => {
      const content = `Answer.
[SUGGESTED]S1|S2|S3|S4|S5[/SUGGESTED]`

      const result = parseFollowUps(content)

      expect(result.suggestedPrompts).toHaveLength(3)
    })

    test('handles content with both FOLLOWUP and SUGGESTED', () => {
      const content = `My answer here.
[FOLLOWUP]{
  "quick": ["Quick question?"],
  "deep": ["Deep question?"]
}[/FOLLOWUP]
[SUGGESTED]Suggested prompt 1|Suggested prompt 2[/SUGGESTED]`

      const result = parseFollowUps(content)

      expect(result.content).toBe('My answer here.')
      expect(result.categorizedFollowUps).toHaveLength(2)
      expect(result.suggestedPrompts).toHaveLength(2)
    })

    test('handles content with no tags', () => {
      const content = 'Just a regular answer without any tags.'

      const result = parseFollowUps(content)

      expect(result.content).toBe('Just a regular answer without any tags.')
      expect(result.followUps).toHaveLength(0)
      expect(result.categorizedFollowUps).toHaveLength(0)
      expect(result.suggestedPrompts).toHaveLength(0)
    })

    test('trims whitespace from suggestions', () => {
      const content = `Answer.
[FOLLOWUP]  Question 1?  |   Question 2?   [/FOLLOWUP]`

      const result = parseFollowUps(content)

      expect(result.followUps[0]).toBe('Question 1?')
      expect(result.followUps[1]).toBe('Question 2?')
    })

    test('filters out empty suggestions', () => {
      const content = `Answer.
[FOLLOWUP]Q1||Q2|  |Q3[/FOLLOWUP]`

      const result = parseFollowUps(content)

      expect(result.followUps).toHaveLength(3)
      expect(result.followUps).toEqual(['Q1', 'Q2', 'Q3'])
    })

    test('handles malformed JSON gracefully', () => {
      const content = `Answer.
[FOLLOWUP]{not valid json}[/FOLLOWUP]`

      const result = parseFollowUps(content)

      // Should fallback to pipe-separated parsing
      expect(result.content).toBe('Answer.')
      expect(result.followUps).toHaveLength(1)
      expect(result.followUps[0]).toBe('{not valid json}')
    })

    test('handles multiple FOLLOWUP blocks', () => {
      const content = `Answer.
[FOLLOWUP]Q1|Q2[/FOLLOWUP]
More content.
[FOLLOWUP]Q3|Q4[/FOLLOWUP]`

      const result = parseFollowUps(content)

      expect(result.content.replace(/\s+/g, ' ').trim()).toBe('Answer. More content.')
      expect(result.followUps.length).toBeGreaterThanOrEqual(3) // At least 3
      expect(result.followUps).toContain('Q1')
      expect(result.followUps).toContain('Q2')
    })

    test('removes tags from content completely', () => {
      const content = `Before tag.
[FOLLOWUP]Q1|Q2[/FOLLOWUP]
After tag.`

      const result = parseFollowUps(content)

      expect(result.content.replace(/\s+/g, ' ').trim()).toBe('Before tag. After tag.')
      expect(result.content).not.toContain('[FOLLOWUP]')
      expect(result.content).not.toContain('[/FOLLOWUP]')
    })

    test('handles categorized format with only some categories', () => {
      const content = `Answer.
[FOLLOWUP]{
  "quick": ["Quick 1", "Quick 2"],
  "deep": ["Deep 1"]
}[/FOLLOWUP]`

      const result = parseFollowUps(content)

      expect(result.categorizedFollowUps).toHaveLength(3)
      const quick = result.categorizedFollowUps.filter((f) => f.category === 'quick')
      const deep = result.categorizedFollowUps.filter((f) => f.category === 'deep')
      expect(quick).toHaveLength(2)
      expect(deep).toHaveLength(1)
    })
  })
})
