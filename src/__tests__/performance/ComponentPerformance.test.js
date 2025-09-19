import { render, screen } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'

// Mock performance measurement
const measurePerformance = (name, fn) => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  const duration = end - start
  
  console.log(`${name} took ${duration.toFixed(2)}ms`)
  return { result, duration }
}

// Mock large dataset
const generateMockData = (count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `item_${index}`,
    name: `Item ${index}`,
    description: `Description for item ${index}`,
    status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'pending' : 'inactive',
    created_date: new Date(2023, 0, index + 1).toISOString()
  }))
}

// Mock optimized list component
const OptimizedList = ({ items, renderItem }) => {
  // Simulate virtualization or pagination
  const visibleItems = items.slice(0, 50) // Only render first 50 items
  
  return (
    <div data-testid="optimized-list">
      {visibleItems.map(renderItem)}
      {items.length > 50 && (
        <div data-testid="load-more">
          Showing 50 of {items.length} items
        </div>
      )}
    </div>
  )
}

// Mock unoptimized list component
const UnoptimizedList = ({ items, renderItem }) => {
  return (
    <div data-testid="unoptimized-list">
      {items.map(renderItem)}
    </div>
  )
}

describe('Component Performance Tests', () => {
  const smallDataset = generateMockData(10)
  const mediumDataset = generateMockData(100)
  const largeDataset = generateMockData(1000)

  const renderItem = (item) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <span>{item.status}</span>
    </div>
  )

  describe('List Rendering Performance', () => {
    it('should render small dataset quickly', () => {
      const { duration } = measurePerformance('Small dataset render', () => {
        return render(<OptimizedList items={smallDataset} renderItem={renderItem} />)
      })

      expect(duration).toBeLessThan(100) // Should render in less than 100ms
      expect(screen.getByTestId('optimized-list')).toBeInTheDocument()
    })

    it('should handle medium dataset efficiently', () => {
      const { duration } = measurePerformance('Medium dataset render', () => {
        return render(<OptimizedList items={mediumDataset} renderItem={renderItem} />)
      })

      expect(duration).toBeLessThan(200) // Should render in less than 200ms
      expect(screen.getByTestId('optimized-list')).toBeInTheDocument()
      expect(screen.getByTestId('load-more')).toBeInTheDocument()
    })

    it('should optimize large dataset rendering', () => {
      const { duration } = measurePerformance('Large dataset render', () => {
        return render(<OptimizedList items={largeDataset} renderItem={renderItem} />)
      })

      expect(duration).toBeLessThan(300) // Should render in less than 300ms
      expect(screen.getByTestId('optimized-list')).toBeInTheDocument()
      expect(screen.getByText('Showing 50 of 1000 items')).toBeInTheDocument()
    })

    it('should show performance difference between optimized and unoptimized', () => {
      const optimizedResult = measurePerformance('Optimized large list', () => {
        return render(<OptimizedList items={largeDataset} renderItem={renderItem} />)
      })

      // Clean up
      optimizedResult.result.unmount()

      const unoptimizedResult = measurePerformance('Unoptimized large list', () => {
        return render(<UnoptimizedList items={largeDataset} renderItem={renderItem} />)
      })

      // Optimized should be significantly faster
      expect(optimizedResult.duration).toBeLessThan(unoptimizedResult.duration)
      
      console.log(`Performance improvement: ${(unoptimizedResult.duration / optimizedResult.duration).toFixed(2)}x faster`)
    })
  })

  describe('Memory Usage', () => {
    it('should not create excessive DOM nodes', () => {
      render(<OptimizedList items={largeDataset} renderItem={renderItem} />)
      
      // Should only render 50 items even with 1000 in dataset
      const renderedItems = screen.getAllByTestId(/^item-/)
      expect(renderedItems.length).toBe(50)
    })

    it('should handle component cleanup properly', () => {
      const { unmount } = render(<OptimizedList items={mediumDataset} renderItem={renderItem} />)
      
      // Verify component renders
      expect(screen.getByTestId('optimized-list')).toBeInTheDocument()
      
      // Cleanup should not throw errors
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Re-render Performance', () => {
    it('should handle prop updates efficiently', () => {
      const { rerender } = render(<OptimizedList items={smallDataset} renderItem={renderItem} />)
      
      const { duration } = measurePerformance('Re-render with new data', () => {
        const newData = generateMockData(15)
        rerender(<OptimizedList items={newData} renderItem={renderItem} />)
      })

      expect(duration).toBeLessThan(50) // Re-renders should be fast
    })

    it('should optimize when data does not change', () => {
      const { rerender } = render(<OptimizedList items={smallDataset} renderItem={renderItem} />)
      
      const { duration } = measurePerformance('Re-render with same data', () => {
        rerender(<OptimizedList items={smallDataset} renderItem={renderItem} />)
      })

      expect(duration).toBeLessThan(25) // Same data re-renders should be very fast
    })
  })

  describe('Search Performance', () => {
    it('should filter large datasets efficiently', () => {
      const searchTerm = 'Item 1'
      
      const { duration } = measurePerformance('Filter large dataset', () => {
        return largeDataset.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })

      expect(duration).toBeLessThan(10) // Filtering should be very fast
    })

    it('should handle complex search queries', () => {
      const complexFilter = (item) => {
        return item.name.includes('1') && 
               item.status === 'active' && 
               new Date(item.created_date).getMonth() === 0
      }

      const { duration } = measurePerformance('Complex filter', () => {
        return largeDataset.filter(complexFilter)
      })

      expect(duration).toBeLessThan(20) // Complex filtering should still be fast
    })
  })

  describe('Accessibility Performance', () => {
    it('should not impact performance with accessibility attributes', () => {
      const AccessibleItem = ({ item }) => (
        <div 
          key={item.id}
          role="listitem"
          aria-label={`${item.name} - ${item.status}`}
          tabIndex={0}
        >
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <span aria-live="polite">{item.status}</span>
        </div>
      )

      const { duration } = measurePerformance('Accessible components', () => {
        return render(
          <div role="list">
            <OptimizedList items={mediumDataset} renderItem={AccessibleItem} />
          </div>
        )
      })

      expect(duration).toBeLessThan(250) // Accessibility should not significantly impact performance
    })
  })
})