import { delay, formatCurrency, formatFileSize, truncateText } from '../helpers'

describe('Helper Functions', () => {
  describe('delay', () => {
    test('resolves after specified time', async () => {
      const start = Date.now()
      await delay(50) // Use shorter delay for tests
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(40) // Allow some margin
    }, 1000)
  })

  describe('formatCurrency', () => {
    test('formats currency correctly', () => {
      const result = formatCurrency(1000)
      expect(result).toContain('1,000')
      expect(typeof result).toBe('string')
    })

    test('handles zero', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
    })

    test('handles decimal values', () => {
      const result = formatCurrency(1234.56)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('formatFileSize', () => {
    test('formats bytes correctly', () => {
      expect(formatFileSize(1024)).toContain('KB')
      expect(formatFileSize(1048576)).toContain('MB')
      expect(formatFileSize(1073741824)).toContain('GB')
    })

    test('handles small sizes', () => {
      const result = formatFileSize(500)
      expect(result).toContain('500')
      expect(result).toContain('B')
    })

    test('handles zero', () => {
      const result = formatFileSize(0)
      expect(result).toContain('0')
    })
  })

  describe('truncateText', () => {
    test('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated'
      const result = truncateText(longText, 20)
      
      expect(result.length).toBeLessThanOrEqual(23) // 20 + '...'
      expect(result).toContain('...')
    })

    test('returns original text if shorter', () => {
      const shortText = 'Short text'
      const result = truncateText(shortText, 20)
      
      expect(result).toBe('Short text')
    })

    test('handles empty string', () => {
      const result = truncateText('', 10)
      expect(result).toBe('')
    })
  })
})