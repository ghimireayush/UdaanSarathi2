import { formatTime12Hour } from '../helpers'

describe('formatTime12Hour', () => {
  it('should format midnight correctly', () => {
    expect(formatTime12Hour('00:00:00')).toBe('12:00 AM')
    expect(formatTime12Hour('00:30:00')).toBe('12:30 AM')
  })

  it('should format morning times correctly', () => {
    expect(formatTime12Hour('06:00:00')).toBe('6:00 AM')
    expect(formatTime12Hour('09:30:00')).toBe('9:30 AM')
    expect(formatTime12Hour('11:45:00')).toBe('11:45 AM')
  })

  it('should format noon correctly', () => {
    expect(formatTime12Hour('12:00:00')).toBe('12:00 PM')
    expect(formatTime12Hour('12:30:00')).toBe('12:30 PM')
  })

  it('should format afternoon/evening times correctly', () => {
    expect(formatTime12Hour('13:00:00')).toBe('1:00 PM')
    expect(formatTime12Hour('14:30:00')).toBe('2:30 PM')
    expect(formatTime12Hour('18:45:00')).toBe('6:45 PM')
    expect(formatTime12Hour('23:59:00')).toBe('11:59 PM')
  })

  it('should handle time without seconds', () => {
    expect(formatTime12Hour('06:00')).toBe('6:00 AM')
    expect(formatTime12Hour('14:30')).toBe('2:30 PM')
  })

  it('should handle empty or invalid input', () => {
    expect(formatTime12Hour('')).toBe('')
    expect(formatTime12Hour(null)).toBe('')
    expect(formatTime12Hour(undefined)).toBe('')
  })

  it('should match the data from API', () => {
    // Based on the API data provided
    expect(formatTime12Hour('12:30:00')).toBe('12:30 PM')
    expect(formatTime12Hour('06:00:00')).toBe('6:00 AM')
    expect(formatTime12Hour('07:00:00')).toBe('7:00 AM')
  })
})
