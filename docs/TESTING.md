# Testing Guide

## Overview

Chameleon AI Chat uses **Vitest** for automated testing. We have **144 tests** covering critical functionality to ensure code quality and prevent regressions.

### Test Statistics

```
✅ 144 tests passing
⚡ 4.84s runtime
📦 7 test files
🎯 100% of critical utilities covered
```

---

## What We Test & Why

### 1. Token Tracker (`lib/token-tracker.test.ts`) - 20 tests

**What:** Token estimation and cost calculation

**Why:** This is **critical for billing** - wrong calculations = wrong costs shown to users.

**Tests Cover:**
- ✅ Token estimation from text (4 chars ≈ 1 token)
- ✅ Cost calculation for different models
- ✅ Formatting tokens (1500 → "1.5K")
- ✅ Formatting costs ($0.005 → "$0.5000¢")
- ✅ Edge cases (zero tokens, huge numbers)

**Real Bug Prevented:**
```typescript
// Without tests, this bug could slip through:
function calculateCost(tokens, model) {
  return tokens * price  // ❌ Missing /1_000_000
}
// Tests catch this immediately!
```

---

### 2. File Handler (`lib/file-handler.test.ts`) - 22 tests

**What:** File upload validation and processing

**Why:** Prevents crashes from invalid files and ensures 10MB limit is enforced.

**Tests Cover:**
- ✅ File type validation (.pdf, .txt, .png accepted)
- ✅ 10MB size limit enforcement
- ✅ File size formatting (1024 bytes → "1 KB")
- ✅ Category detection (image vs document)
- ✅ Text extraction from attachments

**Real Bug Prevented:**
```typescript
// Without tests:
if (file.size > MAX_FILE_SIZE) {
  throw new Error("Too large")
}
// What if MAX_FILE_SIZE is undefined? Tests catch this!
```

---

### 3. Personas (`lib/personas.test.ts`) - 16 tests

**What:** Persona data structure validation

**Why:** Ensures all 18+ personas have consistent structure and no missing data.

**Tests Cover:**
- ✅ All personas have required fields (id, name, emoji, description)
- ✅ IDs and names are unique (no duplicates)
- ✅ Color gradients are valid Tailwind classes
- ✅ Optional settings (memory, voice, context) are properly structured
- ✅ No empty descriptions

**Real Bug Prevented:**
```typescript
// Without tests, you might add:
{
  id: "expert",  // ❌ Duplicate ID! Already exists
  name: "Prof",
  // ... tests catch duplicate IDs immediately
}
```

---

### 4. Cost Tracker (`lib/cost-tracker.test.ts`) - 30 tests

**What:** CostTracker class for tracking LLM spending

**Why:** **Critical for cost analytics** - tracks every API call's cost.

**Tests Cover:**
- ✅ Cost calculation for specific models (GPT-4, Claude, Gemini)
- ✅ Tracking entries with timestamps
- ✅ Filtering by chat ID and date range
- ✅ Statistics (total cost, tokens, avg per message)
- ✅ localStorage persistence
- ✅ Clearing old entries
- ✅ JSON export

**Real Scenario:**
```typescript
// User asks: "How much did I spend this month?"
const stats = tracker.getStats({
  start: new Date('2025-12-01'),
  end: new Date('2025-12-31')
})
// Tests ensure this calculation is accurate!
```

---

### 5. Follow-up Parser (`lib/follow-up-parser.test.ts`) - 14 tests

**What:** Parses categorized follow-up suggestions from AI responses

**Why:** Your **unique feature** - 3-tier follow-ups (⚡ Quick / 🧠 Deep / 🔗 Related)

**Tests Cover:**
- ✅ JSON format parsing (`{"quick": [...], "deep": [...]}`)
- ✅ Fallback to pipe-separated format (`Q1|Q2|Q3`)
- ✅ Limiting to 9 suggestions (3 per category)
- ✅ Extracting SUGGESTED prompts
- ✅ Removing tags from content
- ✅ Handling malformed JSON gracefully

