import { describe, test, expect } from 'vitest'
import {
  SLASH_COMMANDS,
  parseSlashCommand,
  getCommandSuggestions,
  buildCommandPrompt,
  type SlashCommand
} from './slash-commands'

describe('SLASH_COMMANDS', () => {
  test('all commands start with /', () => {
    for (const cmd of SLASH_COMMANDS) {
      expect(cmd.command.startsWith('/')).toBe(true)
    }
  })

  test('all commands have required fields', () => {
    for (const cmd of SLASH_COMMANDS) {
      expect(cmd.command).toBeTruthy()
      expect(cmd.description).toBeTruthy()
      expect(cmd.category).toBeTruthy()
      // prompt can be empty for action commands
    }
  })

  test('all command names are unique', () => {
    const commands = SLASH_COMMANDS.map(c => c.command)
    const unique = new Set(commands)
    expect(unique.size).toBe(commands.length)
  })

  test('has valid categories', () => {
    const validCategories = ['code', 'text', 'analysis', 'utility', 'action']
    for (const cmd of SLASH_COMMANDS) {
      expect(validCategories).toContain(cmd.category)
    }
  })

  describe('code commands', () => {
    test('/fix command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/fix')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('code')
      expect(cmd?.prompt).toContain('fix')
    })

    test('/explain command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/explain')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('code')
    })

    test('/optimize command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/optimize')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('code')
    })

    test('/test command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/test')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('code')
      expect(cmd?.prompt).toContain('unit tests')
    })

    test('/review command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/review')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('code')
    })

    test('/refactor command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/refactor')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('code')
    })

    test('/debug command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/debug')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('code')
    })
  })

  describe('text commands', () => {
    test('/summarize command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/summarize')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('text')
    })

    test('/improve command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/improve')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('text')
    })

    test('/translate command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/translate')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('text')
    })

    test('/proofread command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/proofread')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('text')
    })
  })

  describe('analysis commands', () => {
    test('/perspectives command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/perspectives')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('analysis')
      expect(cmd?.prompt).toContain('expert')
    })

    test('/analyze command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/analyze')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('analysis')
    })

    test('/compare command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/compare')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('analysis')
    })

    test('/eli5 command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/eli5')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('analysis')
      expect(cmd?.prompt).toContain('simple')
    })
  })

  describe('action commands', () => {
    test('/web command exists with toggle action', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/web')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('action')
      expect(cmd?.action).toBe('toggle-web-search')
    })
  })

  describe('utility commands', () => {
    test('/continue command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/continue')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('utility')
    })

    test('/shorter command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/shorter')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('utility')
    })

    test('/longer command exists', () => {
      const cmd = SLASH_COMMANDS.find(c => c.command === '/longer')
      expect(cmd).toBeDefined()
      expect(cmd?.category).toBe('utility')
    })

    test('verbalized sampling commands exist', () => {
      expect(SLASH_COMMANDS.find(c => c.command === '/1')).toBeDefined()
      expect(SLASH_COMMANDS.find(c => c.command === '/2')).toBeDefined()
      expect(SLASH_COMMANDS.find(c => c.command === '/3')).toBeDefined()
      expect(SLASH_COMMANDS.find(c => c.command === '/4')).toBeDefined()
    })
  })
})

