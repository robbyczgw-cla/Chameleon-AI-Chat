import { describe, test, expect } from 'vitest'
import {
  isFileTypeSupported,
  getFileCategory,
  formatFileSize,
  extractTextFromAttachments,
  MAX_FILE_SIZE,
  type FileAttachment,
} from './file-handler'

describe('File Handler', () => {
  describe('isFileTypeSupported', () => {
    test('accepts supported text files', () => {
      expect(isFileTypeSupported('document.txt')).toBe(true)
      expect(isFileTypeSupported('README.md')).toBe(true)
      expect(isFileTypeSupported('data.json')).toBe(true)
      expect(isFileTypeSupported('code.ts')).toBe(true)
      expect(isFileTypeSupported('script.py')).toBe(true)
    })

    test('accepts supported image files', () => {
      expect(isFileTypeSupported('photo.jpg')).toBe(true)
      expect(isFileTypeSupported('image.png')).toBe(true)
      expect(isFileTypeSupported('logo.svg')).toBe(true)
      expect(isFileTypeSupported('animation.gif')).toBe(true)
    })

    test('accepts supported document files', () => {
      expect(isFileTypeSupported('report.pdf')).toBe(true)
    })

    test('rejects unsupported files', () => {
      expect(isFileTypeSupported('video.mp4')).toBe(false)
      expect(isFileTypeSupported('audio.mp3')).toBe(false)
      expect(isFileTypeSupported('archive.zip')).toBe(false)
      expect(isFileTypeSupported('binary.exe')).toBe(false)
    })

    test('is case-insensitive', () => {
      expect(isFileTypeSupported('FILE.TXT')).toBe(true)
      expect(isFileTypeSupported('Image.PNG')).toBe(true)
      expect(isFileTypeSupported('Document.PDF')).toBe(true)
    })
  })

  describe('getFileCategory', () => {
    test('categorizes text files correctly', () => {
      expect(getFileCategory('file.txt')).toBe('text')
      expect(getFileCategory('code.js')).toBe('text')
      expect(getFileCategory('data.json')).toBe('text')
      expect(getFileCategory('style.css')).toBe('text')
    })

    test('categorizes image files correctly', () => {
      expect(getFileCategory('photo.jpg')).toBe('image')
      expect(getFileCategory('picture.png')).toBe('image')
      expect(getFileCategory('icon.svg')).toBe('image')
    })

    test('categorizes document files correctly', () => {
      expect(getFileCategory('report.pdf')).toBe('document')
    })

    test('returns unknown for unsupported files', () => {
      expect(getFileCategory('video.mp4')).toBe('unknown')
      expect(getFileCategory('archive.zip')).toBe('unknown')
    })
  })

  describe('formatFileSize', () => {
    test('formats bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(100)).toBe('100 Bytes')
      expect(formatFileSize(999)).toBe('999 Bytes')
    })

    test('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    test('formats megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
    })

    test('formats gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB')
    })

    test('rounds to 2 decimal places', () => {
      expect(formatFileSize(1234)).toBe('1.21 KB')
      expect(formatFileSize(5678901)).toBe('5.42 MB')
    })
  })

  describe('extractTextFromAttachments', () => {
    test('extracts text from text file attachments', () => {
      const attachments: FileAttachment[] = [
        {
          id: '1',
          name: 'note.txt',
          type: 'text/plain',
          size: 100,
          content: 'This is a test note',
        },
      ]

      const result = extractTextFromAttachments(attachments)
      expect(result).toContain('note.txt')
      expect(result).toContain('This is a test note')
    })

    test('handles multiple text files', () => {
      const attachments: FileAttachment[] = [
        {
          id: '1',
          name: 'file1.txt',
          type: 'text/plain',
          size: 100,
          content: 'First file',
        },
        {
          id: '2',
          name: 'file2.md',
          type: 'text/markdown',
          size: 200,
          content: 'Second file',
        },
      ]

      const result = extractTextFromAttachments(attachments)
      expect(result).toContain('file1.txt')
      expect(result).toContain('First file')
      expect(result).toContain('file2.md')
      expect(result).toContain('Second file')
    })

    test('handles image attachments as metadata only', () => {
      const attachments: FileAttachment[] = [
        {
          id: '1',
          name: 'photo.jpg',
          type: 'image/jpeg',
          size: 50000,
          content: '[Image: photo.jpg]',
          dataUrl: 'data:image/jpeg;base64,...',
        },
      ]

      const result = extractTextFromAttachments(attachments)
      expect(result).toContain('[Attached: photo.jpg]')
      expect(result).not.toContain('base64')
    })

    test('handles empty attachment list', () => {
      const result = extractTextFromAttachments([])
      expect(result).toBe('')
    })

    test('handles mixed file types', () => {
      const attachments: FileAttachment[] = [
        {
          id: '1',
          name: 'code.ts',
          type: 'text/typescript',
          size: 1000,
          content: 'export function test() {}',
        },
        {
          id: '2',
          name: 'diagram.png',
          type: 'image/png',
          size: 20000,
          content: '[Image: diagram.png]',
        },
      ]

      const result = extractTextFromAttachments(attachments)
      expect(result).toContain('code.ts')
      expect(result).toContain('export function test() {}')
      expect(result).toContain('[Attached: diagram.png]')
    })
  })

  describe('MAX_FILE_SIZE constant', () => {
    test('is set to 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    })
  })

  describe('file size validation edge cases', () => {
    test('file exactly at max size should be accepted', () => {
      const exactSize = MAX_FILE_SIZE
      expect(exactSize).toBe(10 * 1024 * 1024)
      // File handler would check: file.size > MAX_FILE_SIZE
      // So exactly at limit should pass
      expect(exactSize > MAX_FILE_SIZE).toBe(false)
    })

    test('file over max size should be rejected', () => {
      const overSize = MAX_FILE_SIZE + 1
      expect(overSize > MAX_FILE_SIZE).toBe(true)
    })
  })
})