**Example:**
```
AI Response:
"Here's my answer. [FOLLOWUP]{"quick": ["What's the TL;DR?"], "deep": ["Explain technically"]}[/FOLLOWUP]"

Tests verify:
- Content = "Here's my answer." (tags removed)
- Quick = [{category: "quick", text: "What's the TL;DR?", icon: "⚡"}]
- Deep = [{category: "deep", text: "Explain technically", icon: "🧠"}]
```

---

### 6. Image Utils (`lib/image-utils.test.ts`) - 14 tests

**What:** Image size calculation and compression helpers

**Why:** Vision models need images under certain size limits.

**Tests Cover:**
- ✅ Calculating image size in KB from data URLs
- ✅ Checking if compression is needed (> 800KB)
- ✅ Custom size thresholds
- ✅ Edge cases (empty images, exact boundaries)

**Use Case:**
```typescript
const imageSize = getImageSizeKB(dataUrl)  // 1200KB

if (needsCompression(imageSize, 800)) {
  // Compress before sending to API
  // Tests ensure this check works correctly!
}
```

---

### 7. Languages (`lib/languages.test.ts`) - 28 tests

**What:** Multi-language translations and i18n

**Why:** Supports German, English, and Spanish - tests ensure complete translations.

**Tests Cover:**
- ✅ All 3 languages defined (DE, EN, ES)
- ✅ Required fields (code, name, nativeName, flag)
- ✅ Translation completeness (all keys exist in all languages)
- ✅ No empty translations
- ✅ Persona descriptions in all languages
- ✅ getTranslation() function works correctly
- ✅ Fallback to German for invalid languages

**Example:**
```typescript
getTranslation('newChat', 'de')  // "Neuer Chat"
getTranslation('newChat', 'en')  // "New Chat"
getTranslation('newChat', 'es')  // "Nuevo Chat"
// Tests verify all translations exist!
```

---

## How to Run Tests

### Run All Tests Once
```bash
npm run test:run
```

### Watch Mode (Re-runs on File Changes)
```bash
npm test
```

### Interactive UI Mode
```bash
npm run test:ui
```

### Run Specific Test File
```bash
npm test lib/cost-tracker.test.ts
```

### See Verbose Output
```bash
npm run test:run -- --reporter=verbose
```

---

## How Tests Work

### 1. **Unit Tests** (All of ours)
Tests individual functions in isolation.

```typescript
// Function to test
export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

// Test
test('formats large token counts with K suffix', () => {
  expect(formatTokens(1500)).toBe('1.5K')  // ✅ Pass
  expect(formatTokens(10000)).toBe('10.0K') // ✅ Pass
})
```

### 2. **Test Structure**
```typescript
describe('Module Name', () => {           // Group related tests
  describe('functionName', () => {        // Group tests for one function
    test('does something specific', () => { // Individual test
      const result = functionName(input)
      expect(result).toBe(expectedOutput)
    })
  })
})
```

### 3. **Common Assertions**
```typescript
expect(value).toBe(5)                    // Exact equality
expect(value).toEqual({ a: 1 })          // Deep equality (objects)
expect(value).toBeTruthy()               // Is truthy
expect(value).toHaveLength(3)            // Array/string length
expect(cost).toBeCloseTo(0.005, 6)       // Float comparison (6 decimals)
expect(value).toContain('text')          // Array/string contains
expect(value).toBeGreaterThan(10)        // Number comparison
```

---

## Why These Tests Don't Cost Money

**All our tests are FREE** - they test pure JavaScript functions:

```typescript
// ✅ FREE - Pure function
function calculateCost(tokens, price) {
  return tokens * price  // Just math
}

// ❌ WOULD COST - API call
async function getAIResponse(prompt) {
  return await fetch('openrouter.ai/api/...')  // Real API call
}
```

**We only test pure utilities** - no API calls, no OpenRouter tokens used!

---