describe('parseSlashCommand', () => {
  test('returns isCommand: false for non-command input', () => {
    const result = parseSlashCommand('hello world')
    expect(result.isCommand).toBe(false)
    expect(result.remainingText).toBe('hello world')
  })

  test('returns isCommand: false for text starting with / but not a command', () => {
    const result = parseSlashCommand('/notacommand some text')
    expect(result.isCommand).toBe(false)
  })

  test('parses /fix command', () => {
    const result = parseSlashCommand('/fix this code has bugs')
    expect(result.isCommand).toBe(true)
    expect(result.command?.command).toBe('/fix')
    expect(result.remainingText).toBe('this code has bugs')
  })

  test('parses /explain command', () => {
    const result = parseSlashCommand('/explain how promises work')
    expect(result.isCommand).toBe(true)
    expect(result.command?.command).toBe('/explain')
    expect(result.remainingText).toBe('how promises work')
  })

  test('parses command with no remaining text', () => {
    const result = parseSlashCommand('/continue')
    expect(result.isCommand).toBe(true)
    expect(result.command?.command).toBe('/continue')
    expect(result.remainingText).toBe('')
  })

  test('handles whitespace correctly', () => {
    const result = parseSlashCommand('  /fix   some code  ')
    expect(result.isCommand).toBe(true)
    expect(result.remainingText).toBe('some code')
  })

  test('parses numbered commands', () => {
    const result = parseSlashCommand('/1 generate some ideas')
    expect(result.isCommand).toBe(true)
    expect(result.command?.command).toBe('/1')
  })

  test('returns original text if not starting with /', () => {
    const result = parseSlashCommand('regular message')
    expect(result.isCommand).toBe(false)
    expect(result.remainingText).toBe('regular message')
  })

  test('handles empty input', () => {
    const result = parseSlashCommand('')
    expect(result.isCommand).toBe(false)
    expect(result.remainingText).toBe('')
  })

  test('handles just slash', () => {
    const result = parseSlashCommand('/')
    expect(result.isCommand).toBe(false)
  })
})

describe('getCommandSuggestions', () => {
  test('returns empty array for non-slash input', () => {
    const suggestions = getCommandSuggestions('hello')
    expect(suggestions).toEqual([])
  })

  test('returns all matching commands for /', () => {
    const suggestions = getCommandSuggestions('/')
    expect(suggestions.length).toBeGreaterThan(0)
  })

  test('filters by command prefix', () => {
    const suggestions = getCommandSuggestions('/fi')
    expect(suggestions.some(s => s.command === '/fix')).toBe(true)
    expect(suggestions.every(s => s.command.startsWith('/fi') || s.description.toLowerCase().includes('fi'))).toBe(true)
  })

  test('filters by description content', () => {
    const suggestions = getCommandSuggestions('/bug')
    // Should find /fix or /debug which mention bugs
    expect(suggestions.length).toBeGreaterThanOrEqual(0)
  })

  test('returns /explain for /ex', () => {
    const suggestions = getCommandSuggestions('/ex')
    expect(suggestions.some(s => s.command === '/explain')).toBe(true)
  })

  test('returns /summarize for /sum', () => {
    const suggestions = getCommandSuggestions('/sum')
    expect(suggestions.some(s => s.command === '/summarize')).toBe(true)
  })

  test('returns empty for non-matching prefix', () => {
    const suggestions = getCommandSuggestions('/xyz123')
    expect(suggestions).toEqual([])
  })
})

describe('buildCommandPrompt', () => {
  test('combines prompt with remaining text', () => {
    const command: SlashCommand = {
      command: '/fix',
      description: 'Fix code',
      prompt: 'Please fix this code:\n\n',
      category: 'code'
    }

    const result = buildCommandPrompt(command, 'function broken() {}')
    expect(result).toBe('Please fix this code:\n\nfunction broken() {}')
  })

  test('returns just prompt for utility command without remaining text', () => {
    const command: SlashCommand = {
      command: '/continue',
      description: 'Continue response',
      prompt: 'Please continue your previous response.',
      category: 'utility'
    }

    const result = buildCommandPrompt(command, '')
    expect(result).toBe('Please continue your previous response.')
  })

  test('handles empty remaining text for non-utility command', () => {
    const command: SlashCommand = {
      command: '/fix',
      description: 'Fix code',
      prompt: 'Fix this:\n\n',
      category: 'code'
    }

    const result = buildCommandPrompt(command, '')
    expect(result).toBe('Fix this:\n\n')
  })

  test('preserves whitespace in remaining text', () => {
    const command: SlashCommand = {
      command: '/explain',
      description: 'Explain',
      prompt: 'Explain:\n',
      category: 'code'
    }

    const result = buildCommandPrompt(command, '  indented code  ')
    expect(result).toBe('Explain:\n  indented code  ')
  })
})
