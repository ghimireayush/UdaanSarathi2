import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'

// Mock useDebounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Mock React for the test
const React = {
  useState: jest.fn(),
  useEffect: jest.fn()
}

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const initialValue = 'test'
    React.useState.mockReturnValue([initialValue, jest.fn()])
    React.useEffect.mockImplementation((fn) => fn())

    const result = useDebounce(initialValue, 500)
    expect(result).toBe(initialValue)
  })

  it('should debounce value changes', () => {
    let currentValue = 'initial'
    const setValue = jest.fn()
    
    React.useState.mockImplementation((initial) => [currentValue, setValue])
    React.useEffect.mockImplementation((fn) => {
      const cleanup = fn()
      return cleanup
    })

    // First call
    useDebounce('initial', 500)
    
    // Change value
    currentValue = 'changed'
    useDebounce('changed', 500)

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(setValue).toHaveBeenCalledWith('changed')
  })

  it('should cancel previous timeout on value change', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    
    React.useState.mockReturnValue(['test', jest.fn()])
    React.useEffect.mockImplementation((fn) => {
      const cleanup = fn()
      if (cleanup) cleanup()
    })

    useDebounce('test1', 500)
    useDebounce('test2', 500)

    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2)
  })

  it('should handle different delay values', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    
    React.useState.mockReturnValue(['test', jest.fn()])
    React.useEffect.mockImplementation((fn) => fn())

    useDebounce('test', 1000)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)

    useDebounce('test', 200)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200)
  })
})