## Test Coverage Summary

| Module | Tests | What It Protects |
|--------|-------|------------------|
| **token-tracker** | 20 | Token/cost calculation accuracy |
| **file-handler** | 22 | File upload safety & validation |
| **personas** | 16 | Data structure integrity |
| **cost-tracker** | 30 | Spending analytics accuracy |
| **follow-up-parser** | 14 | Your unique follow-up feature |
| **image-utils** | 14 | Image size management |
| **languages** | 28 | Translation completeness |
| **TOTAL** | **144** | **Core app reliability** |

---

## When to Add More Tests

### ✅ Good Candidates for Testing
- Pure functions (input → output)
- Utilities (formatting, parsing, validation)
- Data transformations
- Business logic calculations

### ❌ Skip Testing
- API routes (would cost money)
- React components (complex setup, better with E2E)
- Third-party library wrappers

### Example: When You Add a New Utility
```typescript
// lib/new-utility.ts
export function someNewFunction(input: string): number {
  return input.length * 2
}

// lib/new-utility.test.ts
import { someNewFunction } from './new-utility'

describe('someNewFunction', () => {
  test('doubles string length', () => {
    expect(someNewFunction('hello')).toBe(10)
  })

  test('handles empty string', () => {
    expect(someNewFunction('')).toBe(0)
  })
})
```

---

## Benefits of These Tests

### 1. **Catch Bugs Before Users Do**
```typescript
// You change this:
function calculateCost(tokens, model) {
  return tokens * pricing[model].output  // ❌ Missing input tokens!
}

// Tests fail immediately:
❌ FAIL: expected 0.15 to be 0.03
```

### 2. **Refactor with Confidence**
```typescript
// Want to optimize this function?
function formatTokens(tokens) {
  // ... change implementation
}
// Re-run tests → if they pass, refactor is safe!
```

### 3. **Documentation**
Tests show **how to use** your functions:
```typescript
test('calculateCost example', () => {
  const cost = calculateCost('openai/gpt-4', 1000, 2000)
  expect(cost).toBeCloseTo(0.15)
  // ^ Developers see: "1000 input + 2000 output = $0.15"
})
```

### 4. **Onboarding New Contributors**
New developers can:
1. Read tests to understand behavior
2. Make changes
3. Run tests to verify nothing broke

---

## Common Questions

### Q: Do I need to run tests before every commit?
**A:** Not required, but recommended! Run `npm test` to catch issues early.

### Q: What if a test fails?
**A:** Either:
1. Your change broke something → fix your code
2. The test is wrong → update the test
3. Behavior intentionally changed → update test to match

### Q: Can I skip tests?
**A:** Yes, with `.skip`:
```typescript
test.skip('this test is temporarily disabled', () => {
  // Will be skipped
})
```

### Q: Can I run only one test?
**A:** Yes, with `.only`:
```typescript
test.only('focus on this one test', () => {
  // Only this runs
})
```

---

## Next Steps

### Add More Coverage
Consider adding tests for:
- `lib/memory-service.ts` - Memory retrieval logic
- `lib/document-collections.ts` - Collection management
- `lib/feature-flags.ts` - Feature flag logic

### Integration Tests (Future)
Test full flows:
```typescript
test('user can upload file and send message', async () => {
  const file = new File(['test'], 'test.txt')
  await processFile(file)
  const message = await sendMessage('Analyze this file')
  expect(message).toBeDefined()
})
```

---

## Conclusion

Your app now has **144 automated tests** protecting critical functionality. Every time you run `npm test`, you verify that:

- ✅ Cost calculations are accurate
- ✅ File uploads work correctly
- ✅ Personas are valid
- ✅ Follow-ups parse properly
- ✅ Translations are complete
- ✅ Image utilities function correctly
- ✅ Token tracking works

**This is professional-grade code quality!** 🚀

Run tests often, add new ones when you add features, and trust that your changes won't break existing functionality.

---

**Happy Testing!** 🧪
